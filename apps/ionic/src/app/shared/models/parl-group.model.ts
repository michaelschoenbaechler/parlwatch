/**
 * Faction codes the API reports. Language independent, unlike `ParlGroupName`,
 * and used verbatim across collections: `Voting.ParlGroupCode` and
 * `Transcript.ParlGroupAbbreviation` both carry them.
 */
export const PARL_GROUP_CODES: readonly string[] = [
  'S',
  'G',
  'V',
  'RL',
  'GL',
  'M-E'
];

/**
 * Translation key for a faction, or null when the app has no name for it.
 *
 * The codes are terse — `RL`, `S`, `V` — so anything user-facing should show
 * the translated name rather than the code itself.
 * @param code Faction code from the API
 * @returns Transloco key, or null when the code is unknown
 */
export function parlGroupTranslationKey(
  code: string | undefined
): string | null {
  return code && PARL_GROUP_CODES.includes(code)
    ? `common.parlGroup.${code}`
    : null;
}
