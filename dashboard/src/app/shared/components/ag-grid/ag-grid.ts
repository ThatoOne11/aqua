import {
  ColDef,
  Module,
  ClientSideRowModelModule,
  DateFilterModule,
  NumberFilterModule,
  PaginationModule,
  TextFilterModule,
  themeQuartz,
  iconSetMaterial,
  GridOptions,
  SelectionChangedEvent,
  CellEditRequestEvent,
} from 'ag-grid-community';
import { Component, Input, OnInit } from '@angular/core';
import { Router } from '@angular/router';
import { AgGridAngular } from 'ag-grid-angular';
import { CommonModule } from '@angular/common';
import { AllCommunityModule, ModuleRegistry } from 'ag-grid-community';
@Component({
  selector: 'app-ag-grid',
  imports: [AgGridAngular, CommonModule],
  templateUrl: './ag-grid.html',
  styleUrl: './ag-grid.scss',
  standalone: true,
})
export class AgGrid implements OnInit {
  @Input({ required: true }) public columnDefinitions!: ColDef[];
  @Input({ required: true }) public rowData!: object[];
  @Input() public onCellEditRequest?: (event: CellEditRequestEvent) => void;

  public modules: Module[] = [
    ClientSideRowModelModule,
    DateFilterModule,
    NumberFilterModule,
    PaginationModule,
    TextFilterModule,
  ];

  protected theme = themeQuartz.withPart(iconSetMaterial).withParams({
    accentColor: '#000000',
    borderColor: '#1C1C1C26',
    browserColorScheme: 'light',
    columnBorder: false,
    fontFamily: {
      googleFont: 'Roboto',
    },
    fontSize: 14,
    foregroundColor: '#1C1C1C',
    headerBackgroundColor: '#FFFFFF',
    headerColumnBorder: false,
    headerColumnResizeHandleHeight: '20%',
    headerFontSize: 16,
    headerFontWeight: 400,
    headerRowBorder: true,
    headerTextColor: '#1C1C1C',
    rowBorder: true,
    rowHoverColor: '#95ACF13D',
    wrapperBorder: false,
  });

  protected gridOptions: GridOptions = {
    defaultColDef: {
      flex: 1,
      filter: true,
    },
    domLayout: 'autoHeight',
    pagination: false,
    suppressRowHoverHighlight: false,
    rowSelection: 'single',
    stopEditingWhenCellsLoseFocus: true,
    enableCellTextSelection: true,
  };

  constructor(private router: Router) {}

  ngOnInit(): void {
    ModuleRegistry.registerModules([AllCommunityModule]);

    this.gridOptions.context = {
      router: this.router,
    };
    if (this.onCellEditRequest) {
      this.gridOptions.onCellEditRequest = this.onCellEditRequest;
      this.gridOptions.readOnlyEdit = true;
    }
  }

  onSelectionChanged(event: SelectionChangedEvent) {
    const selectedNodes = event.api.getSelectedNodes();
    if (selectedNodes.length > 1) {
      // Deselect all others except the last selected one
      const latest = selectedNodes[selectedNodes.length - 1];
      event.api.deselectAll();
      latest.setSelected(true);
    }
  }
}
