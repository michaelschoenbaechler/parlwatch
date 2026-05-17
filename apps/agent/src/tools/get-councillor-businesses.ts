import { Type, type Static } from "typebox";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { getCouncillorBusinesses, type BusinessRole } from "../clients/parlament.js";
import { formatODataDate } from "../utils/odata.js";

const params = Type.Object({
  person_number: Type.Number({
    description:
      "Die PersonNumber des Ratsmitglieds (aus search_councillor). Wird benötigt um die Vorstösse zuzuordnen.",
  }),
  type: Type.Optional(
    Type.String({
      description:
        "Auf eine Geschäftsart beschränken. Häufige Werte: Mo. (Motion), Ip. (Interpellation), Po. (Postulat), Pa.Iv. (Parlamentarische Initiative), Fra. (Anfrage).",
    })
  ),
});

type Params = Static<typeof params>;

function formatBusinessRole(r: BusinessRole): string {
  const num = r.BusinessShortNumber ?? "?";
  const type = r.BusinessTypeAbbreviation ?? "?";
  const role = r.RoleName ?? "?";
  const submitted = formatODataDate(r.BusinessSubmissionDate) ?? "?";

  return [
    `${num} — ${type} | ${role}`,
    `  ${r.BusinessTitle ?? "(kein Titel)"}`,
    `  Eingereicht: ${submitted}`,
  ].join("\n");
}

export const getCouncillorBusinessesTool: AgentTool<typeof params, BusinessRole[]> = {
  name: "get_councillor_businesses",
  label: "Get Councillor Businesses",
  description:
    "Gibt alle parlamentarischen Geschäfte zurück, an denen ein bestimmtes Ratsmitglied beteiligt war " +
    "(als Einreicher, Mitunterzeichner usw.). " +
    "Erfordert die PersonNumber aus search_councillor. Gibt maximal 50 Einträge zurück.",
  parameters: params,

  async execute(_toolCallId, { person_number, type }: Params) {
    const results = await getCouncillorBusinesses({
      personNumber: person_number,
      type,
    });

    if (results.length === 0) {
      return {
        content: [{ type: "text" as const, text: "Keine Geschäfte für dieses Ratsmitglied gefunden." }],
        details: [],
      };
    }

    const text = results.map(formatBusinessRole).join("\n\n");
    return {
      content: [{ type: "text" as const, text }],
      details: results,
    };
  },
};
