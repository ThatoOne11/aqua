import { ColDef } from 'ag-grid-community';

export type FieldPresence = Record<string, boolean>;

export function getReadingsColDefs(fieldPresence: FieldPresence): ColDef[] {
  const shouldHide = (field: string) => !(fieldPresence[field] === true);

  return [
    {
      headerName: 'ReadingId',
      field: 'reading_id',
      hide: true,
    },
    {
      headerName: 'certificateOfAnalysisId',
      field: 'certificate_of_analysis_id',
      hide: true,
    },
    {
      headerName: 'ID',
      field: 'provided_id',
      minWidth: 70,
      editable: false,
      sort: 'asc',
    },
    {
      headerName: 'Area',
      field: 'area',
      minWidth: 90,
      editable: true,
      singleClickEdit: true,
      hide: shouldHide('area'),
    },
    {
      headerName: 'Location',
      field: 'location',
      minWidth: 120,
      editable: true,
      singleClickEdit: true,
      hide: shouldHide('location'),
    },
    {
      headerName: 'Floor',
      field: 'floor',
      minWidth: 90,
      editable: true,
      singleClickEdit: true,
      hide: shouldHide('floor'),
    },
    {
      headerName: 'FeedType',
      field: 'feed_type',
      minWidth: 120,
      editable: false,
      singleClickEdit: true,
      hide: shouldHide('feed_type'),
    },
    {
      headerName: 'FlushType',
      field: 'flush_type',
      minWidth: 130,
      editable: false,
      singleClickEdit: true,
      hide: shouldHide('flush_type'),
    },
    {
      headerName: 'OutletType',
      field: 'outlet',
      minWidth: 130,
      editable: true,
      singleClickEdit: true,
      hide: shouldHide('outlet'),
    },
    {
      headerName: 'SampleIssue',
      field: 'sample_issue',
      minWidth: 140,
      editable: true,
      singleClickEdit: true,
      hide: shouldHide('sample_issue'),
    },
    {
      headerName: 'SampleTime',
      field: 'sample_time_formatted',
      minWidth: 140,
      editable: true,
      singleClickEdit: true,
      hide: shouldHide('sample_time_formatted'),
    },
    {
      headerName: 'Coliform',
      field: 'coliform',
      editable: (params) => {
        return params.data?.coliform != null && params.data.coliform !== '';
      },
      singleClickEdit: true,
      minWidth: 110,
      hide: shouldHide('coliform'),
    },
    {
      headerName: 'Copper',
      field: 'copper',
      editable: (params) => {
        return params.data?.copper != null && params.data.copper !== '';
      },
      singleClickEdit: true,
      minWidth: 100,
      hide: shouldHide('copper'),
    },
    {
      headerName: 'E.Coli',
      field: 'e_coli',
      editable: (params) => {
        return params.data?.e_coli != null && params.data.e_coli !== '';
      },
      singleClickEdit: true,
      minWidth: 100,
      hide: shouldHide('e_coli'),
    },
    {
      headerName: 'Enterococci',
      field: 'enterococci',
      editable: (params) => {
        return (
          params.data?.enterococci != null && params.data.enterococci !== ''
        );
      },
      singleClickEdit: true,
      minWidth: 150,
      hide: shouldHide('enterococci'),
    },
    {
      headerName: 'Lead',
      field: 'lead',
      editable: (params) => {
        return params.data?.lead != null && params.data.lead !== '';
      },
      singleClickEdit: true,
      minWidth: 90,
      hide: shouldHide('lead'),
    },
    {
      headerName: 'Legionella',
      field: 'legionella',
      editable: (params) => {
        return params.data?.legionella != null && params.data.legionella !== '';
      },
      singleClickEdit: true,
      minWidth: 130,
      hide: shouldHide('legionella'),
    },
    {
      headerName: 'Pseudomonas Aeruginosa',
      field: 'pseudomonas_aeruginosa',
      editable: (params) => {
        return (
          params.data?.pseudomonas_aeruginosa != null &&
          params.data.pseudomonas_aeruginosa !== ''
        );
      },
      singleClickEdit: true,
      minWidth: 150,
      hide: shouldHide('pseudomonas_aeruginosa'),
    },
    {
      headerName: 'Pseudo Species',
      field: 'pseudo_species',
      editable: (params) => {
        return (
          params.data?.pseudo_species != null &&
          params.data.pseudo_species !== ''
        );
      },
      singleClickEdit: true,
      minWidth: 170,
      hide: shouldHide('pseudo_species'),
    },
    {
      headerName: 'Silver',
      field: 'silver',
      editable: (params) => {
        return params.data?.silver != null && params.data.silver !== '';
      },
      singleClickEdit: true,
      minWidth: 90,
      hide: shouldHide('silver'),
    },
    {
      headerName: 'Temperature',
      field: 'temperature',
      editable: (params) => {
        return (
          params.data?.temperature != null && params.data.temperature !== ''
        );
      },
      singleClickEdit: true,
      minWidth: 140,
      hide: shouldHide('temperature'),
    },
    {
      headerName: 'TVC22',
      field: 'tvc22',
      editable: (params) => {
        return params.data?.tvc22 != null && params.data.tvc22 !== '';
      },
      singleClickEdit: true,
      minWidth: 100,
      hide: shouldHide('tvc22'),
    },
    {
      headerName: 'TVC37',
      field: 'tvc37',
      editable: (params) => {
        return params.data?.tvc37 != null && params.data.tvc37 !== '';
      },
      singleClickEdit: true,
      minWidth: 100,
      hide: shouldHide('tvc37'),
    },
  ];
}
