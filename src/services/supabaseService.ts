import { createClient } from "@supabase/supabase-js";
import { Customer, Product, Batch, Order } from "../type/schema";



// Inisialisasi Supabase client
// const supabaseUrl = 'https://yonkghtpwajrnevhbsqp.supabase.co';
// const supabaseKey = 'eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9.eyJpc3MiOiJzdXBhYmFzZSIsInJlZiI6InlvbmtnaHRwd2Fqcm5ldmhic3FwIiwicm9sZSI6ImFub24iLCJpYXQiOjE3NDEzNDYxMzMsImV4cCI6MjA1NjkyMjEzM30.EhS8XiErvaXf7kyf-SULEhpyRMf070JkgzItggfkr4w';

import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";


const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any) => {
  if (error.message?.includes('fetch') || error.message?.includes('network') || error.code === 'ERR_NETWORK') {
    console.error('Supabase connection error:', error);
    return null;
  }
  throw error;
};

export const getCustomerPhoneByName = async (name: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('phone')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null; // no rows
      throw error;
    }
    return data?.phone ?? null;
  } catch (error) {
    console.error('Error fetching customer phone by name:', error);
    return null;
  }
};

// Customer functions
export const getCustomers = async (): Promise<Customer[]> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, brand')
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return [];
    }
    throw error;
  }
};

export const getCustomerById = async (id: string): Promise<Customer | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('*, brand')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return null;
    }
    throw error;
  }
};

export const createCustomer = async (customer: Omit<Customer, 'id'>): Promise<Customer> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .insert([{ 
        ...customer,
        brand: customer.brand,
        city: customer.city // Tambahkan ini
      }])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updateCustomer = async (id: string, customer: Partial<Customer>): Promise<Customer> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .update({
        ...customer,
        brand: customer.brand,
        city: customer.city // Tambahkan ini
      })
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const deleteCustomer = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('customers')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Product functions
export const getProducts = async (): Promise<Product[]> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('name');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return [];
    }
    throw error;
  }
};

export const getProductById = async (id: string): Promise<Product | null> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return null;
    }
    throw error;
  }
};

export const createProduct = async (product: Omit<Product, 'id'>): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .insert([product])
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updateProduct = async (id: string, product: Partial<Product>): Promise<Product> => {
  try {
    const { data, error } = await supabase
      .from('products')
      .update(product)
      .eq('id', id)
      .select()
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const deleteProduct = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Batch functions
export const getBatches = async (): Promise<Batch[]> => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select(`
        *,
        batch_products:batch_products(*, product:products(*)),
        orders:orders(*, 
          customer:customers(*),
          order_items:order_items(*, product:products(*))
        )
      `)
      .order('created_at', { ascending: false });
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return [];
    }
    throw error;
  }
};

export const getBatchById = async (id: string): Promise<Batch | null> => {
  try {
    const { data, error } = await supabase
      .from('batches')
      .select('*, batch_products(*, product:products(*))')
      .eq('id', id)
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return null;
    }
    throw error;
  }
};

export const createBatch = async (
  batch: Omit<Batch, 'id' | 'products'>,
  batchProducts: { product_id: string; initial_qty: number; remaining_qty: number }[]
): Promise<Batch> => {
  const { data: batchData, error: batchError } = await supabase
    .from('batches')
    .insert([{ 
      batch_id: batch.batch_id,
      created_at: new Date().toISOString(),
      status: batch.status,
    }])
    .select()
    .single();
    
  if (batchError) throw batchError;
  
  const batchProductsWithBatchId = batchProducts.map(bp => ({
    ...bp,
    batch_id: batchData.id
  }));
  
  const { error: productsError } = await supabase
    .from('batch_products')
    .insert(batchProductsWithBatchId);
    
  if (productsError) throw productsError;
  
  return getBatchById(batchData.id) as Promise<Batch>;
};

