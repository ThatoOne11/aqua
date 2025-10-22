import { Component, Input, OnInit } from '@angular/core';
import { getUploadInfoColDefs } from '@data-management/models/column-defintions/upload-info-column-definition';
import { CoaDetails } from '@data-management/models/review-upload/coa-details.model';
import { AgGrid } from '@shared-components/ag-grid/ag-grid';
import { ColDef, DomLayoutType } from 'ag-grid-community';

@Component({
  selector: 'app-upload-info',
  imports: [AgGrid],
  templateUrl: './upload-info.html',
  styleUrl: './upload-info.scss',
  standalone: true,
})
export class UploadInfo implements OnInit {
  @Input({ required: true }) coaDetails!: CoaDetails;
  protected uploadInfoColDefs: ColDef[] = [];
  protected coaDetailRowData: CoaDetails[] = [];

  ngOnInit(): void {
    this.uploadInfoColDefs = getUploadInfoColDefs();
    this.coaDetailRowData.push(this.coaDetails);
  }
}
