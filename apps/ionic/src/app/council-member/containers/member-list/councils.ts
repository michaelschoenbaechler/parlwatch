export interface Council {
  id: number;
  councilName: string;
}

export const AllCouncils: Council[] = [
  {
    id: 1,
    councilName: 'Nationalrat'
  },
  {
    id: 2,
    councilName: 'Ständerat'
  },
  {
    id: 99,
    councilName: 'Bundesrat'
  }
];
