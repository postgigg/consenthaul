import type { Database } from '@/types/database';

// Row type aliases for convenience
type DriverRow = Database['public']['Tables']['drivers']['Row'];
type ConsentRow = Database['public']['Tables']['consents']['Row'];

// ---------------------------------------------------------------------------
// API Request / Response interfaces
// ---------------------------------------------------------------------------

/** POST /api/drivers — create a new driver */
export interface CreateDriverRequest {
  first_name: string;
  last_name: string;
  phone?: string;
  email?: string;
  cdl_number?: string;
  cdl_state?: string;
  date_of_birth?: string;
  hire_date?: string;
  preferred_language?: 'en' | 'es';
}

/** PATCH /api/drivers/:id — update an existing driver */
export interface UpdateDriverRequest {
  first_name?: string;
  last_name?: string;
  phone?: string;
  email?: string;
  cdl_number?: string;
  cdl_state?: string;
  date_of_birth?: string;
  hire_date?: string;
  preferred_language?: 'en' | 'es';
  is_active?: boolean;
}

/** Driver row joined with its related consents */
export interface DriverWithConsents extends DriverRow {
  consents: ConsentRow[];
}

/** Query-string filters for listing drivers */
export interface DriverFilters {
  is_active?: boolean;
  /** Free-text search across name, email, phone, CDL number */
  search?: string;
}

/** Result summary returned after a CSV import */
export interface CSVImportResult {
  /** Total number of rows in the uploaded CSV */
  total: number;
  /** Number of drivers successfully imported */
  imported: number;
  /** Number of rows skipped (e.g. duplicates) */
  skipped: number;
  /** Per-row errors encountered during import */
  errors: CSVImportError[];
}

export interface CSVImportError {
  /** 1-based row number in the CSV file */
  row: number;
  /** Human-readable error description */
  message: string;
}
