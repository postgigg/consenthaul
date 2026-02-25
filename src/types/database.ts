export type Json = string | number | boolean | null | { [key: string]: Json | undefined } | Json[];

export type UserRole = 'owner' | 'admin' | 'member';
export type ConsentStatus = 'pending' | 'sent' | 'delivered' | 'opened' | 'signed' | 'expired' | 'revoked' | 'failed';
export type ConsentType = 'limited_query' | 'pre_employment' | 'blanket';
export type DeliveryMethod = 'sms' | 'whatsapp' | 'email' | 'manual';
export type NotificationStatus = 'queued' | 'sending' | 'sent' | 'delivered' | 'failed' | 'undeliverable';

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
          created_at: string;
          updated_at: string;
        };
        Insert: Omit<Database['public']['Tables']['organizations']['Row'], 'id' | 'created_at' | 'updated_at'> & {
          id?: string;
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
    };
    Functions: {
      get_user_org_id: {
        Args: Record<string, never>;
        Returns: string;
      };
      deduct_credit: {
        Args: { p_org_id: string; p_consent_id: string; p_user_id: string };
        Returns: boolean;
      };
      add_credits: {
        Args: { p_org_id: string; p_amount: number; p_stripe_payment_id: string; p_description?: string };
        Returns: number;
      };
    };
  };
}
