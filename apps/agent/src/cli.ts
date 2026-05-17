import "dotenv/config";
import chalk from "chalk";
import {
  Container,
  Editor,
  Loader,
  Markdown,
  ProcessTerminal,
  SelectList,
  Spacer,
  Text,
  TUI,
  Key,
  matchesKey,
  type Component,
  type EditorTheme,
  type MarkdownTheme,
  type SelectItem,
  type SelectListTheme,
} from "@earendil-works/pi-tui";
import type { AgentEvent } from "@earendil-works/pi-agent-core";
import { createAgent } from "./agent/index.js";
import { buildGetApiKey } from "./auth/login.js";

const markdownTheme: MarkdownTheme = {
  heading: (s) => chalk.bold.cyan(s),
  link: (s) => chalk.cyan.underline(s),
  linkUrl: (s) => chalk.dim(s),
  code: (s) => chalk.yellow(s),
  codeBlock: (s) => chalk.yellow(s),
  codeBlockBorder: (s) => chalk.dim(s),
  quote: (s) => chalk.italic(s),
  quoteBorder: (s) => chalk.dim(s),
  hr: (s) => chalk.dim(s),
  listBullet: (s) => chalk.dim(s),
  bold: (s) => chalk.bold(s),
  italic: (s) => chalk.italic(s),
  strikethrough: (s) => chalk.strikethrough(s),
  underline: (s) => chalk.underline(s),
};

const selectListTheme: SelectListTheme = {
  selectedPrefix: () => chalk.cyan("> "),
  selectedText: (s) => chalk.cyan(s),
  description: (s) => chalk.dim(s),
  scrollInfo: (s) => chalk.dim(s),
  noMatch: (s) => chalk.dim(s),
};

const editorTheme: EditorTheme = {
  borderColor: (s) => chalk.dim(s),
  selectList: selectListTheme,
};

// Renders a question label above a SelectList and forwards input to it.
class QuestionOverlay implements Component {
  private questionText: Text;
  private list: SelectList;

  constructor(question: string, items: SelectItem[]) {
    this.questionText = new Text(chalk.bold.cyan("? ") + chalk.bold(question), 1, 0);
    this.list = new SelectList(items, 8, selectListTheme);
  }

  get onSelect() { return this.list.onSelect; }
  set onSelect(fn: ((item: SelectItem) => void) | undefined) { this.list.onSelect = fn; }
  get onCancel() { return this.list.onCancel; }
  set onCancel(fn: (() => void) | undefined) { this.list.onCancel = fn; }

  invalidate() {
    this.questionText.invalidate();
    this.list.invalidate();
  }

  render(width: number): string[] {
    return [...this.questionText.render(width), ...this.list.render(width)];
  }

  handleInput(data: string) {
    this.list.handleInput(data);
  }
}

const terminal = new ProcessTerminal();
const tui = new TUI(terminal);
const history = new Container();
const editor = new Editor(tui, editorTheme);

let currentResponseMd: Markdown | null = null;
let currentResponseText = "";
let responseLabelAdded = false;
let activeLoader: Loader | null = null;

const promptUser = (
  question: string,
  options: Array<{ value: string; label: string; description?: string }>
) => {
  if (activeLoader) {
    activeLoader.stop();
    history.removeChild(activeLoader);
    activeLoader = null;
  }

  const items: SelectItem[] = options.map((o) => ({
    value: o.value,
    label: o.label,
    description: o.description,
  }));

  return new Promise<string>((resolve) => {
    const overlay = new QuestionOverlay(question, items);

    tui.setFocus(null);
    tui.removeChild(editor);
    tui.addChild(overlay);
    tui.requestRender();

    let removeInputListener: (() => void) | null = null;

    const finish = (value: string, label: string) => {
      removeInputListener?.();
      tui.removeChild(overlay);
      tui.addChild(editor);
      tui.setFocus(editor);
      history.addChild(
        new Text(
          chalk.bold.cyan("? ") + chalk.bold(question) + chalk.dim(": ") + chalk.cyan(label),
          1,
          0
        )
      );
      tui.requestRender();
      resolve(value);
    };

    overlay.onSelect = (item) => finish(item.value, item.label);
    overlay.onCancel = () => {
      const first = items[0];
      if (first) finish(first.value, first.label);
    };

    removeInputListener = tui.addInputListener((data) => {
      overlay.handleInput(data);
      tui.requestRender();
      return { consume: true };
    });
  });
};

