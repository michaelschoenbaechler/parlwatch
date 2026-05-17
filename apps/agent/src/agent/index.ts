import { Agent } from "@earendil-works/pi-agent-core";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import type { Model } from "@earendil-works/pi-ai";
import { registerBuiltInApiProviders } from "@earendil-works/pi-ai";
import { SYSTEM_PROMPT } from "./system-prompt.js";

registerBuiltInApiProviders();
import { createAskUserTool, type PromptUserFn } from "../tools/ask-user.js";
import { searchCouncillorTool } from "../tools/search-councillor.js";
import { searchBusinessTool } from "../tools/search-business.js";

const model: Model<"anthropic-messages"> = {
  id: process.env.MODEL_ID ?? "claude-sonnet-4-6",
  name: "Claude Sonnet 4.6",
  api: "anthropic-messages",
  provider: "anthropic",
  baseUrl: "https://api.anthropic.com",
  reasoning: false,
  input: ["text"],
  cost: { input: 3, output: 15, cacheRead: 0.3, cacheWrite: 3.75 },
  contextWindow: 200000,
  maxTokens: 8192,
};

export function createAgent(
  promptUser: PromptUserFn,
  getApiKey?: (provider: string) => Promise<string | undefined>
) {
  const tools: AgentTool[] = [
    createAskUserTool(promptUser),
    searchCouncillorTool,
    searchBusinessTool,
  ];

  return new Agent({
    initialState: {
      systemPrompt: `${SYSTEM_PROMPT}\n\nHeutiges Datum: ${new Date().toISOString().slice(0, 10)}.`,
      model,
      tools,
    },
    getApiKey,
  });
}
