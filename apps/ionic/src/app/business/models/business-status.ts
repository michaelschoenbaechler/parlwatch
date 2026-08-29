/**
 * A selectable status in the business filter.
 *
 * Several API ids can carry the same label (27 and 229 are both "Erledigt"),
 * so one option may cover more than one id.
 */
export interface BusinessStatusOption {
  /** Identity of the option and suffix of its `business.status.<id>` label. */
  id: number;
  /** Every `Business.BusinessStatus` id this option filters by. */
  ids: number[];
}

/**
 * Statuses a business can currently be in.
 *
 * Derived from a full scan of all 67'366 businesses: exactly 22 distinct
 * `Business.BusinessStatus` values occur. This list is fixed on purpose — the
 * API's `BusinessStatus` collection is not a lookup table but a log of status
 * changes (158'093 rows), so reading distinct values out of a page of it
 * yields an arbitrary, incomplete set that also contains historical statuses
 * no business currently has, which therefore never match anything.
 */
export const BUSINESS_STATUS_OPTIONS: readonly BusinessStatusOption[] = [
  { id: 202, ids: [202] },
  { id: 203, ids: [203] },
  { id: 204, ids: [204] },
  { id: 205, ids: [205] },
  { id: 206, ids: [206] },
  { id: 207, ids: [207] },
  { id: 208, ids: [208] },
  { id: 209, ids: [209] },
  { id: 210, ids: [210] },
  { id: 212, ids: [212] },
  { id: 215, ids: [215] },
  { id: 216, ids: [216] },
  { id: 218, ids: [218] },
  { id: 220, ids: [220] },
  { id: 222, ids: [222] },
  { id: 223, ids: [223] },
  { id: 225, ids: [225] },
  { id: 227, ids: [227] },
  { id: 229, ids: [27, 229] },
  { id: 230, ids: [230] },
  { id: 231, ids: [231] }
];
