import {
  Component,
  EventEmitter,
  Input,
  OnChanges,
  Output,
  SimpleChanges,
} from '@angular/core';
import { CommonModule } from '@angular/common';
import { PageTitleComponent } from '@shared-components/page-title/page-title.component';
import {
  CoaDetails,
  CoaUploadViewModel,
} from '@data-management/models/review-upload/coa-details.model';
import { CellEditRequestEvent, ColDef } from 'ag-grid-community';
import {
  FieldPresence,
  getReadingsColDefs,
} from '@data-management/models/column-defintions/readings-colum-definition';
import { AgGrid } from '@shared-components/ag-grid/ag-grid';
import { coaFields } from '@data-management/constants/static-columns.constant';
import { toTitleCase } from './upload-details-helper';
import { EditedReadings } from '@data-management/models/review-upload/edited-reading';
import { Warnings } from './warnings/warnings';
import { UploadInfo } from './upload-info/upload-info';
import { User } from '@client-management/models/dtos/user.model';

@Component({
  selector: 'app-upload-details',
  imports: [CommonModule, PageTitleComponent, AgGrid, Warnings, UploadInfo],
  templateUrl: './upload-details.html',
  styleUrl: './upload-details.scss',
  standalone: true,
})
export class UploadDetails implements OnChanges {
  @Input({ required: true }) title!: string;
  @Input() coaId: string | undefined;
  @Input() error: string | null = null;
  @Input() coaUploadViewModel?: CoaUploadViewModel;
  @Input() currentSelectedUsers: User[] = [];
  @Output() editedReadingsChange = new EventEmitter<EditedReadings>();
  @Output() editedReadingsData = new EventEmitter<any[]>();
  @Output() selectedUsersForSite = new EventEmitter<User[]>();

  protected readingColDefs: ColDef[] = [];
  protected columnsToShow: FieldPresence = {};
  protected parameters: string[] = [];
  protected originalRowValues: any[] = [];
  protected editedRowValues: any[] = [];
  protected editedReadings: EditedReadings = {};
  protected coaDetails!: CoaDetails | null;
  protected clientId!: string;
  protected clientName!: string;

  ngOnChanges(changes: SimpleChanges): void {
    if (changes['coaUploadViewModel'] && this.coaUploadViewModel?.readings) {
      this.buildColDefs();
      this.parameters = this.createParameters(this.coaUploadViewModel.headers);
      this.originalRowValues = this.coaUploadViewModel.readings;
      this.editedRowValues = this.coaUploadViewModel.readings;
      this.coaDetails = this.coaUploadViewModel.details;
      if (this.coaDetails) {
        this.clientId = this.coaDetails.client_id;
        this.clientName = this.coaDetails.client_name;
      }
    }
  }

  protected onCellEditRequest = (event: CellEditRequestEvent) => {
    const readingId = event.data.reading_id;

    const oldItem = this.editedRowValues.find(
      (r) => r['reading_id'] === readingId
    );
    if (!oldItem) return;

    const originalItem = this.originalRowValues.find(
      (r) => r['reading_id'] === readingId
    );
    if (!originalItem) return;

    const newItem = { ...oldItem, [event.colDef.field!]: event.newValue };
    this.editedRowValues = this.editedRowValues.map((r) =>
      r['reading_id'] === newItem['reading_id'] ? newItem : r
    );

    event.api.setGridOption('rowData', this.editedRowValues);
    this.editedReadings[readingId] = [
      ...(this.editedReadings[readingId] || []).filter(
        (e) => e.field !== event.colDef.field
      ),
      {
        rowNumber: event.rowIndex! + 1,
        field: event.colDef.field!,
        oldValue: originalItem[event.colDef.field!],
        newValue: event.newValue,
      },
    ].sort((a, b) => a.rowNumber - b.rowNumber);

    this.editedReadingsChange.emit(this.editedReadings);
    this.editedReadingsData.emit(this.editedRowValues);
  };

  protected selectedUsersForSiteEvent(users: User[]) {
    this.selectedUsersForSite.emit(users);
  }

  private buildColDefs(): void {
    this.coaUploadViewModel!.readings.forEach((row) => {
      Object.keys(row).forEach((k) => {
        this.columnsToShow[k] =
          this.columnsToShow[k] ||
          (row[k] !== null && row[k] !== undefined && row[k] !== '');
      });
    });

    this.readingColDefs = getReadingsColDefs(this.columnsToShow);
  }

  private createParameters(headers: string[]): string[] {
    return headers
      .filter((h) => !coaFields.includes(h))
      .map((h) => toTitleCase(h));
  }
}
