import { Type, type Static } from "typebox";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { searchBusinesses, type Business } from "../clients/parlament.js";
import { formatODataDate } from "../utils/odata.js";

const params = Type.Object({
  keyword: Type.Optional(
    Type.String({
      description:
        "Stichwort im Titel des Geschäfts (Teilstring). Mindestens eines von keyword, type oder council muss angegeben sein.",
    })
  ),
  type: Type.Optional(
    Type.String({
      description:
        "Geschäftsart-Abkürzung. Häufige Werte: Mo. (Motion), Ip. (Interpellation), Po. (Postulat), Iv. (Initiative), Pa.Iv. (Parlamentarische Initiative), Fra. (Anfrage), Kt.Iv. (Standesinitiative).",
    })
  ),
  council: Type.Optional(
    Type.Union([Type.Literal("NR"), Type.Literal("SR")], {
      description: "Einreichende Kammer: NR = Nationalrat, SR = Ständerat.",
    })
  ),
  legislative_period: Type.Optional(
    Type.Number({
      description:
        "Legislaturperiode als Zahl (z. B. 51 für die laufende Periode 2023–2027, 50 für 2019–2023).",
    })
  ),
});

type Params = Static<typeof params>;

function formatBusiness(b: Business): string {
  const num = b.BusinessShortNumber ?? "?";
  const type = b.BusinessTypeAbbreviation ?? "?";
  const chamber = b.SubmissionCouncilAbbreviation ?? "?";
  const submitted = formatODataDate(b.SubmissionDate) ?? "?";
  const statusText = b.BusinessStatusText ?? "?";
  const statusDate = formatODataDate(b.BusinessStatusDate);
  const status = statusDate ? `${statusText} (${statusDate})` : statusText;
  const tags = b.TagNames ?? b.Tags;

  return [
    `${num} — ${type} | ${chamber}`,
    `  ${b.Title ?? "(kein Titel)"}`,
    `  Eingereicht: ${submitted}${b.SubmittedBy ? ` von ${b.SubmittedBy}` : ""}`,
    `  Status: ${status}`,
    tags ? `  Tags: ${tags}` : null,
  ]
    .filter(Boolean)
    .join("\n");
}

export const searchBusinessTool: AgentTool<typeof params, Business[]> = {
  name: "search_business",
  label: "Search Business",
  description:
    "Sucht parlamentarische Geschäfte (Motionen, Interpellationen, Postulate, Initiativen usw.) in der Parlamentsdatenbank. " +
    "Gibt Nummer, Titel, Geschäftsart, Einreichungsdatum, Status und Tags zurück. " +
    "Mindestens eines von keyword, type oder council muss angegeben sein. " +
    "Gibt maximal 20 Treffer zurück.",
  parameters: params,

  async execute(_toolCallId, { keyword, type, council, legislative_period }: Params) {
    if (!keyword && !type && !council) {
      throw new Error(
        "Mindestens ein Suchkriterium (keyword, type oder council) muss angegeben werden."
      );
    }

    const results = await searchBusinesses({
      keyword,
      type,
      council,
      legislativePeriod: legislative_period,
    });

    if (results.length === 0) {
      return {
        content: [{ type: "text" as const, text: "Keine Geschäfte gefunden." }],
        details: [],
      };
    }

    const text = results.map(formatBusiness).join("\n\n");
    return {
      content: [{ type: "text" as const, text }],
      details: results,
    };
  },
};