export const updateBatch = async (
  id: string,
  batch: Partial<Omit<Batch, 'id' | 'products'>>,
  batchProducts?: { id?: string; product_id: string; initial_qty: number; remaining_qty: number }[]
): Promise<Batch> => {
  try {
    // Update the batch details
    const { error: batchError } = await supabase
      .from('batches')
      .update({
        batch_id: batch.batch_id,
        status: batch.status,
      })
      .eq('id', id);

    if (batchError) throw batchError;

    if (batchProducts && batchProducts.length > 0) {
      // Fetch existing batch_products for this batch
      const { data: existingProducts, error: fetchError } = await supabase
        .from('batch_products')
        .select('*')
        .eq('batch_id', id);

      if (fetchError) throw fetchError;

      // const existingProductIds = existingProducts.map(bp => bp.product_id);
      const newProductIds = batchProducts.map(bp => bp.product_id);

      // Delete products that are no longer in the batch
      const productsToDelete = existingProducts.filter(
        ep => !newProductIds.includes(ep.product_id)
      );
      if (productsToDelete.length > 0) {
        const { error: deleteError } = await supabase
          .from('batch_products')
          .delete()
          .eq('batch_id', id)
          .in('product_id', productsToDelete.map(p => p.product_id));
        if (deleteError) throw deleteError;
      }

      // Prepare upsert data
      const upsertData = batchProducts.map(bp => ({
        batch_id: id,
        product_id: bp.product_id,
        initial_qty: bp.initial_qty,
        remaining_qty: bp.remaining_qty,
      }));

      // Upsert batch_products (updates existing, inserts new)
      const { error: upsertError } = await supabase
        .from('batch_products')
        .upsert(upsertData, {
          onConflict: 'batch_id,product_id', // Handle conflicts on these columns
        });

      if (upsertError) throw upsertError;
    }

    // Return the updated batch with all related data
    return getBatchById(id) as Promise<Batch>;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updateBatchStatus = async (id: string, status: string): Promise<void> => {
  const { error } = await supabase
    .from('batches')
    .update({ status })
    .eq('id', id)
    .select();
    
  if (error) {
    console.error('Supabase error in updateBatchStatus:', error);
    throw error;
  }
};

export const deleteBatch = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('batches')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Order functions
export const getOrders = async (): Promise<Order[]> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(*), order_items(*, product:products(*))')
    .order('created_at', { ascending: false });
    
  if (error) {
    console.error('Supabase error in getOrders:', error);
    throw error;
  }
  return data || [];
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  const { data, error } = await supabase
    .from('orders')
    .select('*, customers(*), order_items(*, product:products(*))')
    .eq('id', id)
    .single();
    
  if (error) {
    console.error('Supabase error in getOrderById:', error);
    throw error;
  }
  return data;
};

export const createOrder = async (
  order: { 
    customer_id: string; 
    batch_id: string; 
    status: string;
    expedition?: string;
    description?: string;
  },
  orderItems: { product_id: string; qty: number; price: number; }[]
): Promise<Order> => {
  const { 
    data: orderData, 
    error: orderError } = await supabase
    .from('orders')
    .insert([{ 
      customer_id: order.customer_id,
      batch_id: order.batch_id,
      status: order.status,
      expedition: order.expedition,
      description: order.description,
      created_at: new Date().toISOString() 
    }])
    .select()
    .single();
    
  if (orderError) {
    console.error('Supabase error in createOrder (order insert):', orderError);
    throw orderError;
  }
  
  const orderItemsWithOrderId = orderItems.map(item => ({
    ...item,
    order_id: orderData.id
  }));
  
  const { error: itemsError } = await supabase
    .from('order_items')
    .insert(orderItemsWithOrderId);
    
  if (itemsError) {
    console.error('Supabase error in createOrder (order items insert):', itemsError);
    throw itemsError;
  }
  
  for (const item of orderItems) {
    const { data: batchProduct, error: bpError } = await supabase
      .from('batch_products')
      .select('*')
      .eq('batch_id', order.batch_id)
      .eq('product_id', item.product_id)
      .single();
      
    if (bpError) {
      console.error('Supabase error in createOrder (batch product fetch):', bpError);
      throw bpError;
    }
    
    if (batchProduct) {
      const { error: updateError } = await supabase
        .from('batch_products')
        .update({ 
          remaining_qty: batchProduct.remaining_qty - item.qty 
        })
        .eq('id', batchProduct.id)
        .select();
        
      if (updateError) {
        console.error('Supabase error in createOrder (batch product update):', updateError);
        throw updateError;
      }
    }
  }
  
  return getOrderById(orderData.id) as Promise<Order>;
};

export const updateOrder = async (
  id: string,
  order: {
    customer_id: string;
    batch_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    expedition?: string;
    description?: string;
    created_at?: string;
  },
  orderItems: { product_id: string; qty: number; price: number }[]
): Promise<Order> => {
  try {
    // Fetch original order with items
    const { data: originalOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*), batch_id')
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase error in updateOrder (fetching original order):', fetchError);
      throw fetchError;
    }

    // Update order and items using RPC for atomicity
    const { error: updateError } = await supabase.rpc('update_order_with_items', {
      p_order_id: id,
      p_order_data: {
        customer_id: order.customer_id,
        batch_id: order.batch_id,
        status: order.status,
        expedition: order.expedition,
        description: order.description,
        created_at: order.created_at,
      },
      p_order_items: orderItems.map((item) => ({
        product_id: item.product_id,
        qty: item.qty,
        price: item.price,
      })),
    });

    if (updateError) {
      console.error('Supabase error in updateOrder (updating order):', updateError);
      throw updateError;
    }

    // Handle batch product quantity updates
    const originalItems: OrderItem[] = originalOrder.order_items || [];
    const batchId = order.batch_id || originalOrder.batch_id;

    // Process updated or new items
    for (const updatedItem of orderItems) {
      const originalItem = originalItems.find(
        (item) => item.product_id === updatedItem.product_id
      );
      let qtyDifference = 0;

      if (originalItem) {
        // Calculate difference: original_qty - updated_qty
        qtyDifference = originalItem.qty - updatedItem.qty;
      } else {
        // New item, treat as negative difference (reduce stock)
        qtyDifference = -updatedItem.qty;
      }

      if (qtyDifference !== 0) {
        // Fetch batch product
        const { data: batchProduct, error: bpError } = await supabase
          .from('batch_products')
          .select('remaining_qty')
          .eq('batch_id', batchId)
          .eq('product_id', updatedItem.product_id)
          .single();

        if (bpError || !batchProduct) {
          console.error('Supabase error in updateOrder (fetching batch product):', bpError);
          throw new Error(`Product ${updatedItem.product_id} not found in batch ${batchId}`);
        }

        // Update remaining_qty: add qtyDifference (positive = return stock, negative = reduce stock)
        const newRemainingQty = batchProduct.remaining_qty + qtyDifference;
        if (newRemainingQty < 0) {
          throw new Error(
            `Insufficient quantity for product ${updatedItem.product_id}. Available: ${batchProduct.remaining_qty}, Requested: ${updatedItem.qty}`
          );
        }

        const { error: updateQtyError } = await supabase
          .from('batch_products')
          .update({ remaining_qty: newRemainingQty })
          .eq('batch_id', batchId)
          .eq('product_id', updatedItem.product_id);

        if (updateQtyError) {
          console.error('Supabase error in updateOrder (updating batch product qty):', updateQtyError);
          throw updateQtyError;
        }
      }
    }

    // Process removed items
    for (const originalItem of originalItems) {
      if (!orderItems.find((item) => item.product_id === originalItem.product_id)) {
        // Item was removed, return its quantity to batch
        const { data: batchProduct, error: bpError } = await supabase
          .from('batch_products')
          .select('remaining_qty')
          .eq('batch_id', batchId)
          .eq('product_id', originalItem.product_id)
          .single();

        if (bpError || !batchProduct) {
          console.error('Supabase error in updateOrder (fetching batch product for removed item):', bpError);
          throw new Error(`Product ${originalItem.product_id} not found in batch ${batchId}`);
        }

        const newRemainingQty = batchProduct.remaining_qty + originalItem.qty;

        const { error: updateQtyError } = await supabase
          .from('batch_products')
          .update({ remaining_qty: newRemainingQty })
          .eq('batch_id', batchId)
          .eq('product_id', originalItem.product_id);

        if (updateQtyError) {
          console.error('Supabase error in updateOrder (updating batch product qty for removed item):', updateQtyError);
          throw updateQtyError;
        }
      }
    }

    // Fetch and return updated order
    return getOrderById(id) as Promise<Order>;
  } catch (error) {
    console.error('Supabase error in updateOrder:', error);
    handleSupabaseError(error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void> => {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id)
      .select();
      
    if (error) {
      console.error('Supabase error in updateOrderStatus:', error);
      throw error;
    }
};



export const deleteOrder = async (id: string): Promise<void> => {
  try {
    // 1. Ambil data order beserta order_items dan batch_id
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('batch_id, order_items (*)') // Pastikan relasi order_items sudah benar di schema
      .eq('id', id)
      .single();

    if (fetchError) {
      console.error('Supabase error in deleteOrder (fetching order):', fetchError);
      throw fetchError;
    }

    if (!orderData || !orderData.order_items || !orderData.batch_id) {
      throw new Error('Order not found or has no items/batch associated');
    }

    // 2. Kembalikan remaining_qty untuk setiap item di batch_products
    for (const item of orderData.order_items) {
      const { product_id, qty } = item;

      // Ambil data batch_product
      const { data: batchProduct, error: bpError } = await supabase
        .from('batch_products')
        .select('remaining_qty')
        .eq('batch_id', orderData.batch_id)
        .eq('product_id', product_id)
        .single();

      if (bpError || !batchProduct) {
        console.error('Supabase error in deleteOrder (fetching batch product):', bpError);
        throw bpError;
      }

      // Update remaining_qty
      const newRemainingQty = batchProduct.remaining_qty + qty;

      const { error: updateError } = await supabase
        .from('batch_products')
        .update({ remaining_qty: newRemainingQty })
        .eq('batch_id', orderData.batch_id)
        .eq('product_id', product_id);

      if (updateError) {
        console.error('Supabase error in deleteOrder (updating batch product):', updateError);
        throw updateError;
      }
    }

    // 3. Hapus order_items
    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (itemsError) {
      console.error('Supabase error in deleteOrder (deleting order items):', itemsError);
      throw itemsError;
    }

    // 4. Hapus order
    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (orderError) {
      console.error('Supabase error in deleteOrder (deleting order):', orderError);
      throw orderError;
    }

    console.log(`Order ${id} deleted successfully, quantities restored`);
  } catch (error) {
    console.error('Supabase error in deleteOrder:', error);
    throw error;
  }
};

export type { Customer };
export type { Product };
export type { Batch };
export type { Order };

// Sample functions
export const getSamples = async () => {
  const { data, error } = await supabase
    .from('samples')
    .select('*, sample_items(*, product:products(*)), customers(*)')
    .order('created_at', { ascending: false });
  if (error) throw error;
  return data || [];
};

export const getSampleById = async (id: string) => {
  const { data, error } = await supabase
    .from('samples')
    .select('*, sample_items(*, product:products(*)), customers(*)')
    .eq('id', id)
    .single();
  if (error) throw error;
  return data;
};

export const createSample = async (
  sample: {
    customer_id: string;
    batch_id: string;
    status: string;
    expedition?: string;
    description?: string;
  },
  items: { product_id: string; qty: number; price: number }[]
) => {
  const { data: sampleData, error: sampleError } = await supabase
    .from('samples')
    .insert([{ 
      customer_id: sample.customer_id,
      status: sample.status,
      expedition: sample.expedition,
      description: sample.description,
      created_at: new Date().toISOString()
    }])
    .select()
    .single();
  if (sampleError) throw sampleError;

  const itemsWithSampleId = items.map(item => ({
    ...item,
    sample_id: sampleData.id
  }));

  const { error: itemsError } = await supabase
    .from('sample_items')
    .insert(itemsWithSampleId);
  if (itemsError) throw itemsError;

  return getSampleById(sampleData.id);
};

export const updateSample = async (
  id: string,
  sample: {
    customer_id: string;
    batch_id: string;
    status: string;
    expedition?: string;
    description?: string;
  },
  items: { product_id: string; qty: number; price: number }[]
) => {
  const { error: sampleError } = await supabase
    .from('samples')
    .update({
      customer_id: sample.customer_id,
      status: sample.status,
      expedition: sample.expedition,
      description: sample.description,
      updated_at: new Date().toISOString()
    })
    .eq('id', id);
  if (sampleError) throw sampleError;

  const { error: deleteError } = await supabase
    .from('sample_items')
    .delete()
    .eq('sample_id', id);
  if (deleteError) throw deleteError;

  const itemsWithSampleId = items.map(item => ({
    ...item,
    sample_id: id
  }));

  const { error: itemsError } = await supabase
    .from('sample_items')
    .insert(itemsWithSampleId);
  if (itemsError) throw itemsError;

  return getSampleById(id);
};

export const deleteSample = async (id: string) => {
  const { error } = await supabase
    .from('samples')
    .delete()
    .eq('id', id);
  if (error) throw error;
};

// Pipeline functions
import type { OrderItem, Pipeline } from '../type/schema';

export const getPipelines = async (): Promise<Pipeline[]> => {
  try {
    const { data, error } = await supabase
      .from('pipeline')
      .select(`
        *,
        customer:customers(*),
        product:products(*)
      `)
      .order('created_at', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return [];
    }
    throw error;
  }
};

export const createPipeline = async (pipeline: Omit<Pipeline, 'id' | 'created_at' | 'updated_at' | 'customer' | 'product'>): Promise<Pipeline> => {
  try {
    const { data, error } = await supabase
      .from('pipeline')
      .insert([pipeline])
      .select(`
        *,
        customer:customers(*),
        product:products(*)
      `)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updatePipeline = async (id: string, pipeline: Partial<Omit<Pipeline, 'id' | 'created_at' | 'updated_at' | 'customer' | 'product'>>): Promise<Pipeline> => {
  try {
    const { data, error } = await supabase
      .from('pipeline')
      .update(pipeline)
      .eq('id', id)
      .select(`
        *,
        customer:customers(*),
        product:products(*)
      `)
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const deletePipeline = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('pipeline')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Exhibition functions
import type { Exhibition } from '../type/schema';

export const getExhibitions = async (): Promise<Exhibition[]> => {
  try {
    const { data, error } = await supabase
      .from('exhibitions')
      .select('*')
      .order('date_event', { ascending: false });
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return [];
    }
    throw error;
  }
};

export const createExhibition = async (exhibition: Omit<Exhibition, 'id' | 'created_at'>): Promise<Exhibition> => {
  try {
    const { data, error } = await supabase
      .from('exhibitions')
      .insert([exhibition])
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updateExhibition = async (id: string, exhibition: Partial<Omit<Exhibition, 'id' | 'created_at'>>): Promise<Exhibition> => {
  try {
    const { data, error } = await supabase
      .from('exhibitions')
      .update(exhibition)
      .eq('id', id)
      .select('*')
      .single();
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const deleteExhibition = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('exhibitions')
      .delete()
      .eq('id', id);
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};
