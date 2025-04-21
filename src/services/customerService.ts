import { getCustomers as getCustomersFromSupabase } from './supabaseService';
import type { Customer } from '../type/schema';

export const getCustomers = async (): Promise<Customer[]> => {
  return getCustomersFromSupabase();
};
