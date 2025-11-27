import { ColDef } from 'ag-grid-community';

export const getReadingResultsColDefs = (): ColDef[] => {
  return [
    { field: 'site_name', headerName: 'Site Name', flex: 1 },
    { field: 'floor', headerName: 'Floor', flex: 1 },
    { field: 'area', headerName: 'Area', flex: 1 },
    { field: 'location', headerName: 'Location', flex: 1 },
    { field: 'outlet', headerName: 'Outlet', flex: 1 },
    { field: 'feed_type', headerName: 'Feed Type', flex: 1 },
    { field: 'flush_type', headerName: 'Flush Type', flex: 1 },
    {
      field: 'sample_dt',
      headerName: 'Time',
      valueFormatter: (params) => {
        if (params.value) {
          return new Date(params.value).toLocaleString();
        }
        return '';
      },
      flex: 1,
    },
    { field: 'parameter_type', headerName: 'Result Type', flex: 1 },
    { field: 'value', headerName: 'Value', flex: 1 },
    { field: 'temperature', headerName: 'Temperature', flex: 1 },
    { field: 'comments', headerName: 'Comments', flex: 1 },
  ];
};
