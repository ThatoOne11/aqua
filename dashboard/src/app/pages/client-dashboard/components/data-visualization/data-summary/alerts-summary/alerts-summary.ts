import { Component, ChangeDetectionStrategy, input } from '@angular/core';
import { CommonModule } from '@angular/common';
import { MatButtonModule } from '@angular/material/button';
import { CdkScrollableModule } from '@angular/cdk/scrolling';
import { MatSidenavModule } from '@angular/material/sidenav';
import { AlertParameter } from '@client-dashboard/models/data-summary/data-summary.model';

@Component({
  selector: 'app-alerts-summary',
  standalone: true,
  imports: [
    CommonModule,
    MatButtonModule,
    CdkScrollableModule,
    MatSidenavModule,
  ],
  templateUrl: './alerts-summary.html',
  styleUrls: ['./alerts-summary.scss'],
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class AlertsSummaryComponent {
  results = input.required<AlertParameter[] | null>();
}
