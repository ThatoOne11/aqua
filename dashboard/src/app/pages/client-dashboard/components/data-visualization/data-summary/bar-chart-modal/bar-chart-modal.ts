import {
  Component,
  ChangeDetectionStrategy,
  Inject,
  OnInit,
  ViewEncapsulation,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import {
  MatDialogModule,
  MatDialogRef,
  MAT_DIALOG_DATA,
} from '@angular/material/dialog';
import { MatButtonModule } from '@angular/material/button';
import { ReadingResultViewRow } from '@client-dashboard/models/filters/filters.model';
import { AgGrid } from '@shared-components/ag-grid/ag-grid';
import { ColDef } from 'ag-grid-community';
import { getReadingResultsColDefs } from '@client-dashboard/models/column-definitions/reading-results-column-definition';

export interface BarChartModalData {
  clientName: string;
  data: ReadingResultViewRow[];
}

@Component({
  selector: 'app-bar-chart-modal',
  standalone: true,
  imports: [CommonModule, MatDialogModule, MatButtonModule, AgGrid],
  templateUrl: './bar-chart-modal.html',
  styleUrls: ['./bar-chart-modal.scss'],
  encapsulation: ViewEncapsulation.None,
  changeDetection: ChangeDetectionStrategy.OnPush,
})
export class BarChartModalComponent implements OnInit {
  protected colDefs: ColDef[] = [];
  protected rowData: ReadingResultViewRow[] = [];

  constructor(
    public dialogRef: MatDialogRef<BarChartModalComponent>,
    @Inject(MAT_DIALOG_DATA) public data: BarChartModalData
  ) {}

  ngOnInit(): void {
    this.colDefs = getReadingResultsColDefs();
    this.rowData = this.data.data ?? [];
  }

  onClose(): void {
    this.dialogRef.close();
  }
}
