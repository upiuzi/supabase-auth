import { supabase } from './supabaseService';

export async function updateOrderExpeditionDescription(orderId: string, changes: { expedition?: string; description?: string }) {
  const { error } = await supabase
    .from('orders')
    .update({
      expedition: changes.expedition,
      description: changes.description,
      updated_at: new Date().toISOString(),
    })
    .eq('id', orderId);
  if (error) throw error;
  return true;
}
