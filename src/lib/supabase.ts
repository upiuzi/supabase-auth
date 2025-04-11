
import { createClient } from '@supabase/supabase-js';

const supabaseUrl = 'https://yonkghtpwajrnevhbsqp.supabase.co';
const supabaseAnonKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmtnaHRwd2Fqcm5ldmhic3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDYxMzMsImV4cCI6MjA1NjkyMjEzM30.EhS8XiErvaXf7kyf-SULEhpyRMf070JkgzItggfkr4w';

export const supabase = createClient(supabaseUrl, supabaseAnonKey);

export type SupabaseUser = {
  id: string;
  email?: string;
};

export type AuthState = {
  user: SupabaseUser | null;
  session: any | null;
  loading: boolean;
  connectionError?: boolean;
};