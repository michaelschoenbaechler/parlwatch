import { exec } from "child_process";
import * as readline from "readline";
import { loginAnthropic, getOAuthApiKey } from "@earendil-works/pi-ai/oauth";
import { loadCredentials, saveCredentials, type CredentialsStore } from "./credentials.js";

function openBrowser(url: string): void {
  const cmd =
    process.platform === "darwin" ? `open "${url}"` :
    process.platform === "win32" ? `start "" "${url}"` :
    `xdg-open "${url}"`;
  exec(cmd);
}

async function runLoginFlow(): Promise<CredentialsStore> {
  const rl = readline.createInterface({ input: process.stdin, output: process.stdout });
  const ask = (q: string) => new Promise<string>((resolve) => rl.question(q, resolve));

  try {
    process.stdout.write("\nAnmeldung bei Anthropic (Claude Pro/Max)\n");
    process.stdout.write("─".repeat(42) + "\n\n");

    const creds = await loginAnthropic({
      onAuth: ({ url }) => {
        process.stdout.write("Öffne Browser für die Anmeldung...\n");
        process.stdout.write(`URL: ${url}\n\n`);
        openBrowser(url);
        process.stdout.write("Warte auf Browser-Antwort (Port 53692)...\n");
      },
      onProgress: (msg) => process.stdout.write(`\r${msg}   `),
      onManualCodeInput: () =>
        ask("\nRedirect-URL einfügen (falls Browser auf anderem Gerät): "),
      onPrompt: ({ message }) => ask(`${message}: `),
    });

    process.stdout.write("\n✓ Anmeldung erfolgreich\n\n");
    return { anthropic: creds };
  } finally {
    rl.close();
  }
}

/**
 * Returns a getApiKey function for the Agent.
 *
 * Priority:
 *  1. ANTHROPIC_API_KEY env var → pi-ai reads it from env, no OAuth needed
 *  2. ANTHROPIC_OAUTH_TOKEN env var → pi-ai reads it from env, no OAuth needed
 *  3. Stored credentials → auto-refresh via getOAuthApiKey
 *  4. No credentials → interactive login flow, then store
 */
export async function buildGetApiKey(): Promise<(provider: string) => Promise<string | undefined>> {
  if (process.env.ANTHROPIC_API_KEY || process.env.ANTHROPIC_OAUTH_TOKEN) {
    // Static key in env — pi-ai handles it, no dynamic key needed.
    return async () => undefined;
  }

  let store: CredentialsStore = loadCredentials() ?? {};

  if (!store["anthropic"]) {
    const acquired = await runLoginFlow();
    store = { ...store, ...acquired };
    saveCredentials(store);
  }

  return async (provider: string) => {
    if (provider !== "anthropic") return undefined;
    const result = await getOAuthApiKey("anthropic", store);
    if (!result) return undefined;
    store["anthropic"] = result.newCredentials;
    saveCredentials(store);
    return result.apiKey;
  };
}
