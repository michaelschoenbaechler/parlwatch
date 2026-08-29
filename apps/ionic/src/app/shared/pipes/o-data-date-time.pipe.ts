import { Pipe, PipeTransform } from '@angular/core';

export type ODataDateTimeFormat = 'date' | 'time' | 'datetime';

/**
 * The parliament API serialises `/Date(…)/` ticks as Swiss local wall-clock
 * time labelled as UTC: `VoteEnd` and `VoteEndWithTimezone` carry the same tick
 * value while only the latter reports the `+0120` offset. Formatting the ticks
 * in UTC therefore echoes back the exact local time the parliament recorded,
 * and keeps the output identical no matter which timezone the device is in.
 */
const API_TIME_ZONE = 'UTC';

const SWISS_LOCALE = 'de-CH';

@Pipe({
  name: 'oDataDateTime',
  standalone: true
})
export class ODataDateTimePipe implements PipeTransform {
  constructor() {}

  /**
   * Format an OData date string as Swiss local date and/or time.
   * @param value OData date string, e.g. `/Date(1781800272354)/`
   * @param format Which parts to render, defaults to the date only
   * @returns Formatted Swiss local date/time, or the input when unparsable
   */
  transform(value: string, format: ODataDateTimeFormat = 'date'): string {
    if (!value) {
      return value;
    }

    const timestamp = parseInt(
      value.replace('/Date(', '').replace(')/', ''),
      10
    );

    if (Number.isNaN(timestamp)) {
      return value;
    }

    const options: Intl.DateTimeFormatOptions = { timeZone: API_TIME_ZONE };

    if (format !== 'time') {
      options.day = 'numeric';
      options.month = 'numeric';
      options.year = 'numeric';
    }

    if (format !== 'date') {
      options.hour = '2-digit';
      options.minute = '2-digit';
    }

    return new Date(timestamp).toLocaleString(SWISS_LOCALE, options);
  }
}
