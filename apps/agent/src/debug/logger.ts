import { mkdir, writeFile, appendFile } from "fs/promises";
import { join } from "path";
import { homedir } from "os";

const baseDir = join(homedir(), ".parlwatch-agent", "sessions");

function makeSessionDirName(): string {
  return new Date().toISOString().replace(/:/g, "-").slice(0, 19);
}

function rule(label: string): string {
  const line = "─".repeat(Math.max(0, 60 - label.length - 3));
  return `── ${label} ${line}`;
}

export class SessionLogger {
  readonly sessionDir: string;
  private ready: Promise<void>;
  private callCount = 0;
  private startTimes = new Map<string, { startedAt: number; toolName: string; index: number }>();

  constructor() {
    this.sessionDir = join(baseDir, makeSessionDirName());
    this.ready = mkdir(this.sessionDir, { recursive: true }).then(() => undefined);
  }

  async logToolStart(toolCallId: string, toolName: string, args: unknown): Promise<void> {
    await this.ready;
    this.callCount++;
    this.startTimes.set(toolCallId, {
      startedAt: Date.now(),
      toolName,
      index: this.callCount,
    });

    const filePath = this.callFilePath(toolCallId);
    const content = [
      `Tool:    ${toolName}`,
      `Started: ${new Date().toISOString()}`,
      ``,
      rule("Arguments"),
      JSON.stringify(args, null, 2),
      ``,
    ].join("\n");

    await writeFile(filePath, content, "utf-8");
  }

  async logToolEnd(
    toolCallId: string,
    result: unknown,
    isError: boolean
  ): Promise<string | null> {
    await this.ready;
    const info = this.startTimes.get(toolCallId);
    if (!info) return null;
    const filePath = this.callFilePath(toolCallId);
    this.startTimes.delete(toolCallId);

    const durationMs = Date.now() - info.startedAt;

    const resultText =
      (result as any)?.content?.[0]?.text ?? JSON.stringify(result, null, 2);

    const suffix = isError ? " (ERROR)" : "";
    const content = [
      rule(`Result${suffix}`) + `  ${(durationMs / 1000).toFixed(2)}s`,
      resultText,
      ``,
      rule("Raw"),
      JSON.stringify(result, null, 2),
      ``,
    ].join("\n");

    await appendFile(filePath, content, "utf-8");
    return filePath;
  }

  private callFilePath(toolCallId: string): string {
    const info = this.startTimes.get(toolCallId);
    if (!info) return join(this.sessionDir, `${toolCallId}.log`);
    return join(
      this.sessionDir,
      `${String(info.index).padStart(2, "0")}-${info.toolName}.log`
    );
  }
}
