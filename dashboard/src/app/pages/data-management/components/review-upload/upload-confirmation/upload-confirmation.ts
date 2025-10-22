import { Component, inject, Input } from '@angular/core';
import { EditedReadings } from '@data-management/models/review-upload/edited-reading';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import { ChangeLog } from './change-log/change-log';
import { UploadDetailsSummary } from './upload-details-summary/upload-details-summary';
import { CoaDetails } from '@data-management/models/review-upload/coa-details.model';
import { UploadAlertDetailsSummary } from './upload-alert-details-summary/upload-alert-details-summary';
import { AlertModel } from '@data-management/models/review-alerts/reviewed-alert.model';
import { User } from '@client-management/models/dtos/user.model';
import { UploadConfirmService } from '@data-management/services/upload-confirm.service';

@Component({
  selector: 'app-upload-confirmation',
  imports: [
    PageTitleComponent,
    ChangeLog,
    UploadDetailsSummary,
    UploadAlertDetailsSummary,
  ],
  templateUrl: './upload-confirmation.html',
  styleUrl: './upload-confirmation.scss',
  standalone: true,
})
export class UploadConfirmation {
  @Input({ required: true }) coaDetails!: CoaDetails;
  @Input({ required: true }) title!: string;
  @Input({ required: true }) editedReadings!: EditedReadings;
  @Input({ required: true }) alerts!: AlertModel[];
  @Input({ required: true }) currentSelectedUsers: User[] = [];
}
