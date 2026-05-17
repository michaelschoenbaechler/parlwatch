import { Type, type Static } from "typebox";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { getCouncillorInterests, type PersonInterest } from "../clients/parlament.js";

const params = Type.Object({
  person_number: Type.Number({
    description:
      "Die PersonNumber des Ratsmitglieds (aus search_councillor). Wird benötigt um die Interessenbindungen zuzuordnen.",
  }),
});

type Params = Static<typeof params>;

function formatInterest(i: PersonInterest): string {
  const agency = i.Agency ?? i.InterestName ?? "(unbekannte Organisation)";
  const parts: string[] = [i.Paid ? `[bezahlt] ${agency}` : agency];

  const details: string[] = [];
  if (i.FunctionInAgencyText) details.push(`Funktion: ${i.FunctionInAgencyText}`);
  if (i.OrganizationTypeText) details.push(`Organisationstyp: ${i.OrganizationTypeText}`);
  if (i.InterestTypeText) details.push(`Mandatsart: ${i.InterestTypeText}`);
  if (details.length > 0) parts.push(`  ${details.join(" | ")}`);

  return parts.join("\n");
}

export const getCouncillorInterestsTool: AgentTool<typeof params, PersonInterest[]> = {
  name: "get_councillor_interests",
  label: "Get Councillor Interests",
  description:
    "Gibt die deklarierten Interessenbindungen (Mandate, Vereinsmitgliedschaften, bezahlte Tätigkeiten usw.) " +
    "eines Ratsmitglieds zurück. " +
    "Erfordert die PersonNumber aus search_councillor.",
  parameters: params,

  async execute(_toolCallId, { person_number }: Params) {
    const results = await getCouncillorInterests({ personNumber: person_number });

    if (results.length === 0) {
      return {
        content: [{ type: "text" as const, text: "Keine Interessenbindungen deklariert." }],
        details: [],
      };
    }

    const text = results.map(formatInterest).join("\n\n");
    return {
      content: [{ type: "text" as const, text }],
      details: results,
    };
  },
};
