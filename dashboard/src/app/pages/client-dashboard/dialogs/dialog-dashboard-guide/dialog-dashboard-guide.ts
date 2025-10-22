import {
  Component,
  ChangeDetectionStrategy,
  ViewEncapsulation,
} from '@angular/core';
import { MatButtonModule } from '@angular/material/button';
import { MatDialogModule } from '@angular/material/dialog';
import { MatListModule } from '@angular/material/list';
@Component({
  selector: 'app-dialog-dashboard-guide',
  imports: [MatDialogModule, MatButtonModule, MatListModule],
  templateUrl: './dialog-dashboard-guide.html',
  styleUrl: './dialog-dashboard-guide.scss',
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class DialogDashboardGuide {}
