export type UserRole = "client" | "employee";
export type JobStatus = "open" | "in_progress" | "completed" | "cancelled";
export type ProposalStatus = "pending" | "accepted" | "rejected";
export type ContractStatus = "active" | "completed" | "cancelled";

export interface User {
  id: string;
  email: string;
  full_name?: string;
  role: UserRole;
  avatar_url?: string;
  phone?: string;
  location?: string;
  bio?: string;
  skills?: string[];
  hourly_rate?: number;
  company_name?: string;
  website?: string;
  resume_url?: string;
  created_at: string;
  updated_at: string;
}

export interface Job {
  id: string;
  client_id: string;
  client_name: string;
  title: string;
  description: string;
  budget_min?: number;
  budget_max?: number;
  timeline?: string;
  required_skills?: string[];
  category?: string;
  status: JobStatus;
  created_at: string;
  updated_at: string;
  client?: User;
  files?: string[];
}

export interface Proposal {
  id: string;
  job_id: string;
  employee_id: string;
  cover_letter?: string;
  proposed_rate?: number;
  estimated_duration?: string;
  status: ProposalStatus;
  created_at: string;
  updated_at: string;
  job?: Job;
  employee?: User;
  client?: User;
}

export interface Contract {
  id: string;
  job_id: string;
  client_id: string;
  employee_id: string;
  proposal_id: string;
  agreed_rate: number;
  start_date: string;
  end_date?: string;
  status: ContractStatus;
  created_at: string;
  updated_at: string;
  job?: Job;
  client?: User;
  employee?: User;
}

export interface Message {
  id: string;
  contract_id?: string;
  proposal_id?: string;
  sender_id: string;
  content: string;
  file_url?: string;
  file_name?: string;
  created_at: string;
  sender?: User;
}

export interface FileUpload {
  id: string;
  user_id: string;
  job_id?: string;
  proposal_id?: string;
  contract_id?: string;
  file_name: string;
  file_url: string;
  file_type: string;
  file_size?: number;
  upload_type:
    | "job_attachment"
    | "proposal_attachment"
    | "resume"
    | "profile_picture"
    | "message_attachment";
  created_at: string;
  updated_at: string;
}
