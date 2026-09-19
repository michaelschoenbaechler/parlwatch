/** Where a cantonal record came from and how fresh it is. */
export interface RecordSource {
  /** OData date of the record's `updated_at`. */
  updatedAt: string;
  /** The canton's own page for the record. */
  url: string;
}
