import { Type, type Static } from "typebox";
import type { AgentTool } from "@earendil-works/pi-agent-core";
import { getVotingsByBusiness, type Voting } from "../clients/parlament.js";
import { formatODataDate } from "../utils/odata.js";

const params = Type.Object({
  business_short_number: Type.String({
    description:
      "Geschäftsnummer im Format JJ.NNNN (z. B. 23.4567). Aus search_business oder get_councillor_businesses bekannt.",
  }),
});

type Params = Static<typeof params>;

interface VoteGroup {
  idVote: number;
  subject: string;
  meaningYes: string;
  meaningNo: string;
  date: string;
  totals: Map<string, number>;
  factions: Map<string, Map<string, number>>;
}

function buildVoteGroups(votings: Voting[]): VoteGroup[] {
  const groups = new Map<number, VoteGroup>();

  for (const v of votings) {
    const id = v.IdVote ?? 0;
    if (!groups.has(id)) {
      groups.set(id, {
        idVote: id,
        subject: v.Subject ?? "",
        meaningYes: v.MeaningYes ?? "",
        meaningNo: v.MeaningNo ?? "",
        date: formatODataDate(v.VoteEnd) ?? "?",
        totals: new Map(),
        factions: new Map(),
      });
    }

    const group = groups.get(id)!;
    const decision = v.DecisionText ?? "?";
    group.totals.set(decision, (group.totals.get(decision) ?? 0) + 1);

    const faction = v.ParlGroupNameAbbreviation ?? "?";
    if (!group.factions.has(faction)) group.factions.set(faction, new Map());
    const factionMap = group.factions.get(faction)!;
    factionMap.set(decision, (factionMap.get(decision) ?? 0) + 1);
  }

  return [...groups.values()];
}

function formatVoteGroup(g: VoteGroup, index: number, total: number): string {
  const header = total > 1 ? `Abstimmung ${index + 1} von ${total}` : "Abstimmung";
  const lines: string[] = [
    `${header} — ${g.date}`,
    g.subject ? `  Gegenstand: ${g.subject}` : null,
    g.meaningYes ? `  Ja = ${g.meaningYes}` : null,
    g.meaningNo ? `  Nein = ${g.meaningNo}` : null,
  ].filter(Boolean) as string[];

  const totalsLine = [...g.totals.entries()]
    .map(([decision, count]) => `${decision}: ${count}`)
    .join(" | ");
  lines.push(`  Gesamtergebnis: ${totalsLine}`);

  if (g.factions.size > 0) {
    lines.push("  Nach Fraktion:");
    for (const [faction, decisions] of g.factions) {
      const factionLine = [...decisions.entries()]
        .map(([decision, count]) => `${decision} ${count}`)
        .join(", ");
      lines.push(`    ${faction}: ${factionLine}`);
    }
  }

  return lines.join("\n");
}

export const getVoteResultTool: AgentTool<typeof params, Voting[]> = {
  name: "get_vote_result",
  label: "Get Vote Result",
  description:
    "Gibt das Abstimmungsergebnis zu einem parlamentarischen Geschäft zurück: " +
    "Gesamtergebnis (Ja/Nein/Enthaltung) und Aufschlüsselung nach Fraktion. " +
    "Erfordert die Geschäftsnummer (z. B. 23.4567) aus search_business.",
  parameters: params,

  async execute(_toolCallId, { business_short_number }: Params) {
    const votings = await getVotingsByBusiness({
      businessShortNumber: business_short_number,
    });

    if (votings.length === 0) {
      return {
        content: [
          {
            type: "text" as const,
            text: `Keine Abstimmungsdaten für Geschäft ${business_short_number} gefunden.`,
          },
        ],
        details: [],
      };
    }

    const groups = buildVoteGroups(votings);
    const text = groups
      .map((g, i) => formatVoteGroup(g, i, groups.length))
      .join("\n\n");

    return {
      content: [{ type: "text" as const, text }],
      details: votings,
    };
  },
};
