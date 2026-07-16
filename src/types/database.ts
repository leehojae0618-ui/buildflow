export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export type Database = {
  // Allows to automatically instantiate createClient with right options
  // instead of createClient<Database, { PostgrestVersion: 'XX' }>(URL, KEY)
  __InternalSupabase: {
    PostgrestVersion: "14.5"
  }
  public: {
    Tables: {
      autonomous_build_sessions: {
        Row: {
          action_bundle: Json
          approval_granted_at: string | null
          approval_plan: Json
          approval_scope_version: string | null
          blocked_reason: string | null
          completed_phases: Json
          consent_granted_at: string | null
          created_at: string
          current_phase: string
          execution_id: string | null
          id: string
          metrics: Json
          next_user_action: Json | null
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          action_bundle?: Json
          approval_granted_at?: string | null
          approval_plan?: Json
          approval_scope_version?: string | null
          blocked_reason?: string | null
          completed_phases?: Json
          consent_granted_at?: string | null
          created_at?: string
          current_phase?: string
          execution_id?: string | null
          id?: string
          metrics?: Json
          next_user_action?: Json | null
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          action_bundle?: Json
          approval_granted_at?: string | null
          approval_plan?: Json
          approval_scope_version?: string | null
          blocked_reason?: string | null
          completed_phases?: Json
          consent_granted_at?: string | null
          created_at?: string
          current_phase?: string
          execution_id?: string | null
          id?: string
          metrics?: Json
          next_user_action?: Json | null
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "autonomous_build_sessions_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "build_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "autonomous_build_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      build_executions: {
        Row: {
          architecture_snapshot: Json
          build_plan_snapshot: Json
          created_at: string
          id: string
          idempotency_key: string
          project_id: string
          selected_candidate_id: string | null
          selected_strategy: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          architecture_snapshot?: Json
          build_plan_snapshot?: Json
          created_at?: string
          id?: string
          idempotency_key: string
          project_id: string
          selected_candidate_id?: string | null
          selected_strategy?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          architecture_snapshot?: Json
          build_plan_snapshot?: Json
          created_at?: string
          id?: string
          idempotency_key?: string
          project_id?: string
          selected_candidate_id?: string | null
          selected_strategy?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "build_executions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      deployment_sessions: {
        Row: {
          automatic_recovery_count: number
          completed_stages: Json
          completion_report: Json
          created_at: string
          current_stage: string
          estimate: Json
          id: string
          project_id: string
          retry_count: number
          state: string
          updated_at: string
          user_id: string
        }
        Insert: {
          automatic_recovery_count?: number
          completed_stages?: Json
          completion_report?: Json
          created_at?: string
          current_stage?: string
          estimate?: Json
          id?: string
          project_id: string
          retry_count?: number
          state?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          automatic_recovery_count?: number
          completed_stages?: Json
          completion_report?: Json
          created_at?: string
          current_stage?: string
          estimate?: Json
          id?: string
          project_id?: string
          retry_count?: number
          state?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "deployment_sessions_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_approvals: {
        Row: {
          created_at: string
          decided_at: string | null
          description: string
          estimated_cost_cents: number
          execution_task_id: string
          id: string
          impact: string
          provider: string | null
          reversible: boolean
          status: string
          user_id: string
        }
        Insert: {
          created_at?: string
          decided_at?: string | null
          description: string
          estimated_cost_cents?: number
          execution_task_id: string
          id?: string
          impact?: string
          provider?: string | null
          reversible?: boolean
          status?: string
          user_id: string
        }
        Update: {
          created_at?: string
          decided_at?: string | null
          description?: string
          estimated_cost_cents?: number
          execution_task_id?: string
          id?: string
          impact?: string
          provider?: string | null
          reversible?: boolean
          status?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_approvals_execution_task_id_fkey"
            columns: ["execution_task_id"]
            isOneToOne: false
            referencedRelation: "execution_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_attempts: {
        Row: {
          attempt_number: number
          error_code: string | null
          error_message: string | null
          execution_task_id: string
          finished_at: string | null
          id: string
          started_at: string
          status: string
        }
        Insert: {
          attempt_number: number
          error_code?: string | null
          error_message?: string | null
          execution_task_id: string
          finished_at?: string | null
          id?: string
          started_at?: string
          status: string
        }
        Update: {
          attempt_number?: number
          error_code?: string | null
          error_message?: string | null
          execution_task_id?: string
          finished_at?: string | null
          id?: string
          started_at?: string
          status?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_attempts_execution_task_id_fkey"
            columns: ["execution_task_id"]
            isOneToOne: false
            referencedRelation: "execution_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_events: {
        Row: {
          created_at: string
          event_type: string
          execution_id: string
          execution_task_id: string | null
          id: string
          safe_metadata: Json
          status: string | null
        }
        Insert: {
          created_at?: string
          event_type: string
          execution_id: string
          execution_task_id?: string | null
          id?: string
          safe_metadata?: Json
          status?: string | null
        }
        Update: {
          created_at?: string
          event_type?: string
          execution_id?: string
          execution_task_id?: string | null
          id?: string
          safe_metadata?: Json
          status?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "execution_events_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "build_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "execution_events_execution_task_id_fkey"
            columns: ["execution_task_id"]
            isOneToOne: false
            referencedRelation: "execution_tasks"
            referencedColumns: ["id"]
          },
        ]
      }
      execution_tasks: {
        Row: {
          action: string
          artifact_manifest: Json
          created_at: string
          dependency_keys: Json
          execution_id: string
          id: string
          max_retries: number
          retry_count: number
          status: string
          task_key: string
          title: string
          updated_at: string
        }
        Insert: {
          action: string
          artifact_manifest?: Json
          created_at?: string
          dependency_keys?: Json
          execution_id: string
          id?: string
          max_retries?: number
          retry_count?: number
          status?: string
          task_key: string
          title: string
          updated_at?: string
        }
        Update: {
          action?: string
          artifact_manifest?: Json
          created_at?: string
          dependency_keys?: Json
          execution_id?: string
          id?: string
          max_retries?: number
          retry_count?: number
          status?: string
          task_key?: string
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "execution_tasks_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "build_executions"
            referencedColumns: ["id"]
          },
        ]
      }
      profiles: {
        Row: {
          ai_experience: string | null
          can_develop: boolean | null
          created_at: string
          display_name: string | null
          id: string
          primary_use_case: string | null
          updated_at: string
        }
        Insert: {
          ai_experience?: string | null
          can_develop?: boolean | null
          created_at?: string
          display_name?: string | null
          id: string
          primary_use_case?: string | null
          updated_at?: string
        }
        Update: {
          ai_experience?: string | null
          can_develop?: boolean | null
          created_at?: string
          display_name?: string | null
          id?: string
          primary_use_case?: string | null
          updated_at?: string
        }
        Relationships: []
      }
      project_workflow_steps: {
        Row: {
          completed_at: string | null
          description: string
          id: string
          is_completed: boolean
          project_workflow_id: string
          snapshot: Json
          status: string
          step_order: number
          title: string
          updated_at: string
        }
        Insert: {
          completed_at?: string | null
          description?: string
          id?: string
          is_completed?: boolean
          project_workflow_id: string
          snapshot?: Json
          status?: string
          step_order: number
          title: string
          updated_at?: string
        }
        Update: {
          completed_at?: string | null
          description?: string
          id?: string
          is_completed?: boolean
          project_workflow_id?: string
          snapshot?: Json
          status?: string
          step_order?: number
          title?: string
          updated_at?: string
        }
        Relationships: [
          {
            foreignKeyName: "project_workflow_steps_project_workflow_id_fkey"
            columns: ["project_workflow_id"]
            isOneToOne: false
            referencedRelation: "project_workflows"
            referencedColumns: ["id"]
          },
        ]
      }
      project_workflows: {
        Row: {
          created_at: string
          id: string
          project_id: string
          recommendation_id: string | null
          snapshot: Json
          status: string
          updated_at: string
          workflow_template_id: string | null
        }
        Insert: {
          created_at?: string
          id?: string
          project_id: string
          recommendation_id?: string | null
          snapshot?: Json
          status?: string
          updated_at?: string
          workflow_template_id?: string | null
        }
        Update: {
          created_at?: string
          id?: string
          project_id?: string
          recommendation_id?: string | null
          snapshot?: Json
          status?: string
          updated_at?: string
          workflow_template_id?: string | null
        }
        Relationships: [
          {
            foreignKeyName: "project_workflows_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workflows_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "project_workflows_workflow_template_id_fkey"
            columns: ["workflow_template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      projects: {
        Row: {
          created_at: string
          goal: string | null
          goal_constraints: Json
          goal_description: string | null
          id: string
          status: string
          title: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          goal?: string | null
          goal_constraints?: Json
          goal_description?: string | null
          id?: string
          status?: string
          title: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          goal?: string | null
          goal_constraints?: Json
          goal_description?: string | null
          id?: string
          status?: string
          title?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: []
      }
      provider_command_runs: {
        Row: {
          approval_scope: string
          attempt_number: number
          autonomous_session_id: string | null
          command_id: string
          command_kind: string
          completed_at: string | null
          created_at: string
          execution_id: string | null
          id: string
          payload_checksum: string
          project_id: string
          provider: string
          safe_result: Json
          started_at: string | null
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          approval_scope: string
          attempt_number?: number
          autonomous_session_id?: string | null
          command_id: string
          command_kind: string
          completed_at?: string | null
          created_at?: string
          execution_id?: string | null
          id?: string
          payload_checksum: string
          project_id: string
          provider: string
          safe_result?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          approval_scope?: string
          attempt_number?: number
          autonomous_session_id?: string | null
          command_id?: string
          command_kind?: string
          completed_at?: string | null
          created_at?: string
          execution_id?: string | null
          id?: string
          payload_checksum?: string
          project_id?: string
          provider?: string
          safe_result?: Json
          started_at?: string | null
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_command_runs_autonomous_session_id_fkey"
            columns: ["autonomous_session_id"]
            isOneToOne: false
            referencedRelation: "autonomous_build_sessions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_command_runs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "build_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "provider_command_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      provider_credentials: {
        Row: {
          created_at: string
          credential_version: number
          expires_at: string | null
          id: string
          last_validated_at: string | null
          project_id: string
          provider: string
          safe_metadata: Json
          status: string
          updated_at: string
          user_id: string
          vault_secret_id: string
        }
        Insert: {
          created_at?: string
          credential_version?: number
          expires_at?: string | null
          id?: string
          last_validated_at?: string | null
          project_id: string
          provider: string
          safe_metadata?: Json
          status?: string
          updated_at?: string
          user_id: string
          vault_secret_id: string
        }
        Update: {
          created_at?: string
          credential_version?: number
          expires_at?: string | null
          id?: string
          last_validated_at?: string | null
          project_id?: string
          provider?: string
          safe_metadata?: Json
          status?: string
          updated_at?: string
          user_id?: string
          vault_secret_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "provider_credentials_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendation_candidates: {
        Row: {
          id: string
          rank: number
          reason: string | null
          recommendation_id: string
          score: number | null
          snapshot: Json
          workflow_template_id: string
        }
        Insert: {
          id?: string
          rank: number
          reason?: string | null
          recommendation_id: string
          score?: number | null
          snapshot?: Json
          workflow_template_id: string
        }
        Update: {
          id?: string
          rank?: number
          reason?: string | null
          recommendation_id?: string
          score?: number | null
          snapshot?: Json
          workflow_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendation_candidates_recommendation_id_fkey"
            columns: ["recommendation_id"]
            isOneToOne: false
            referencedRelation: "recommendations"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "recommendation_candidates_workflow_template_id_fkey"
            columns: ["workflow_template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      recommendations: {
        Row: {
          created_at: string
          explanation: string | null
          id: string
          input_snapshot: Json
          project_id: string
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          explanation?: string | null
          id?: string
          input_snapshot?: Json
          project_id: string
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          explanation?: string | null
          id?: string
          input_snapshot?: Json
          project_id?: string
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "recommendations_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      tools: {
        Row: {
          category: string
          created_at: string
          description: string
          difficulty: string | null
          execution_support: string | null
          has_api: boolean
          has_oauth: boolean
          id: string
          is_active: boolean
          last_verified: string | null
          name: string
          pricing_model: string | null
          slug: string
          updated_at: string
        }
        Insert: {
          category: string
          created_at?: string
          description?: string
          difficulty?: string | null
          execution_support?: string | null
          has_api?: boolean
          has_oauth?: boolean
          id?: string
          is_active?: boolean
          last_verified?: string | null
          name: string
          pricing_model?: string | null
          slug: string
          updated_at?: string
        }
        Update: {
          category?: string
          created_at?: string
          description?: string
          difficulty?: string | null
          execution_support?: string | null
          has_api?: boolean
          has_oauth?: boolean
          id?: string
          is_active?: boolean
          last_verified?: string | null
          name?: string
          pricing_model?: string | null
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
      usage_records: {
        Row: {
          created_at: string
          event_type: string
          id: string
          metadata: Json
          project_id: string | null
          user_id: string
        }
        Insert: {
          created_at?: string
          event_type: string
          id?: string
          metadata?: Json
          project_id?: string | null
          user_id: string
        }
        Update: {
          created_at?: string
          event_type?: string
          id?: string
          metadata?: Json
          project_id?: string | null
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "usage_records_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_attempts: {
        Row: {
          attempt_number: number
          completed_at: string | null
          id: string
          safe_evidence: Json
          started_at: string
          status: string
          verification_target_id: string
        }
        Insert: {
          attempt_number: number
          completed_at?: string | null
          id?: string
          safe_evidence?: Json
          started_at?: string
          status: string
          verification_target_id: string
        }
        Update: {
          attempt_number?: number
          completed_at?: string | null
          id?: string
          safe_evidence?: Json
          started_at?: string
          status?: string
          verification_target_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_attempts_verification_target_id_fkey"
            columns: ["verification_target_id"]
            isOneToOne: false
            referencedRelation: "verification_targets"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_errors: {
        Row: {
          created_at: string
          id: string
          message: string
          retryable: boolean
          safe_error_code: string
          verification_attempt_id: string
        }
        Insert: {
          created_at?: string
          id?: string
          message: string
          retryable?: boolean
          safe_error_code: string
          verification_attempt_id: string
        }
        Update: {
          created_at?: string
          id?: string
          message?: string
          retryable?: boolean
          safe_error_code?: string
          verification_attempt_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_errors_verification_attempt_id_fkey"
            columns: ["verification_attempt_id"]
            isOneToOne: false
            referencedRelation: "verification_attempts"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_runs: {
        Row: {
          created_at: string
          credential_snapshot_version: string | null
          execution_id: string | null
          final_status: string
          id: string
          project_id: string
          result: Json
          status: string
          updated_at: string
          user_id: string
        }
        Insert: {
          created_at?: string
          credential_snapshot_version?: string | null
          execution_id?: string | null
          final_status?: string
          id?: string
          project_id: string
          result?: Json
          status?: string
          updated_at?: string
          user_id: string
        }
        Update: {
          created_at?: string
          credential_snapshot_version?: string | null
          execution_id?: string | null
          final_status?: string
          id?: string
          project_id?: string
          result?: Json
          status?: string
          updated_at?: string
          user_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "verification_runs_execution_id_fkey"
            columns: ["execution_id"]
            isOneToOne: false
            referencedRelation: "build_executions"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "verification_runs_project_id_fkey"
            columns: ["project_id"]
            isOneToOne: false
            referencedRelation: "projects"
            referencedColumns: ["id"]
          },
        ]
      }
      verification_targets: {
        Row: {
          expires_at: string | null
          id: string
          last_attempt_at: string | null
          latency_ms: number | null
          provider: string
          required: boolean
          safe_error_code: string | null
          status: string
          verification_run_id: string
          verification_stage: string
          verified_capabilities: Json
        }
        Insert: {
          expires_at?: string | null
          id?: string
          last_attempt_at?: string | null
          latency_ms?: number | null
          provider: string
          required?: boolean
          safe_error_code?: string | null
          status?: string
          verification_run_id: string
          verification_stage: string
          verified_capabilities?: Json
        }
        Update: {
          expires_at?: string | null
          id?: string
          last_attempt_at?: string | null
          latency_ms?: number | null
          provider?: string
          required?: boolean
          safe_error_code?: string | null
          status?: string
          verification_run_id?: string
          verification_stage?: string
          verified_capabilities?: Json
        }
        Relationships: [
          {
            foreignKeyName: "verification_targets_verification_run_id_fkey"
            columns: ["verification_run_id"]
            isOneToOne: false
            referencedRelation: "verification_runs"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_template_steps: {
        Row: {
          description: string
          id: string
          is_required: boolean
          step_order: number
          title: string
          tool_id: string | null
          workflow_template_id: string
        }
        Insert: {
          description?: string
          id?: string
          is_required?: boolean
          step_order: number
          title: string
          tool_id?: string | null
          workflow_template_id: string
        }
        Update: {
          description?: string
          id?: string
          is_required?: boolean
          step_order?: number
          title?: string
          tool_id?: string | null
          workflow_template_id?: string
        }
        Relationships: [
          {
            foreignKeyName: "workflow_template_steps_tool_id_fkey"
            columns: ["tool_id"]
            isOneToOne: false
            referencedRelation: "tools"
            referencedColumns: ["id"]
          },
          {
            foreignKeyName: "workflow_template_steps_workflow_template_id_fkey"
            columns: ["workflow_template_id"]
            isOneToOne: false
            referencedRelation: "workflow_templates"
            referencedColumns: ["id"]
          },
        ]
      }
      workflow_templates: {
        Row: {
          alternatives: Json
          category: string
          cost_model: Json
          created_at: string
          description: string
          difficulty: string | null
          estimated_setup_minutes: number | null
          execution_support_level: string | null
          goal_summary: string
          id: string
          is_active: boolean
          name: string
          required_tools: Json
          slug: string
          updated_at: string
        }
        Insert: {
          alternatives?: Json
          category: string
          cost_model?: Json
          created_at?: string
          description?: string
          difficulty?: string | null
          estimated_setup_minutes?: number | null
          execution_support_level?: string | null
          goal_summary?: string
          id?: string
          is_active?: boolean
          name: string
          required_tools?: Json
          slug: string
          updated_at?: string
        }
        Update: {
          alternatives?: Json
          category?: string
          cost_model?: Json
          created_at?: string
          description?: string
          difficulty?: string | null
          estimated_setup_minutes?: number | null
          execution_support_level?: string | null
          goal_summary?: string
          id?: string
          is_active?: boolean
          name?: string
          required_tools?: Json
          slug?: string
          updated_at?: string
        }
        Relationships: []
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      clone_provider_credentials_for_worker: {
        Args: {
          p_providers: string[]
          p_source_project_id: string
          p_target_project_id: string
          p_user_id: string
        }
        Returns: number
      }
      persist_verification_run: {
        Args: {
          p_attempts: Json
          p_credential_snapshot_version: string
          p_execution_id: string
          p_final_status: string
          p_project_id: string
          p_result: Json
          p_status: string
          p_targets: Json
        }
        Returns: string
      }
      persist_verification_run_for_owner: {
        Args: {
          p_attempts: Json
          p_credential_snapshot_version: string
          p_execution_id: string
          p_final_status: string
          p_project_id: string
          p_result: Json
          p_status: string
          p_targets: Json
          p_user_id: string
        }
        Returns: string
      }
      resolve_provider_credential: {
        Args: { p_project_id: string; p_provider: string; p_user_id: string }
        Returns: string
      }
      store_provider_credential: {
        Args: {
          p_project_id: string
          p_provider: string
          p_safe_metadata?: Json
          p_secret: string
        }
        Returns: string
      }
    }
    Enums: {
      [_ in never]: never
    }
    CompositeTypes: {
      [_ in never]: never
    }
  }
}

type DatabaseWithoutInternals = Omit<Database, "__InternalSupabase">

type DefaultSchema = DatabaseWithoutInternals[Extract<keyof Database, "public">]

export type Tables<
  DefaultSchemaTableNameOrOptions extends
    | keyof (DefaultSchema["Tables"] & DefaultSchema["Views"])
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
        DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? (DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"] &
      DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Views"])[TableName] extends {
      Row: infer R
    }
    ? R
    : never
  : DefaultSchemaTableNameOrOptions extends keyof (DefaultSchema["Tables"] &
        DefaultSchema["Views"])
    ? (DefaultSchema["Tables"] &
        DefaultSchema["Views"])[DefaultSchemaTableNameOrOptions] extends {
        Row: infer R
      }
      ? R
      : never
    : never

export type TablesInsert<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Insert: infer I
    }
    ? I
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Insert: infer I
      }
      ? I
      : never
    : never

export type TablesUpdate<
  DefaultSchemaTableNameOrOptions extends
    | keyof DefaultSchema["Tables"]
    | { schema: keyof DatabaseWithoutInternals },
  TableName extends DefaultSchemaTableNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"]
    : never = never,
> = DefaultSchemaTableNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaTableNameOrOptions["schema"]]["Tables"][TableName] extends {
      Update: infer U
    }
    ? U
    : never
  : DefaultSchemaTableNameOrOptions extends keyof DefaultSchema["Tables"]
    ? DefaultSchema["Tables"][DefaultSchemaTableNameOrOptions] extends {
        Update: infer U
      }
      ? U
      : never
    : never

export type Enums<
  DefaultSchemaEnumNameOrOptions extends
    | keyof DefaultSchema["Enums"]
    | { schema: keyof DatabaseWithoutInternals },
  EnumName extends DefaultSchemaEnumNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"]
    : never = never,
> = DefaultSchemaEnumNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[DefaultSchemaEnumNameOrOptions["schema"]]["Enums"][EnumName]
  : DefaultSchemaEnumNameOrOptions extends keyof DefaultSchema["Enums"]
    ? DefaultSchema["Enums"][DefaultSchemaEnumNameOrOptions]
    : never

export type CompositeTypes<
  PublicCompositeTypeNameOrOptions extends
    | keyof DefaultSchema["CompositeTypes"]
    | { schema: keyof DatabaseWithoutInternals },
  CompositeTypeName extends PublicCompositeTypeNameOrOptions extends {
    schema: keyof DatabaseWithoutInternals
  }
    ? keyof DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"]
    : never = never,
> = PublicCompositeTypeNameOrOptions extends {
  schema: keyof DatabaseWithoutInternals
}
  ? DatabaseWithoutInternals[PublicCompositeTypeNameOrOptions["schema"]]["CompositeTypes"][CompositeTypeName]
  : PublicCompositeTypeNameOrOptions extends keyof DefaultSchema["CompositeTypes"]
    ? DefaultSchema["CompositeTypes"][PublicCompositeTypeNameOrOptions]
    : never

export const Constants = {
  public: {
    Enums: {},
  },
} as const
