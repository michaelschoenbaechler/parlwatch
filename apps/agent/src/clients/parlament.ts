import { fetchCollection, Collection } from "swissparl";
import type { MemberCouncil, Voting, Vote, Business } from "swissparl";

export type { MemberCouncil, Voting, Vote, Business };

export async function searchCouncilMembers(params: {
  name?: string;
  active?: boolean;
  canton?: string;
  council?: "NR" | "SR";
  language?: string;
}): Promise<MemberCouncil[]> {
  const { name, active, canton, council, language = "DE" } = params;

  const eqFilter: Record<string, unknown>[] = [{ Language: language }];
  if (typeof active === "boolean") eqFilter.push({ Active: active });
  if (canton) eqFilter.push({ CantonAbbreviation: canton });
  if (council) eqFilter.push({ CouncilAbbreviation: council });

  // FilterOptions is typed as a union but the runtime supports mixing operators.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { eq: eqFilter };

  if (name) {
    filter.substringOf = [{ LastName: name, FirstName: name }];
  }

  return fetchCollection<MemberCouncil>(Collection.MemberCouncil, {
    filter,
    top: 20,
  });
}

export async function searchBusinesses(params: {
  keyword?: string;
  type?: string;
  council?: "NR" | "SR";
  legislativePeriod?: number;
  language?: string;
}): Promise<Business[]> {
  const { keyword, type, council, legislativePeriod, language = "DE" } = params;

  const eqFilter: Record<string, unknown>[] = [{ Language: language }];
  if (type) eqFilter.push({ BusinessTypeAbbreviation: type });
  if (council) eqFilter.push({ SubmissionCouncilAbbreviation: council });
  if (legislativePeriod) eqFilter.push({ SubmissionLegislativePeriod: legislativePeriod });

  // FilterOptions is typed as a union but the runtime supports mixing operators.
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { eq: eqFilter };

  if (keyword) {
    filter.substringOf = [{ Title: keyword }];
  }

  return fetchCollection<Business>(Collection.Business, {
    filter,
    top: 20,
  });
}
