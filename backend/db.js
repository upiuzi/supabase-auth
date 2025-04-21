// db.js
// Script untuk test koneksi dan fetch semua data dari tabel 'customers' di Supabase

import { createClient } from '@supabase/supabase-js';

const SUPABASE_URL = 'https://yonkghtpwajrnevhbsqp.supabase.co';
const SUPABASE_ANON_KEY = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmtnaHRwd2Fqcm5ldmhic3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDYxMzMsImV4cCI6MjA1NjkyMjEzM30.EhS8XiErvaXf7kyf-SULEhpyRMf070JkgzItggfkr4w';

const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

async function fetchCustomers() {
  const { data, error } = await supabase
    .from('customers')
    .select('*');

  if (error) {
    console.error('Supabase error:', error);
    return;
  }
  console.log('CUSTOMERS DATA:', data);
}

fetchCustomers();
