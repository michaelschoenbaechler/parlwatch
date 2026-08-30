import { Business } from 'swissparl';

/** One long-text section of a business, as the detail page shows it. */
export interface BusinessTextSection {
  /** Translation key under `business.detailText`, and the `@for` track key. */
  key: string;
  /** The section's full markup, shown in the modal. */
  html: string;
  /** Plain-text excerpt the card shows. */
  preview: string;
  /** Whether the excerpt is shorter than the text behind it. */
  isTruncated: boolean;
}

/**
 * How much of a section a card shows before deferring to the modal. Measured
 * against live data, the substantial fields run to a median of 1500–2000
 * characters, so without a cut-off a single business fills several screens.
 */
export const PREVIEW_LENGTH = 300;

/**
 * The long-text fields of a business, in the order the page shows them.
 */
const TEXT_FIELDS: ReadonlyArray<{
  key: string;
  read: (business: Business) => string | undefined;
}> = [
  { key: 'description', read: (b) => b.Description },
  { key: 'initialSituation', read: (b) => b.InitialSituation },
  { key: 'proceedings', read: (b) => b.Proceedings },
  { key: 'draftText', read: (b) => b.DraftText },
  { key: 'submittedText', read: (b) => b.SubmittedText },
  { key: 'reasonText', read: (b) => b.ReasonText },
  { key: 'documentationText', read: (b) => b.DocumentationText },
  { key: 'motionText', read: (b) => b.MotionText },
  {
    key: 'federalCouncilResponseText',
    read: (b) => b.FederalCouncilResponseText
  }
];

/**
 * Collect the long-text sections a business actually carries.
 * @param business The business as the detail endpoint returned it
 * @returns One section per field that holds text, in display order
 */
export function toBusinessTextSections(
  business: Business | null
): BusinessTextSection[] {
  if (!business) return [];

  const sections: BusinessTextSection[] = [];

  for (const field of TEXT_FIELDS) {
    const html = field.read(business)?.trim();
    if (!html) continue;

    const plain = toPlainText(html);
    if (!plain) continue;

    sections.push({ key: field.key, html, ...toPreview(plain) });
  }

  return sections;
}

/**
 * Strip markup down to readable text.
 *
 * Tags become spaces rather than nothing, so the last word of a paragraph does
 * not run into the first word of the next one.
 * @param html Markup as the API returns it
 * @returns The text it contains, with runs of whitespace collapsed
 */
export function toPlainText(html: string | undefined): string {
  return (html ?? '')
    .replace(/<[^>]+>/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

/**
 * Cut text down to the card excerpt, at a word boundary.
 * @param plain The section's full text
 * @returns The excerpt and whether anything was cut
 */
function toPreview(plain: string): {
  preview: string;
  isTruncated: boolean;
} {
  if (plain.length <= PREVIEW_LENGTH) {
    return { preview: plain, isTruncated: false };
  }

  const cut = plain.slice(0, PREVIEW_LENGTH);
  const lastSpace = cut.lastIndexOf(' ');

  return {
    preview: `${(lastSpace > 0 ? cut.slice(0, lastSpace) : cut).trimEnd()}…`,
    isTruncated: true
  };
}
