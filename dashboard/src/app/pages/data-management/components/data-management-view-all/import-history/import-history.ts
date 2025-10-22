import { Component, inject, OnInit, signal } from '@angular/core';
import { MatSelectModule } from '@angular/material/select';
import {
  MatDateRangeInput,
  MatDatepickerModule,
} from '@angular/material/datepicker';
import {
  FormGroup,
  FormControl,
  ReactiveFormsModule,
  FormsModule,
} from '@angular/forms';
import { CommonModule } from '@angular/common';
import { MatFormFieldModule } from '@angular/material/form-field';
import { AgGrid } from '@shared-components/ag-grid/ag-grid';
import { ColDef } from 'ag-grid-community';
import { getFileUploadColDefs } from '@data-management/models/column-defintions/upload-history-column-definitions';
import { CertificateOfAnalysisService } from '@data-management/services/certificate-of-analysis-service';
import { CoaImportHistoryResult } from '@data-management/models/import-history/coa-import-history-model';

@Component({
  selector: 'app-import-history',
  imports: [
    CommonModule,
    MatSelectModule,
    MatDateRangeInput,
    MatDatepickerModule,
    ReactiveFormsModule,
    MatFormFieldModule,
    FormsModule,
    AgGrid,
  ],
  templateUrl: './import-history.html',
  styleUrl: './import-history.scss',
})
export class ImportHistory implements OnInit {
  private coaService = inject(CertificateOfAnalysisService);

  protected importHistory!: CoaImportHistoryResult[];
  protected uploadHistoryColDefs: ColDef[] = [];
  protected filteredImportHistory = signal<CoaImportHistoryResult[]>([]);
  readonly dateRangeForm = new FormGroup({
    start: new FormControl<Date | null>(null),
    end: new FormControl<Date | null>(null),
  });

  async ngOnInit(): Promise<void> {
    const startDate = new Date();
    startDate.setMonth(startDate.getMonth() - 3);

    this.dateRangeForm.setValue({
      start: startDate,
      end: new Date(),
    });

    this.importHistory = await this.coaService.getCoaImportHistory();

    this.uploadHistoryColDefs = getFileUploadColDefs();
    this.applyFilter();

    this.dateRangeForm.valueChanges.subscribe((_) => {
      this.applyFilter();
    });
  }

  protected applyFilter() {
    if (this.dateRangeForm.value.start && this.dateRangeForm.value.end) {
      const startDate = new Date(this.dateRangeForm.value.start);
      let endDate = new Date(this.dateRangeForm.value.end);
      endDate.setHours(23);
      const filteredData = this.importHistory.filter((i) => {
        const uploadDate = new Date(i.dateUploaded);
        return uploadDate >= startDate && uploadDate <= endDate;
      });
      this.filteredImportHistory.set(filteredData);
    }
  }
}
