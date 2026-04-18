import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'oDataDateTime',
  standalone: true
})
export class ODataDateTimePipe implements PipeTransform {
  constructor() {}

  transform(value: string): string {
    if (!value) {
      return value;
    }

    const timestamp = parseInt(
      value.replace('/Date(', '').replace(')/', ''),
      10
    );
    const date = new Date(timestamp);

    return date.toLocaleDateString('de-CH');
  }
}
