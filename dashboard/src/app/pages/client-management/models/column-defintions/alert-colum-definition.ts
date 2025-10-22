import { ColDef } from 'ag-grid-community';
import { ClientAlert } from '../dtos/client-alert.model';

export function getAlertColDefs(
  removeCallback: (clientAlertToDelete: ClientAlert) => void
): ColDef[] {
  return [
    {
      headerName: 'Type',
      field: 'resultType.display_name',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      editable: false,
    },
    {
      headerName: 'Condition',
      field: 'condition',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      editable: false,
    },
    {
      headerName: 'Value',
      field: 'value',
      sortable: true,
      filter: 'agNumberColumnFilter',
      resizable: true,
      editable: true,
      singleClickEdit: true,
    },
    {
      headerName: 'Action',
      maxWidth: 100,
      resizable: false,
      cellClass: 'center-cell',
      filter: false,
      cellRenderer: () =>
        `<span class="remove-icon" title="Remove user">✖</span>`,
      onCellClicked: (params) => {
        removeCallback(params.data);
      },
    },
  ];
}
