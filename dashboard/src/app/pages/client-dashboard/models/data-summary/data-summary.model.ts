export interface MonthlyDataPoint {
  month: string; // The month_start from Postgres, e.g., "2024-01-01"
  passed: number;
  failed: number;
}

export interface AlertParameter {
  parameter: string;
  passed: number;
  failed: number;
}

export interface DashboardDataResponse {
  monthly: MonthlyDataPoint[];
  parameters: AlertParameter[];
}
