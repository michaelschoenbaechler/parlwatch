import { fetchCollection, Collection } from "swissparl";
import type { MemberCouncil, Voting, Vote, Business, BusinessRole, PersonInterest } from "swissparl";

export type { MemberCouncil, Voting, Vote, Business, BusinessRole, PersonInterest };

export async function getVotingsByBusiness(params: {
  businessShortNumber: string;
  language?: string;
}): Promise<Voting[]> {
  const { businessShortNumber, language = "DE" } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {
    eq: [{ Language: language }, { BusinessShortNumber: businessShortNumber }],
  };

  return fetchCollection<Voting>(Collection.Voting, {
    filter,
    top: 500,
    orderby: { property: "IdVote", order: "asc" },
  });
}

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
    orderby: { property: "SubmissionDate", order: "desc" },
  });
}

export async function getCouncillorBusinesses(params: {
  personNumber: number;
  type?: string;
  language?: string;
}): Promise<BusinessRole[]> {
  const { personNumber, type, language = "DE" } = params;

  const eqFilter: Record<string, unknown>[] = [
    { Language: language },
    { MemberCouncilNumber: personNumber },
  ];
  if (type) eqFilter.push({ BusinessTypeAbbreviation: type });

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = { eq: eqFilter };

  return fetchCollection<BusinessRole>(Collection.BusinessRole, {
    filter,
    top: 50,
    orderby: { property: "BusinessSubmissionDate", order: "desc" },
  });
}

export async function getCouncillorInterests(params: {
  personNumber: number;
  language?: string;
}): Promise<PersonInterest[]> {
  const { personNumber, language = "DE" } = params;

  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const filter: any = {
    eq: [{ Language: language }, { PersonNumber: personNumber }],
  };

  return fetchCollection<PersonInterest>(Collection.PersonInterest, {
    filter,
    top: 100,
    orderby: { property: "SortOrder", order: "asc" },
  });
}
