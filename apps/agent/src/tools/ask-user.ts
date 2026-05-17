import { Type, type Static } from "typebox";
import type { AgentTool } from "@earendil-works/pi-agent-core";

const params = Type.Object({
  question: Type.String({ description: "Die Frage, die dem Benutzer angezeigt wird." }),
  options: Type.Array(
    Type.Object({
      value: Type.String({ description: "Interner Wert der Option." }),
      label: Type.String({ description: "Angezeigte Bezeichnung der Option." }),
      description: Type.Optional(Type.String({ description: "Optionale Zusatzinformation zur Option." })),
    }),
    { description: "Liste der auswählbaren Optionen." }
  ),
});

type Params = Static<typeof params>;

export type PromptUserFn = (
  question: string,
  options: Array<{ value: string; label: string; description?: string }>
) => Promise<string>;

export function createAskUserTool(promptUser: PromptUserFn): AgentTool<typeof params, string> {
  return {
    name: "ask_user",
    label: "Ask User",
    description:
      "Zeigt dem Benutzer eine Auswahlliste mit vordefinierten Optionen an und gibt den gewählten Wert zurück. " +
      "Verwende dieses Werkzeug immer dann, wenn die Antwort eine begrenzte Anzahl gültiger Werte hat " +
      "(z. B. Ratskammer, Fraktion, Kanton, Ja/Nein-Fragen). Für Freitext-Eingaben (Namen, Suchanfragen) " +
      "stelle die Frage direkt im Gespräch.",
    parameters: params,
    executionMode: "sequential",
    async execute(_toolCallId, { question, options }: Params) {
      const selectedValue = await promptUser(question, options);
      return {
        content: [{ type: "text" as const, text: selectedValue }],
        details: selectedValue,
      };
    },
  };
}
