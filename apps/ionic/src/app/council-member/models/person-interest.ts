import { PersonInterest } from 'swissparl';

/**
 * A single tie to an organisation, as the register records it.
 */
export interface InterestVm {
  id: string;
  /** Organisation the member is tied to. */
  organisation: string;
  /** Role held, empty when the register gives none. */
  role: string;
  /** Body within the organisation, empty when the register gives none. */
  body: string;
  /** Whether the member is paid for the mandate. */
  paid: boolean;
}

/** Ties sharing one legal form, the way the official register groups them. */
export interface InterestGroupVm {
  /** Legal form of the organisations, empty for the unspecified bucket. */
  type: string;
  interests: InterestVm[];
}

/**
 * Register codes standing for "no information given". The accompanying text is
 * localised ("Keine Angaben", "Pas d'indication"), the code is not, so the
 * codes are what the app matches on.
 */
const UNSPECIFIED_INTEREST_TYPE = 1;
const UNSPECIFIED_ORGANIZATION_TYPE = 5;
const UNSPECIFIED_FUNCTION = 11;

/** Sorts the unspecified group last, whatever the API reports for it. */
const UNSPECIFIED_SORT_ORDER = Number.MAX_SAFE_INTEGER;

/**
 * Group a member's interest register by legal form, in the register's own
 * order (companies, foundations, associations, then the unspecified rest).
 *
 * Entries the register gives no organisation name for are dropped: they carry
 * nothing the reader could act on.
 * @param interests Rows as returned by the `PersonInterest` collection
 * @returns One group per legal form, each holding its ties by organisation
 */
export function toInterestGroups(
  interests: PersonInterest[] | undefined
): InterestGroupVm[] {
  // Without `$expand` the API returns a deferred reference instead of an array.
  const list = Array.isArray(interests) ? interests : [];
  const groups = new Map<number, { sortOrder: number } & InterestGroupVm>();

  for (const interest of list) {
    const organisation = interest.InterestName?.trim();
    if (!organisation) continue;

    const typeCode = interest.InterestType ?? UNSPECIFIED_INTEREST_TYPE;
    const isUnspecifiedType = typeCode === UNSPECIFIED_INTEREST_TYPE;

    let group = groups.get(typeCode);
    if (!group) {
      group = {
        type: isUnspecifiedType
          ? ''
          : (interest.InterestTypeText?.trim() ?? ''),
        // The register's own ordering, e.g. 1 companies, 100 foundations.
        sortOrder: isUnspecifiedType
          ? UNSPECIFIED_SORT_ORDER
          : (interest.SortOrder ?? UNSPECIFIED_SORT_ORDER),
        interests: []
      };
      groups.set(typeCode, group);
    }

    group.interests.push({
      id: interest.ID ?? `${typeCode}-${organisation}`,
      organisation,
      role:
        interest.FunctionInAgency === UNSPECIFIED_FUNCTION
          ? ''
          : (interest.FunctionInAgencyText?.trim() ?? ''),
      body:
        interest.OrganizationType === UNSPECIFIED_ORGANIZATION_TYPE
          ? ''
          : (interest.OrganizationTypeText?.trim() ?? ''),
      paid: interest.Paid === true
    });
  }

  const ordered = [...groups.values()].sort(
    (a, b) => a.sortOrder - b.sortOrder || a.type.localeCompare(b.type)
  );

  for (const group of ordered) {
    // Safe to sort in place: every `interests` array is built here, not shared.
    group.interests.sort((a, b) =>
      a.organisation.localeCompare(b.organisation)
    );
  }

  return ordered.map(({ type, interests }) => ({ type, interests }));
}
