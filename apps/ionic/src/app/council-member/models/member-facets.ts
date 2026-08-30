import { Canton, MemberCouncil, ParlGroup } from 'swissparl';

/** One selectable value in a member-list filter. */
export interface FacetOption {
  id: number;
  label: string;
}

/** The option lists the member filter form offers. */
export interface MemberFacets {
  cantons: FacetOption[];
  parlGroups: FacetOption[];
  parties: FacetOption[];
}

export const emptyMemberFacets: MemberFacets = {
  cantons: [],
  parlGroups: [],
  parties: []
};

/**
 * Build the member filter's option lists.
 *
 * Parties are derived from the members actually holding a seat rather than
 * read from the `Party` collection: that collection carries 83 parties, most
 * of them long defunct, where only about a dozen sit in parliament today.
 * @param cantons Rows of the `Canton` collection
 * @param parlGroups Rows of the `ParlGroup` collection, already filtered to active ones
 * @param members Sitting members, carrying their party
 * @returns Option lists, each sorted by label
 */
export function toMemberFacets(
  cantons: Canton[],
  parlGroups: ParlGroup[],
  members: MemberCouncil[]
): MemberFacets {
  return {
    cantons: sortByLabel(
      toOptions(
        cantons,
        (c) => c.CantonNumber,
        (c) => c.CantonName
      )
    ),
    parlGroups: sortByLabel(
      toOptions(
        parlGroups,
        (g) => g.ParlGroupNumber,
        (g) => firstLabel(g.ParlGroupAbbreviation, g.ParlGroupName)
      )
    ),
    parties: sortByLabel(
      toOptions(
        members,
        (m) => m.Party,
        (m) => firstLabel(m.PartyAbbreviation, m.PartyName)
      )
    )
  };
}

/**
 * First usable label among the candidates.
 *
 * The API writes a bare `-` where it has no abbreviation, so that is treated
 * as absent rather than shown as a filter option named "-".
 * @param candidates Label candidates, best first
 * @returns The first real label, or undefined when there is none
 */
function firstLabel(...candidates: (string | undefined)[]): string | undefined {
  return candidates
    .map((candidate) => candidate?.trim())
    .find((candidate) => candidate && candidate !== '-');
}

/**
 * Map rows onto unique options, dropping those without an id or a label.
 * @param rows Rows to map
 * @param toId Reads an option's id
 * @param toLabel Reads an option's label
 * @returns One option per distinct id
 */
function toOptions<T>(
  rows: T[],
  toId: (row: T) => number | undefined,
  toLabel: (row: T) => string | undefined
): FacetOption[] {
  const options = new Map<number, FacetOption>();

  for (const row of rows) {
    const id = toId(row);
    const label = toLabel(row)?.trim();
    if (id === undefined || !label || options.has(id)) continue;
    options.set(id, { id, label });
  }

  return [...options.values()];
}

/**
 * Order options the way the filter lists them.
 * @param options Options to sort
 * @returns The same options, sorted by label
 */
function sortByLabel(options: FacetOption[]): FacetOption[] {
  return options.sort((a, b) => a.label.localeCompare(b.label));
}
