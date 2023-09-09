import { Pipe, PipeTransform } from '@angular/core';
import { DomSanitizer, SafeHtml } from '@angular/platform-browser';

@Pipe({
  name: 'safeHtml'
})
export class SafeHtmlPipe implements PipeTransform {
  constructor(private sanitized: DomSanitizer) {}

  transform(value: string): SafeHtml {
    const div = document.createElement('div');
    div.innerHTML = value;

    const allowedTags = ['strong', 'p', 'ul', 'li', 'i', 'a'];

    // Get all elements inside the div
    const allElements = Array.from(div.getElementsByTagName('*'));
    for (const element of allElements) {
      if (allowedTags.indexOf(element.tagName.toLowerCase()) === -1) {
        // If the tag is not in the allowed list, replace it with its own innerHTML
        const parent = element.parentNode;
        while (element.firstChild) {
          parent.insertBefore(element.firstChild, element);
        }
        parent.removeChild(element);
      }
    }

    return this.sanitized.bypassSecurityTrustHtml(div.innerHTML);
  }
}
