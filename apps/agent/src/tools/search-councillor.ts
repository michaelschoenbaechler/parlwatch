import { Type, type Static } from "typebox";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { searchCouncilMembers, type MemberCouncil } from "../clients/parlament.js";

const params = Type.Object({
  name: Type.Optional(
    Type.String({
      description:
        "Suche nach Vor- oder Nachname (Teilstring). Mindestens eines von name, canton oder council muss angegeben sein.",
    })
  ),
  canton: Type.Optional(
    Type.String({
      description: "Kantonskürzel (z. B. ZH, BE, GE). Filtert nach Heimatkanton.",
    })
  ),
  council: Type.Optional(
    Type.Union([Type.Literal("NR"), Type.Literal("SR")], {
      description: "NR = Nationalrat, SR = Ständerat. Leer lässt beide Kammern zurück.",
    })
  ),
  active_only: Type.Optional(
    Type.Boolean({
      description: "Wenn true, werden nur aktuell amtierende Ratsmitglieder zurückgegeben. Standard: true.",
    })
  ),
});

type Params = Static<typeof params>;

function formatCouncilMember(m: MemberCouncil): string {
  const chamber = m.CouncilAbbreviation ?? "?";
  const canton = m.CantonAbbreviation ?? "?";
  const parlGroup = m.ParlGroupAbbreviation ?? "?";
  const party = m.PartyAbbreviation ?? "?";
  const status = m.Active ? "aktiv" : `ausgeschieden ${m.DateLeaving?.slice(0, 10) ?? ""}`;

  return [
    `${m.OfficialName ?? `${m.FirstName} ${m.LastName}`} (${chamber}, ${canton})`,
    `  Fraktion: ${m.ParlGroupName ?? parlGroup} | Partei: ${party}`,
    `  Eingetreten: ${m.DateJoining?.slice(0, 10) ?? "?"} | Status: ${status}`,
    m.AdditionalMandate ? `  Weitere Mandate: ${m.AdditionalMandate}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export const searchCouncillorTool: AgentTool<typeof params, MemberCouncil[]> = {
  name: "search_councillor",
  label: "Search Councillor",
  description:
    "Sucht Ratsmitglieder (National- und Ständeräte) in der Parlamentsdatenbank. " +
    "Gibt Name, Kammer (NR/SR), Kanton, Fraktion, Partei, Eintrittsdatum und Status zurück. " +
    "Mindestens ein Suchkriterium (name, canton oder council) muss angegeben sein. " +
    "Gibt maximal 20 Treffer zurück.",
  parameters: params,

  async execute(_toolCallId, { name, canton, council, active_only }: Params) {
    if (!name && !canton && !council) {
      throw new Error("Mindestens ein Suchkriterium (name, canton oder council) muss angegeben werden.");
    }

    const results = await searchCouncilMembers({
      name,
      canton,
      council,
      active: active_only ?? true,
    });

    if (results.length === 0) {
      return {
        content: [{ type: "text" as const, text: "Keine Ratsmitglieder gefunden." }],
        details: [],
      };
    }

    const text = results.map(formatCouncilMember).join("\n\n");
    return {
      content: [{ type: "text" as const, text }],
      details: results,
    };
  },
};
