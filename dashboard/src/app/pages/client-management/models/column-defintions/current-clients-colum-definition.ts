import { ColDef } from 'ag-grid-community';
import { UserForClient } from '@client-management/models/dtos/user-for-client.model';

export function getCurrentClientColDefs(
  isNewClient: boolean,
  removeCallback: (user: UserForClient) => void
): ColDef[] {
  return [
    {
      headerName: 'UserId',
      field: 'userId',
      hide: true,
    },
    {
      headerName: 'Full Name',
      field: 'displayName',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      editable: true,
      singleClickEdit: true,
    },
    {
      headerName: 'Email Address',
      field: 'email',
      sortable: true,
      filter: 'agTextColumnFilter',
      resizable: true,
      editable: () => isNewClient,
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
