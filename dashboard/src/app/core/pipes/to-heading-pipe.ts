import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'toHeading',
})
export class ToHeadingPipe implements PipeTransform {
  transform(value: string | null | undefined): string {
    if (!value) return '';
    const str = value.replace(/_/g, ' ');
    return str.charAt(0).toUpperCase() + str.slice(1);
  }
}
