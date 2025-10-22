import { Component, Input, inject } from '@angular/core';
import { CommonModule } from '@angular/common';
import { ICellRendererAngularComp } from 'ag-grid-angular';
import { ICellRendererParams } from 'ag-grid-community';
import { CsvDownloadService } from '@data-management/services/csv-download.service';
import { MatIconModule } from '@angular/material/icon';
import { MatButtonModule } from '@angular/material/button';

@Component({
  selector: 'app-coa-export-button',
  standalone: true,
  imports: [CommonModule, MatIconModule, MatButtonModule],
  template: `
    <button
      matIconButton
      aria-label="Export CSV"
      [id]="htmlId"
      (click)="export()"
    >
      <mat-icon class="material-symbols-outlined">download</mat-icon>
    </button>
  `,
})
export class CoaExportButtonComponent implements ICellRendererAngularComp {
  @Input() coaId?: string;
  private csv = inject(CsvDownloadService);
  htmlId!: string;

  agInit(params: ICellRendererParams & { coaId?: string }): void {
    this.coaId =
      params.coaId ?? (params.value as string) ?? (params.data?.id as string);
    this.htmlId = `export-button-${this.coaId}`;
  }

  refresh(params: ICellRendererParams): boolean {
    this.agInit(params);
    return true;
  }

  async export() {
    const id = this.coaId;
    if (!id) return;
    await this.csv.downloadCoaCsv(id);
  }
}
