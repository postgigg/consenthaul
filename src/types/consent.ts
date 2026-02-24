import type {
  ConsentStatus,
  ConsentType,
  DeliveryMethod,
  Database,
} from '@/types/database';

// Row type aliases for convenience
type ConsentRow = Database['public']['Tables']['consents']['Row'];
type DriverRow = Database['public']['Tables']['drivers']['Row'];

// ---------------------------------------------------------------------------
// API Request / Response interfaces
// ---------------------------------------------------------------------------

/** POST /api/consents — create a new consent request */
export interface CreateConsentRequest {
  driver_id: string;
  consent_type?: ConsentType;
  delivery_method: DeliveryMethod;
  delivery_address?: string;
  language?: 'en' | 'es';
  consent_start_date?: string;
  consent_end_date?: string;
  query_frequency?: string;
  template_id?: string;
  /** How long the signing token remains valid (default 168 h / 7 days) */
  token_ttl_hours?: number;
}

/** Consent object returned from the API */
export interface ConsentResponse {
  id: string;
  organization_id: string;
  driver_id: string;
  created_by: string;
  consent_type: ConsentType;
  status: ConsentStatus;
  language: string;
  consent_start_date: string;
  consent_end_date: string | null;
  query_frequency: string | null;
  delivery_method: DeliveryMethod;
  delivery_address: string;
  delivery_sid: string | null;
  delivered_at: string | null;
  opened_at: string | null;
  signed_at: string | null;
  signature_hash: string | null;
  pdf_storage_path: string | null;
  pdf_generated_at: string | null;
  retention_expires_at: string | null;
  is_archived: boolean;
  created_at: string;
  updated_at: string;
}

/** POST /api/consents/:id/sign — submit a driver signature */
export interface SubmitSignatureRequest {
  /** Base-64 encoded signature image (data URL) */
  signature_data: string;
  /** Driver must confirm they agree to the consent */
  confirmed: boolean;
}

/** Response after a signature is recorded */
export interface SignatureResponse {
  consent_id: string;
  status: ConsentStatus;
  signed_at: string;
  signature_hash: string;
  pdf_storage_path: string | null;
}

/** Consent row joined with its related driver data */
export interface ConsentWithDriver extends ConsentRow {
  driver: DriverRow;
}

/** Query-string filters for listing consents */
export interface ConsentFilters {
  status?: ConsentStatus;
  driver_id?: string;
  created_after?: string;
  created_before?: string;
}
