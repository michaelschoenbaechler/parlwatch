import { fetchCollection, Collection } from "swissparl";
import type { MemberCouncil, Voting, Vote } from "swissparl";

export type { MemberCouncil, Voting, Vote };

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
