export interface CoaWarnings {
  coa_id: string;
  site_id: string | null;
  site_name: string | null;
  has_active_coa: boolean;
  is_new_site: boolean;
  new_floors: string[];
  new_areas: { floor: string; area: string }[];
  new_locations: { floor: string; area: string; location: string }[];
  new_outlets: {
    floor: string;
    area: string;
    location: string;
    outlet: string;
  }[];
}
