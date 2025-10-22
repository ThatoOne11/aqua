import { Component, input, Input, OnInit } from '@angular/core';
import { MatChipsModule } from '@angular/material/chips';
import { MatIconModule } from '@angular/material/icon';
import { MatTooltipModule } from '@angular/material/tooltip';
import { User } from '@client-management/models/dtos/user.model';
import { AlertModel } from '@data-management/models/review-alerts/reviewed-alert.model';

@Component({
  selector: 'app-upload-alert-details-summary',
  imports: [MatIconModule, MatChipsModule, MatTooltipModule],
  templateUrl: './upload-alert-details-summary.html',
  styleUrl: './upload-alert-details-summary.scss',
  standalone: true,
})
export class UploadAlertDetailsSummary implements OnInit {
  @Input({ required: true }) alerts!: AlertModel[];
  @Input({ required: true }) currentSelectedUsers!: User[];

  alertsForDisplay!: AlertModel[];

  ngOnInit(): void {
    this.alertsForDisplay = this.alerts.filter((a) => !a.ignored);
  }
}
