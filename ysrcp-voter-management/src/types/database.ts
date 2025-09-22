export type Json =
  | string
  | number
  | boolean
  | null
  | { [key: string]: Json | undefined }
  | Json[]

export interface Database {
  public: {
    Tables: {
      users: {
        Row: {
          id: string
          email: string
          full_name: string | null
          role: 'submitter' | 'approver' | 'admin'
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          email: string
          full_name?: string | null
          role?: 'submitter' | 'approver' | 'admin'
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          email?: string
          full_name?: string | null
          role?: 'submitter' | 'approver' | 'admin'
          created_at?: string
          updated_at?: string
        }
      }
      submission_batches: {
        Row: {
          id: string
          batch_name: string
          file_name: string | null
          total_records: number
          approved_records: number
          rejected_records: number
          pending_records: number
          status: 'draft' | 'submitted' | 'under_review' | 'completed' | 'cancelled'
          submitted_by: string | null
          created_at: string
          updated_at: string
        }
        Insert: {
          id?: string
          batch_name: string
          file_name?: string | null
          total_records?: number
          approved_records?: number
          rejected_records?: number
          pending_records?: number
          status?: 'draft' | 'submitted' | 'under_review' | 'completed' | 'cancelled'
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          batch_name?: string
          file_name?: string | null
          total_records?: number
          approved_records?: number
          rejected_records?: number
          pending_records?: number
          status?: 'draft' | 'submitted' | 'under_review' | 'completed' | 'cancelled'
          submitted_by?: string | null
          created_at?: string
          updated_at?: string
        }
      }
      voter_submissions: {
        Row: {
          id: string
          voter_id: string
          phone_number: string
          surname: string | null
          name: string
          father_husband_name: string | null
          gender: 'Male' | 'Female' | 'Other' | null
          age: number | null
          qualification: string | null
          caste: string | null
          sub_caste: string | null
          pc: string | null
          ac: string | null
          mandal_ward_division: string | null
          panchayat_name: string | null
          village_name: string | null
          booth: string | null
          batch_id: string | null
          status: 'draft' | 'pending' | 'approved' | 'rejected'
          submitted_by: string | null
          approved_by: string | null
          rejection_reason: string | null
          created_at: string
          updated_at: string
          submitted_at: string | null
          approved_at: string | null
        }
        Insert: {
          id?: string
          voter_id: string
          phone_number: string
          surname?: string | null
          name: string
          father_husband_name?: string | null
          gender?: 'Male' | 'Female' | 'Other' | null
          age?: number | null
          qualification?: string | null
          caste?: string | null
          sub_caste?: string | null
          pc?: string | null
          ac?: string | null
          mandal_ward_division?: string | null
          panchayat_name?: string | null
          village_name?: string | null
          booth?: string | null
          batch_id?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
          submitted_by?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
        }
        Update: {
          id?: string
          voter_id?: string
          phone_number?: string
          surname?: string | null
          name?: string
          father_husband_name?: string | null
          gender?: 'Male' | 'Female' | 'Other' | null
          age?: number | null
          qualification?: string | null
          caste?: string | null
          sub_caste?: string | null
          pc?: string | null
          ac?: string | null
          mandal_ward_division?: string | null
          panchayat_name?: string | null
          village_name?: string | null
          booth?: string | null
          batch_id?: string | null
          status?: 'draft' | 'pending' | 'approved' | 'rejected'
          submitted_by?: string | null
          approved_by?: string | null
          rejection_reason?: string | null
          created_at?: string
          updated_at?: string
          submitted_at?: string | null
          approved_at?: string | null
        }
      }
      approval_logs: {
        Row: {
          id: string
          submission_id: string | null
          action: 'submitted' | 'approved' | 'rejected' | 'cancelled'
          performed_by: string | null
          comments: string | null
          created_at: string
        }
        Insert: {
          id?: string
          submission_id?: string | null
          action: 'submitted' | 'approved' | 'rejected' | 'cancelled'
          performed_by?: string | null
          comments?: string | null
          created_at?: string
        }
        Update: {
          id?: string
          submission_id?: string | null
          action?: 'submitted' | 'approved' | 'rejected' | 'cancelled'
          performed_by?: string | null
          comments?: string | null
          created_at?: string
        }
      }
    }
    Views: {
      [_ in never]: never
    }
    Functions: {
      [_ in never]: never
    }
    Enums: {
      [_ in never]: never
    }
  }
}