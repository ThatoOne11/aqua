import { Pipe, PipeTransform } from '@angular/core';

@Pipe({
  name: 'formatDatetime',
  standalone: true, // Angular 15+ standalone pipe
})
export class FormatDatetimePipe implements PipeTransform {
  transform(value: string | Date | null | undefined): string {
    if (!value) return '';

    const date = new Date(value);

    // Pull parts in UTC
    const parts = new Intl.DateTimeFormat('en-GB', {
      timeZone: 'UTC',
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
      hour: 'numeric',
      minute: '2-digit',
      second: '2-digit',
      hour12: true,
    }).formatToParts(date);

    const get = (t: Intl.DateTimeFormatPartTypes) =>
      parts.find((p) => p.type === t)?.value ?? '';

    const month = get('month');
    const day = get('day');
    const year = get('year');
    const hours = get('hour');
    const minutes = get('minute');
    const seconds = get('second');
    const ampm = (parts.find((p) => p.type === 'dayPeriod')?.value || '')
      .replace(' ', '')
      .toLowerCase();

    return `${day}/${month}/${year} - ${hours}:${minutes}:${seconds}${ampm}`;
  }
}
