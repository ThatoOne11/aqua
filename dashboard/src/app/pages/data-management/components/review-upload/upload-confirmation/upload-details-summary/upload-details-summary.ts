import { DatePipe } from '@angular/common';
import { Component, Input } from '@angular/core';
import { CoaDetails } from '@data-management/models/review-upload/coa-details.model';

@Component({
  selector: 'app-upload-details-summary',
  imports: [],
  templateUrl: './upload-details-summary.html',
  styleUrl: './upload-details-summary.scss',
  standalone: true,
  providers: [DatePipe],
})
export class UploadDetailsSummary {
  @Input({ required: true }) coaDetails!: CoaDetails;

  protected todayFormatted: string;

  constructor(private datePipe: DatePipe) {
    const today = new Date();
    const yyyy = today.getFullYear();
    const mm = String(today.getMonth() + 1).padStart(2, '0');
    const dd = String(today.getDate()).padStart(2, '0');
    this.todayFormatted = `${yyyy}-${mm}-${dd}`;
  }

  protected formatReadingDate(date: string | null): string | null {
    return this.datePipe.transform(date, 'yyyy-MM-dd');
  }
}
