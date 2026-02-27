export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'owner' | 'admin' | 'member';
export type ConsentStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'signed' | 'expired' | 'revoked' | 'failed';
export type ConsentType = 'limited_query' | 'pre_employment' | 'blanket';
export type DeliveryMethod = 'sms' | 'whatsapp' | 'email' | 'manual';
export type NotificationStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undeliverable';

// Service request types
export type ServiceRequestCategory = 'api_integration' | 'mcp_setup' | 'custom_integration' | 'other';
export type ServiceRequestUrgency = 'low' | 'medium' | 'high';
export type ServiceRequestStatus = 'pending' | 'quoted' | 'deposit_paid' | 'in_progress' | 'completed' | 'cancelled' | 'refunded';

// Regulatory intelligence types
export type RegulatorySourceType = 'rss' | 'webpage' | 'api';
export type RegulatoryAlertStatus = 'new' | 'reviewing' | 'action_required' | 'resolved' | 'dismissed';

// Partner application types
export type PartnerApplicationStatus = 'pending' | 'paid' | 'provisioning' | 'active' | 'rejected';

// Webhook types
export type WebhookEventStatus = 'pending' | 'delivering' | 'delivered' | 'failed' | 'exhausted';

// Query tracking types
export type QueryType = 'limited' | 'pre_employment';
export type QueryResult = 'no_violations' | 'violations_found' | 'pending' | 'error';
export type EscalationStatus = 'pending' | 'full_query_completed' | 'driver_removed' | 'expired';
export type WebhookEventType =
  | 'consent.created'
  | 'consent.sent'
  | 'consent.delivered'
  | 'consent.opened'
  | 'consent.signed'
  | 'consent.failed'
  | 'consent.expired'
  | 'consent.revoked';

// Outreach types
export type PipelineStage = 'lead' | 'contacted' | 'replied' | 'demo' | 'trial' | 'customer' | 'lost';
export type CampaignStatus = 'draft' | 'active' | 'paused' | 'completed';
export type EnrollmentStatus = 'active' | 'completed' | 'paused' | 'replied' | 'bounced' | 'unsubscribed';
export type OutreachEventType = 'sent' | 'delivered' | 'opened' | 'clicked' | 'replied' | 'bounced' | 'unsubscribed' | 'complaint';

