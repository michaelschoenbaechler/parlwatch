import { homedir } from "os";
import { join } from "path";
import { readFileSync, writeFileSync, mkdirSync, existsSync } from "fs";
import type { OAuthCredentials } from "@earendil-works/pi-ai/oauth";

export type CredentialsStore = Record<string, OAuthCredentials>;

const CREDENTIALS_DIR = join(homedir(), ".parlwatch-agent");
const CREDENTIALS_FILE = join(CREDENTIALS_DIR, "credentials.json");

export function loadCredentials(): CredentialsStore | null {
  if (!existsSync(CREDENTIALS_FILE)) return null;
  try {
    return JSON.parse(readFileSync(CREDENTIALS_FILE, "utf-8")) as CredentialsStore;
  } catch {
    return null;
  }
}

export function saveCredentials(store: CredentialsStore): void {
  mkdirSync(CREDENTIALS_DIR, { recursive: true });
  writeFileSync(CREDENTIALS_FILE, JSON.stringify(store, null, 2), { encoding: "utf-8", mode: 0o600 });
}