(async () => {
  const getApiKey = await buildGetApiKey();
  const agent = createAgent(promptUser, getApiKey);

  agent.subscribe((event: AgentEvent) => {
    switch (event.type) {
      case "message_start": {
        if (currentResponseMd !== null) break;
        currentResponseText = "";
        responseLabelAdded = false;
        currentResponseMd = new Markdown("▌", 1, 0, markdownTheme);
        break;
      }

      case "message_update": {
        const raw = event.assistantMessageEvent;
        if (raw.type === "text_delta" && raw.delta && currentResponseMd) {
          if (!responseLabelAdded) {
            if (activeLoader) {
              activeLoader.stop();
              history.removeChild(activeLoader);
              activeLoader = null;
            }
            history.addChild(new Text(chalk.bold.blue("Assistent:"), 1, 0));
            history.addChild(currentResponseMd);
            responseLabelAdded = true;
          }
          currentResponseText += raw.delta;
          currentResponseMd.setText(currentResponseText + "▌");
          tui.requestRender();
        }
        break;
      }

      case "message_end": {
        const msg = event.message;
        if (msg.role === "assistant" && msg.stopReason === "error") {
          if (currentResponseMd && responseLabelAdded) {
            history.removeChild(currentResponseMd);
          }
          if (activeLoader) {
            activeLoader.stop();
            history.removeChild(activeLoader);
            activeLoader = null;
          }
          history.addChild(
            new Text(chalk.red(`Fehler: ${msg.errorMessage ?? "Unbekannter Fehler"}`), 1, 0)
          );
          history.addChild(new Spacer(1));
        } else if (currentResponseMd && responseLabelAdded) {
          currentResponseMd.setText(currentResponseText);
          history.addChild(new Spacer(1));
        }
        currentResponseMd = null;
        currentResponseText = "";
        responseLabelAdded = false;
        tui.requestRender();
        break;
      }

      case "tool_execution_start":
        history.addChild(new Text(chalk.dim(`⚙ ${event.toolName}`), 1, 0));
        tui.requestRender();
        break;

      case "tool_execution_end": {
        const resultText = event.result?.content?.[0]?.text ?? JSON.stringify(event.result);
        if (event.isError) {
          history.addChild(new Text(chalk.red(`  ✗ ${resultText}`), 0, 0));
        } else {
          history.addChild(
            new Text(
              chalk.dim(`  ✓ ${resultText.slice(0, 120)}${resultText.length > 120 ? "…" : ""}`),
              0,
              0
            )
          );
        }
        tui.requestRender();
        break;
      }

      case "agent_end": {
        const failed = event.messages.find(
          (m) => m.role === "assistant" && m.stopReason === "error" && m.errorMessage
        );
        if (failed && failed.role === "assistant" && !responseLabelAdded) {
          history.addChild(
            new Text(chalk.red(`[Fehler] ${failed.errorMessage ?? "Unbekannter Fehler"}`), 1, 0)
          );
          history.addChild(new Spacer(1));
        }
        editor.disableSubmit = false;
        tui.requestRender();
        break;
      }
    }
  });

  editor.onSubmit = async (text) => {
    if (!text.trim()) return;

    editor.disableSubmit = true;

    history.addChild(new Text(`${chalk.bold.green("Sie")}: ${text}`, 1, 0));

    activeLoader = new Loader(tui, (s) => chalk.cyan(s), (s) => chalk.dim(s), "Verarbeite…");
    history.addChild(activeLoader);
    activeLoader.start();
    tui.requestRender();

    try {
      await agent.prompt(text.trim());
    } catch (err) {
      if (activeLoader) {
        activeLoader.stop();
        history.removeChild(activeLoader);
        activeLoader = null;
      }
      history.addChild(
        new Text(
          chalk.red(`[Fehler] ${err instanceof Error ? err.message : String(err)}`),
          1,
          0
        )
      );
      history.addChild(new Spacer(1));
      editor.disableSubmit = false;
      tui.requestRender();
    }
  };

  tui.addChild(history);
  tui.addChild(new Spacer(1));
  tui.addChild(editor);
  tui.setFocus(editor);

  tui.addInputListener((data) => {
    if (matchesKey(data, Key.ctrl("c"))) {
      agent.abort();
      tui.stop();
      process.exit(0);
    }
    return undefined;
  });

  tui.start();
})().catch((err) => {
  console.error(chalk.red(`\nFehler: ${err instanceof Error ? err.message : String(err)}`));
  process.exit(1);
});