export interface Database {
  public: {
    Views: {
      [_ in never]: never;
    };
    Tables: {
      organizations: {
        Row: {
          id: string;
          name: string;
          dot_number: string | null;
          mc_number: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          phone: string | null;
          logo_url: string | null;
          settings: Json;
          stripe_customer_id: string | null;
          is_partner: boolean;
          last_tsv_download_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at' | 'is_partner' | 'last_tsv_download_at'> & {
          id?: string;
          is_partner?: boolean;
          last_tsv_download_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['organizations']['Insert']>;
        Relationships: [];
      };
      profiles: {
        Row: {
          id: string;
          organization_id: string;
          role: UserRole;
          full_name: string;
          email: string;
          phone: string | null;
          is_active: boolean;
          is_platform_admin: boolean;
          last_login_at: string | null;
          welcome_email_sent_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['profiles']['Row'], 'created_at' | 'updated_at'> & {
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['profiles']['Insert']>;
        Relationships: [];
      };
      drivers: {
        Row: {
          id: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email: string | null;
          phone: string | null;
          cdl_number: string | null;
          cdl_state: string | null;
          date_of_birth: string | null;
          hire_date: string | null;
          termination_date: string | null;
          preferred_language: string;
          metadata: Json;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          first_name: string;
          last_name: string;
          email?: string | null;
          phone?: string | null;
          cdl_number?: string | null;
          cdl_state?: string | null;
          date_of_birth?: string | null;
          hire_date?: string | null;
          termination_date?: string | null;
          preferred_language?: string;
          metadata?: Json;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['drivers']['Insert']>;
        Relationships: [];
      };
      consents: {
        Row: {
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
          signing_token: string | null;
          signing_token_expires_at: string | null;
          signed_at: string | null;
          signer_ip: string | null;
          signer_user_agent: string | null;
          signature_data: string | null;
          signature_hash: string | null;
          pdf_storage_path: string | null;
          pdf_hash: string | null;
          pdf_generated_at: string | null;
          driver_snapshot: Json | null;
          organization_snapshot: Json | null;
          retention_expires_at: string | null;
          is_archived: boolean;
          metadata: Json;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          driver_id: string;
          created_by: string;
          consent_type: ConsentType;
          status: ConsentStatus;
          language: string;
          consent_start_date: string;
          consent_end_date?: string | null;
          query_frequency?: string | null;
          delivery_method: DeliveryMethod;
          delivery_address: string;
          delivery_sid?: string | null;
          delivered_at?: string | null;
          opened_at?: string | null;
          signing_token?: string | null;
          signing_token_expires_at?: string | null;
          signed_at?: string | null;
          signer_ip?: string | null;
          signer_user_agent?: string | null;
          signature_data?: string | null;
          signature_hash?: string | null;
          pdf_storage_path?: string | null;
          pdf_hash?: string | null;
          pdf_generated_at?: string | null;
          driver_snapshot?: Json | null;
          organization_snapshot?: Json | null;
          retention_expires_at?: string | null;
          is_archived: boolean;
          metadata?: Json;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['consents']['Insert']>;
        Relationships: [];
      };
      credit_balances: {
        Row: {
          organization_id: string;
          balance: number;
          lifetime_purchased: number;
          lifetime_used: number;
          updated_at: string;
        };
        Insert: Database['public']['Tables']['credit_balances']['Row'];
        Update: Partial<Database['public']['Tables']['credit_balances']['Insert']>;
        Relationships: [];
      };
      credit_transactions: {
        Row: {
          id: string;
          organization_id: string;
          type: string;
          amount: number;
          balance_after: number;
          description: string;
          reference_id: string | null;
          reference_type: string | null;
          created_by: string | null;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['credit_transactions']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['credit_transactions']['Insert']>;
        Relationships: [];
      };
      audit_log: {
        Row: {
          id: number;
          organization_id: string;
          actor_id: string | null;
          actor_type: string;
          action: string;
          resource_type: string;
          resource_id: string;
          details: Json;
          ip_address: string | null;
          user_agent: string | null;
          created_at: string;
        };
        Insert: {
          id?: number;
          organization_id: string;
          actor_id?: string | null;
          actor_type: string;
          action: string;
          resource_type: string;
          resource_id: string;
          details?: Json;
          ip_address?: string | null;
          user_agent?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['audit_log']['Insert']>;
        Relationships: [];
      };
      api_keys: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          key_prefix: string;
          key_hash: string;
          scopes: string[];
          is_active: boolean;
          last_used_at: string | null;
          expires_at: string | null;
          created_by: string;
          created_at: string;
        };
        Insert: Omit<Database['public']['Tables']['api_keys']['Row'], 'id' | 'created_at'> & {
          id?: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['api_keys']['Insert']>;
        Relationships: [];
      };
      consent_templates: {
        Row: {
          id: string;
          organization_id: string;
          name: string;
          language: string;
          consent_type: ConsentType;
          body_text: string;
          is_default: boolean;
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['consent_templates']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['consent_templates']['Insert']>;
        Relationships: [];
      };
      notifications: {
        Row: {
          id: string;
          organization_id: string;
          consent_id: string | null;
          type: string;
          channel: DeliveryMethod;
          recipient: string;
          message_body: string | null;
          external_id: string | null;
          status: NotificationStatus;
          status_detail: string | null;
          attempts: number;
          max_attempts: number;
          next_attempt_at: string | null;
          sent_at: string | null;
          delivered_at: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          consent_id?: string | null;
          type: string;
          channel: DeliveryMethod;
          recipient: string;
          message_body?: string | null;
          external_id?: string | null;
          status: NotificationStatus;
          status_detail?: string | null;
          attempts: number;
          max_attempts: number;
          next_attempt_at?: string | null;
          sent_at?: string | null;
          delivered_at?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['notifications']['Insert']>;
        Relationships: [];
      };
      outreach_leads: {
        Row: {
          id: string;
          company_name: string;
          dot_number: string | null;
          mc_number: string | null;
          phone: string | null;
          email: string | null;
          contact_name: string | null;
          contact_title: string | null;
          address_line1: string | null;
          address_line2: string | null;
          city: string | null;
          state: string | null;
          zip: string | null;
          fleet_size: number | null;
          driver_count: number | null;
          carrier_operation: string | null;
          operating_status: string | null;
          pipeline_stage: PipelineStage;
          lead_score: number;
          lead_source: string | null;
          ai_summary: string | null;
          tags: string[];
          do_not_contact: boolean;
          last_contacted_at: string | null;
          organization_id: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          dot_number?: string | null;
          mc_number?: string | null;
          phone?: string | null;
          email?: string | null;
          contact_name?: string | null;
          contact_title?: string | null;
          address_line1?: string | null;
          address_line2?: string | null;
          city?: string | null;
          state?: string | null;
          zip?: string | null;
          fleet_size?: number | null;
          driver_count?: number | null;
          carrier_operation?: string | null;
          operating_status?: string | null;
          pipeline_stage?: PipelineStage;
          lead_score?: number;
          lead_source?: string | null;
          ai_summary?: string | null;
          tags?: string[];
          do_not_contact?: boolean;
          last_contacted_at?: string | null;
          organization_id?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outreach_leads']['Insert']>;
        Relationships: [];
      };
      outreach_campaigns: {
        Row: {
          id: string;
          name: string;
          description: string | null;
          status: CampaignStatus;
          target_filters: Json;
          send_settings: Json;
          stats_sent: number;
          stats_opened: number;
          stats_clicked: number;
          stats_replied: number;
          stats_bounced: number;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          description?: string | null;
          status?: CampaignStatus;
          target_filters?: Json;
          send_settings?: Json;
          stats_sent?: number;
          stats_opened?: number;
          stats_clicked?: number;
          stats_replied?: number;
          stats_bounced?: number;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outreach_campaigns']['Insert']>;
        Relationships: [];
      };
      outreach_sequence_steps: {
        Row: {
          id: string;
          campaign_id: string;
          step_order: number;
          delay_days: number;
          subject: string | null;
          body_html: string | null;
          body_text: string | null;
          use_ai_generation: boolean;
          ai_prompt: string | null;
          skip_if_replied: boolean;
          skip_if_opened: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          step_order: number;
          delay_days?: number;
          subject?: string | null;
          body_html?: string | null;
          body_text?: string | null;
          use_ai_generation?: boolean;
          ai_prompt?: string | null;
          skip_if_replied?: boolean;
          skip_if_opened?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outreach_sequence_steps']['Insert']>;
        Relationships: [];
      };
      outreach_enrollments: {
        Row: {
          id: string;
          campaign_id: string;
          lead_id: string;
          status: EnrollmentStatus;
          current_step: number;
          next_send_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          campaign_id: string;
          lead_id: string;
          status?: EnrollmentStatus;
          current_step?: number;
          next_send_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outreach_enrollments']['Insert']>;
        Relationships: [];
      };
      outreach_events: {
        Row: {
          id: string;
          enrollment_id: string | null;
          lead_id: string;
          campaign_id: string | null;
          step_id: string | null;
          event_type: OutreachEventType;
          resend_message_id: string | null;
          ai_reply_classification: string | null;
          ai_reply_summary: string | null;
          details: Json;
          created_at: string;
        };
        Insert: {
          id?: string;
          enrollment_id?: string | null;
          lead_id: string;
          campaign_id?: string | null;
          step_id?: string | null;
          event_type: OutreachEventType;
          resend_message_id?: string | null;
          ai_reply_classification?: string | null;
          ai_reply_summary?: string | null;
          details?: Json;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['outreach_events']['Insert']>;
        Relationships: [];
      };
      service_requests: {
        Row: {
          id: string;
          organization_id: string;
          requested_by: string;
          category: ServiceRequestCategory;
          description: string;
          urgency: ServiceRequestUrgency;
          tms_system: string | null;
          status: ServiceRequestStatus;
          quoted_amount: number | null;
          deposit_amount: number | null;
          deposit_stripe_payment_intent: string | null;
          admin_notes: string | null;
          quoted_at: string | null;
          deposit_paid_at: string | null;
          started_at: string | null;
          completed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          requested_by: string;
          category: ServiceRequestCategory;
          description: string;
          urgency?: ServiceRequestUrgency;
          tms_system?: string | null;
          status?: ServiceRequestStatus;
          quoted_amount?: number | null;
          deposit_amount?: number | null;
          deposit_stripe_payment_intent?: string | null;
          admin_notes?: string | null;
          quoted_at?: string | null;
          deposit_paid_at?: string | null;
          started_at?: string | null;
          completed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['service_requests']['Insert']>;
        Relationships: [];
      };
      platform_config: {
        Row: {
          key: string;
          encrypted_value: string;
          description: string | null;
          updated_at: string;
          updated_by: string | null;
        };
        Insert: {
          key: string;
          encrypted_value: string;
          description?: string | null;
          updated_at?: string;
          updated_by?: string | null;
        };
        Update: Partial<Database['public']['Tables']['platform_config']['Insert']>;
        Relationships: [];
      };
      regulatory_sources: {
        Row: {
          id: string;
          name: string;
          url: string;
          source_type: RegulatorySourceType;
          check_frequency_hours: number;
          last_checked_at: string | null;
          is_active: boolean;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          name: string;
          url: string;
          source_type?: RegulatorySourceType;
          check_frequency_hours?: number;
          last_checked_at?: string | null;
          is_active?: boolean;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['regulatory_sources']['Insert']>;
        Relationships: [];
      };
      regulatory_alerts: {
        Row: {
          id: string;
          source_id: string | null;
          title: string;
          url: string | null;
          summary: string | null;
          content_hash: string;
          relevance_score: number;
          category: string | null;
          impact_assessment: string | null;
          recommended_actions: string | null;
          affected_areas: string[];
          status: RegulatoryAlertStatus;
          admin_notes: string | null;
          reviewed_by: string | null;
          reviewed_at: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          source_id?: string | null;
          title: string;
          url?: string | null;
          summary?: string | null;
          content_hash: string;
          relevance_score?: number;
          category?: string | null;
          impact_assessment?: string | null;
          recommended_actions?: string | null;
          affected_areas?: string[];
          status?: RegulatoryAlertStatus;
          admin_notes?: string | null;
          reviewed_by?: string | null;
          reviewed_at?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['regulatory_alerts']['Insert']>;
        Relationships: [];
      };
      partner_applications: {
        Row: {
          id: string;
          company_name: string;
          website_url: string | null;
          employee_count_range: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          partnership_reason: string;
          tms_platform_name: string;
          carrier_count_range: string;
          consents_per_carrier_month: string;
          estimated_annual_consents: number;
          recommended_pack_id: string | null;
          has_migration_data: boolean;
          migration_file_paths: string[];
          migration_total_bytes: number;
          migration_fee_cents: number;
          auto_create_carriers: boolean;
          auto_create_fee_cents: number;
          selected_pack_id: string;
          selected_pack_credits: number;
          selected_pack_price_cents: number;
          partner_agreement_accepted: boolean;
          data_processing_accepted: boolean;
          legal_signatory_name: string;
          legal_accepted_at: string | null;
          onboarding_fee_cents: number;
          total_amount_cents: number;
          stripe_checkout_session_id: string | null;
          stripe_payment_intent_id: string | null;
          status: PartnerApplicationStatus;
          organization_id: string | null;
          provisioned_at: string | null;
          magic_link: string | null;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          company_name: string;
          website_url?: string | null;
          employee_count_range: string;
          contact_name: string;
          contact_email: string;
          contact_phone: string;
          partnership_reason: string;
          tms_platform_name: string;
          carrier_count_range: string;
          consents_per_carrier_month: string;
          estimated_annual_consents?: number;
          recommended_pack_id?: string | null;
          has_migration_data?: boolean;
          migration_file_paths?: string[];
          migration_total_bytes?: number;
          migration_fee_cents?: number;
          auto_create_carriers?: boolean;
          auto_create_fee_cents?: number;
          selected_pack_id: string;
          selected_pack_credits: number;
          selected_pack_price_cents: number;
          partner_agreement_accepted?: boolean;
          data_processing_accepted?: boolean;
          legal_signatory_name: string;
          legal_accepted_at?: string | null;
          onboarding_fee_cents?: number;
          total_amount_cents: number;
          stripe_checkout_session_id?: string | null;
          stripe_payment_intent_id?: string | null;
          status?: PartnerApplicationStatus;
          organization_id?: string | null;
          provisioned_at?: string | null;
          magic_link?: string | null;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['partner_applications']['Insert']>;
        Relationships: [];
      };
      migration_transfers: {
        Row: {
          id: string;
          application_id: string | null;
          token: string;
          label: string;
          uploaded_files: Json;
          total_bytes: number;
          carrier_count: number | null;
          driver_count: number | null;
          parsed_at: string | null;
          expires_at: string;
          created_at: string;
        };
        Insert: {
          id?: string;
          application_id?: string | null;
          token: string;
          label?: string;
          uploaded_files?: Json;
          total_bytes?: number;
          carrier_count?: number | null;
          driver_count?: number | null;
          parsed_at?: string | null;
          expires_at: string;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['migration_transfers']['Insert']>;
        Relationships: [];
      };
      partner_organizations: {
        Row: {
          id: string;
          partner_org_id: string;
          carrier_org_id: string;
          created_from_migration: boolean;
          is_active: boolean;
          created_at: string;
        };
        Insert: {
          id?: string;
          partner_org_id: string;
          carrier_org_id: string;
          created_from_migration?: boolean;
          is_active?: boolean;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['partner_organizations']['Insert']>;
        Relationships: [];
      };
      webhook_endpoints: {
        Row: {
          id: string;
          organization_id: string;
          url: string;
          description: string | null;
          secret: string;
          events: string[];
          is_active: boolean;
          created_by: string;
          created_at: string;
          updated_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          url: string;
          description?: string | null;
          secret: string;
          events: string[];
          is_active?: boolean;
          created_by: string;
          created_at?: string;
          updated_at?: string;
        };
        Update: Partial<Database['public']['Tables']['webhook_endpoints']['Insert']>;
        Relationships: [];
      };
      webhook_events: {
        Row: {
          id: string;
          endpoint_id: string;
          organization_id: string;
          event_type: string;
          consent_id: string | null;
          payload: Json;
          status: WebhookEventStatus;
          attempts: number;
          max_attempts: number;
          last_attempt_at: string | null;
          next_retry_at: string | null;
          response_status: number | null;
          response_body: string | null;
          error_message: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          endpoint_id: string;
          organization_id: string;
          event_type: string;
          consent_id?: string | null;
          payload?: Json;
          status?: WebhookEventStatus;
          attempts?: number;
          max_attempts?: number;
          last_attempt_at?: string | null;
          next_retry_at?: string | null;
          response_status?: number | null;
          response_body?: string | null;
          error_message?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['webhook_events']['Insert']>;
        Relationships: [];
      };
      query_records: {
        Row: {
          id: string;
          organization_id: string;
          driver_id: string;
          consent_id: string | null;
          query_type: QueryType;
          query_date: string;
          result: QueryResult;
          result_notes: string | null;
          recorded_by: string | null;
          escalation_deadline: string | null;
          escalation_status: EscalationStatus | null;
          escalation_resolved_at: string | null;
          escalation_resolved_by: string | null;
          created_at: string;
        };
        Insert: {
          id?: string;
          organization_id: string;
          driver_id: string;
          consent_id?: string | null;
          query_type?: QueryType;
          query_date: string;
          result?: QueryResult;
          result_notes?: string | null;
          recorded_by?: string | null;
          escalation_deadline?: string | null;
          escalation_status?: EscalationStatus | null;
          escalation_resolved_at?: string | null;
          escalation_resolved_by?: string | null;
          created_at?: string;
        };
        Update: Partial<Database['public']['Tables']['query_records']['Insert']>;
        Relationships: [];
      };
    };
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      deduct_credit: {
        Args: { p_org_id: string; p_consent_id: string; p_user_id: string | null };
        Returns: boolean;
      };
      add_credits: {
        Args: { p_org_id: string; p_amount: number; p_stripe_payment_id: string; p_description?: string };
        Returns: number;
      };
    };
  };
}
