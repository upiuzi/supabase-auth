import { createClient } from "@supabase/supabase-js";
import { Company, BankAccount, Customer, Product, Batch, Order, OrderItem, Pipeline, Exhibition, BatchProduct, BatchShipment, PaymentLog } from "../type/schema";
import { SUPABASE_ANON_KEY, SUPABASE_URL } from "../config";

export const supabase = createClient(SUPABASE_URL, SUPABASE_ANON_KEY);

// Helper function to handle Supabase errors
const handleSupabaseError = (error: any) => {
  if (error.message?.includes('fetch') || error.message?.includes('network') || error.code === 'ERR_NETWORK') {
    console.error('Supabase connection error:', error);
    return null;
  }
  throw error;
};

// Company functions
export const getCompanies = async (): Promise<Company[]> => {
  try {
    const { data, error } = await supabase
      .from('company')
      .select('*, bank_accounts(*)')
      .order('created_at');
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return [];
    }
    throw error;
  }
};

export const getDefaultCompany = async (): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('company')
      .select('*, bank_accounts(*)')
      .eq('is_default', true)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return null;
    }
    throw error;
  }
};

export const getCompanyById = async (id: string): Promise<Company | null> => {
  try {
    const { data, error } = await supabase
      .from('company')
      .select('*, bank_accounts(*)')
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

export const createCompany = async (company: Omit<Company, 'id' | 'created_at' | 'updated_at' | 'bank_accounts'>): Promise<Company> => {
  try {
    const { data, error } = await supabase
      .from('company')
      .insert([{
        company_name: company.company_name,
        phone: company.phone,
        address: company.address,
        email: company.email,
        is_default: company.is_default || false,
      }])
      .select('*, bank_accounts(*)')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updateCompany = async (id: string, company: Partial<Omit<Company, 'id' | 'created_at' | 'updated_at' | 'bank_accounts'>>): Promise<Company> => {
  try {
    const { data, error } = await supabase
      .from('company')
      .update({
        company_name: company.company_name,
        phone: company.phone,
        address: company.address,
        email: company.email,
        is_default: company.is_default,
      })
      .eq('id', id)
      .select('*, bank_accounts(*)')
      .single();
      
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const deleteCompany = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('company')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Bank Account functions
export const getBankAccounts = async (companyId?: string): Promise<BankAccount[]> => {
  try {
    let query = supabase
      .from('bank_accounts')
      .select('*')
      .order('created_at');
      
    if (companyId) {
      query = query.eq('company_id', companyId);
    }
      
    const { data, error } = await query;
      
    if (error) throw error;
    return data || [];
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return [];
    }
    throw error;
  }
};

export const getDefaultBankAccount = async (): Promise<BankAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .select('*')
      .eq('is_default', true)
      .single();
      
    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data;
  } catch (error) {
    if (handleSupabaseError(error) === null) {
      return null;
    }
    throw error;
  }
};

export const getBankAccountById = async (id: string): Promise<BankAccount | null> => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
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

export const createBankAccount = async (bankAccount: Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>): Promise<BankAccount> => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .insert([{
        company_id: bankAccount.company_id,
        account_name: bankAccount.account_name,
        account_number: bankAccount.account_number,
        bank_name: bankAccount.bank_name,
        balance: bankAccount.balance,
        is_default: bankAccount.is_default || false,
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

export const updateBankAccount = async (id: string, bankAccount: Partial<Omit<BankAccount, 'id' | 'created_at' | 'updated_at'>>): Promise<BankAccount> => {
  try {
    const { data, error } = await supabase
      .from('bank_accounts')
      .update({
        company_id: bankAccount.company_id,
        account_name: bankAccount.account_name,
        account_number: bankAccount.account_number,
        bank_name: bankAccount.bank_name,
        balance: bankAccount.balance,
        is_default: bankAccount.is_default,
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

export const deleteBankAccount = async (id: string): Promise<void> => {
  try {
    const { error } = await supabase
      .from('bank_accounts')
      .delete()
      .eq('id', id);
      
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Customer functions
export const getCustomerPhoneByName = async (name: string): Promise<string | null> => {
  try {
    const { data, error } = await supabase
      .from('customers')
      .select('phone')
      .ilike('name', `%${name}%`)
      .limit(1)
      .single();

    if (error) {
      if (error.code === 'PGRST116') return null;
      throw error;
    }
    return data?.phone ?? null;
  } catch (error) {
    console.error('Error fetching customer phone by name:', error);
    return null;
  }
};

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
        city: customer.city
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
        city: customer.city
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
  batch: Omit<Batch, 'id' | 'batch_products'>,
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
  batch: Partial<Omit<Batch, 'id' | 'batch_products'>>,
  batchProducts?: { id?: string; product_id: string; initial_qty: number; remaining_qty: number }[]
): Promise<Batch> => {
  try {
    const { error: batchError } = await supabase
      .from('batches')
      .update({
        batch_id: batch.batch_id,
        status: batch.status,
      })
      .eq('id', id);

    if (batchError) throw batchError;

    if (batchProducts && batchProducts.length > 0) {
      const { data: existingProducts, error: fetchError } = await supabase
        .from('batch_products')
        .select('*')
        .eq('batch_id', id);

      if (fetchError) throw fetchError;

      const newProductIds = batchProducts.map(bp => bp.product_id);

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

      const upsertData = batchProducts.map(bp => ({
        batch_id: id,
        product_id: bp.product_id,
        initial_qty: bp.initial_qty,
        remaining_qty: bp.remaining_qty,
      }));

      const { error: upsertError } = await supabase
        .from('batch_products')
        .upsert(upsertData, {
          onConflict: 'batch_id,product_id',
        });

      if (upsertError) throw upsertError;
    }

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
export const getOrders = async (batchId?: string): Promise<Order[]> => {
  try {
    let query = supabase
      .from('orders')
      .select(`
        *,
        customers(*),
        company(*),
        bank_accounts(*),
        order_items(*, product:products(*)),
        payment_logs(*)
      `)
      .order('created_at', { ascending: false });
    if (batchId) {
      query = query.eq('batch_id', batchId);
    }
    const { data, error } = await query;
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const getOrderById = async (id: string): Promise<Order | null> => {
  try {
    const { data, error } = await supabase
      .from('orders')
      .select(`
        *,
        customers(*),
        company(*),
        bank_accounts(*),
        order_items(*, product:products(*)),
        payment_logs(*)
      `)
      .eq('id', id)
      .single();
    
    if (error) throw error;
    return data;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export function generateInvoiceNo(dateString?: string): string {
  // dateString: ISO string, fallback to now
  let date = dateString ? new Date(dateString) : new Date();
  // Format: ddMMyyyy
  const pad = (n: number) => n.toString().padStart(2, '0');
  const day = pad(date.getDate());
  const month = pad(date.getMonth() + 1);
  const year = date.getFullYear();
  const datePart = `${day}${month}${year}`;
  // Random 4-5 digit int
  const rand = Math.floor(1000 + Math.random() * 90000);
  return `${datePart}${rand}`;
}

export const createOrder = async (
  order: {
    customer_id: string;
    batch_id: string;
    company_id: string;
    bank_account_id: string;
    status: string;
    expedition?: string;
    description?: string;
    created_at?: string; // allow override
  },
  orderItems: { product_id: string; qty: number; price: number; }[]
): Promise<Order> => {
  try {
    // Hitung total_amount dari order_items
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    // Generate invoice_no
    const nowIso = order.created_at || new Date().toISOString();
    const invoice_no = generateInvoiceNo(nowIso);

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .insert([{
        customer_id: order.customer_id,
        batch_id: order.batch_id,
        company_id: order.company_id,
        bank_account_id: order.bank_account_id,
        status: order.status,
        expedition: order.expedition,
        description: order.description,
        total_amount: totalAmount,
        paid_amount: 0,
        payment_status: 'unpaid',
        created_at: nowIso,
        invoice_no,
      }])
      .select()
      .single();
    if (orderError) throw orderError;

    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: orderData.id
    }));

    const { error: itemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);
    if (itemsError) throw itemsError;

    for (const item of orderItems) {
      const { data: batchProduct, error: bpError } = await supabase
        .from('batch_products')
        .select('*')
        .eq('batch_id', order.batch_id)
        .eq('product_id', item.product_id)
        .single();
      if (bpError) throw bpError;
      if (batchProduct) {
        const { error: updateError } = await supabase
          .from('batch_products')
          .update({
            remaining_qty: batchProduct.remaining_qty - item.qty
          })
          .eq('id', batchProduct.id);
        if (updateError) throw updateError;
      }
    }
    return getOrderById(orderData.id) as Promise<Order>;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updateOrder = async (
  id: string,
  order: {
    customer_id: string;
    batch_id: string;
    company_id: string;
    bank_account_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    expedition?: string;
    description?: string;
    created_at?: string;
  },
  orderItems: { product_id: string; qty: number; price: number }[]
): Promise<Order> => {
  try {
    const totalAmount = orderItems.reduce((sum, item) => sum + (item.qty * item.price), 0);
    
    const { data: originalOrder, error: fetchError } = await supabase
      .from('orders')
      .select('*, order_items(*), batch_id, paid_amount, payment_status')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        customer_id: order.customer_id,
        batch_id: order.batch_id,
        company_id: order.company_id,
        bank_account_id: order.bank_account_id,
        status: order.status,
        expedition: order.expedition,
        description: order.description,
        total_amount: totalAmount,
      })
      .eq('id', id);

    if (updateError) throw updateError;

    const { error: deleteItemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (deleteItemsError) throw deleteItemsError;

    const orderItemsWithOrderId = orderItems.map(item => ({
      ...item,
      order_id: id
    }));

    const { error: insertItemsError } = await supabase
      .from('order_items')
      .insert(orderItemsWithOrderId);

    if (insertItemsError) throw insertItemsError;

    const originalItems: OrderItem[] = originalOrder.order_items || [];
    const batchId = order.batch_id || originalOrder.batch_id;

    for (const updatedItem of orderItems) {
      const originalItem = originalItems.find(
        (item) => item.product_id === updatedItem.product_id
      );
      let qtyDifference = 0;

      if (originalItem) {
        qtyDifference = originalItem.qty - updatedItem.qty;
      } else {
        qtyDifference = -updatedItem.qty;
      }

      if (qtyDifference !== 0) {
        const { data: batchProduct, error: bpError } = await supabase
          .from('batch_products')
          .select('remaining_qty')
          .eq('batch_id', batchId)
          .eq('product_id', updatedItem.product_id)
          .single();

        if (bpError || !batchProduct) throw bpError;

        const newRemainingQty = batchProduct.remaining_qty + qtyDifference;
        if (newRemainingQty < 0) {
          throw new Error(`Insufficient quantity for product ${updatedItem.product_id}`);
        }

        const { error: updateQtyError } = await supabase
          .from('batch_products')
          .update({ remaining_qty: newRemainingQty })
          .eq('batch_id', batchId)
          .eq('product_id', updatedItem.product_id);

        if (updateQtyError) throw updateQtyError;
      }
    }

    for (const originalItem of originalItems) {
      if (!orderItems.find((item) => item.product_id === originalItem.product_id)) {
        const { data: batchProduct, error: bpError } = await supabase
          .from('batch_products')
          .select('remaining_qty')
          .eq('batch_id', batchId)
          .eq('product_id', originalItem.product_id)
          .single();

        if (bpError || !batchProduct) throw bpError;

        const newRemainingQty = batchProduct.remaining_qty + originalItem.qty;

        const { error: updateQtyError } = await supabase
          .from('batch_products')
          .update({ remaining_qty: newRemainingQty })
          .eq('batch_id', batchId)
          .eq('product_id', originalItem.product_id);

        if (updateQtyError) throw updateQtyError;
      }
    }

    return getOrderById(id) as Promise<Order>;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const updateOrderStatus = async (id: string, status: 'pending' | 'confirmed' | 'cancelled'): Promise<void> => {
  try {
    const { error } = await supabase
      .from('orders')
      .update({ status })
      .eq('id', id);
    
    if (error) throw error;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const deleteOrder = async (id: string): Promise<void> => {
  try {
    const { data: orderData, error: fetchError } = await supabase
      .from('orders')
      .select('batch_id, order_items (*)')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;

    if (!orderData || !orderData.order_items || !orderData.batch_id) {
      throw new Error('Order not found or has no items/batch associated');
    }

    for (const item of orderData.order_items) {
      const { product_id, qty } = item;

      const { data: batchProduct, error: bpError } = await supabase
        .from('batch_products')
        .select('remaining_qty')
        .eq('batch_id', orderData.batch_id)
        .eq('product_id', product_id)
        .single();

      if (bpError || !batchProduct) throw bpError;

      const newRemainingQty = batchProduct.remaining_qty + qty;

      const { error: updateError } = await supabase
        .from('batch_products')
        .update({ remaining_qty: newRemainingQty })
        .eq('batch_id', orderData.batch_id)
        .eq('product_id', product_id);

      if (updateError) throw updateError;
    }

    const { error: itemsError } = await supabase
      .from('order_items')
      .delete()
      .eq('order_id', id);

    if (itemsError) throw itemsError;

    const { error: orderError } = await supabase
      .from('orders')
      .delete()
      .eq('id', id);

    if (orderError) throw orderError;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Payment Log functions
export const createPaymentLog = async (
  orderId: string,
  amount: number,
  paymentDate: string,
  paymentMethod?: string,
  notes?: string
): Promise<void> => {
  try {
    const { error: logError } = await supabase
      .from('payment_logs')
      .insert([{
        order_id: orderId,
        amount,
        payment_date: paymentDate,
        payment_method: paymentMethod,
        notes,
      }]);
    if (logError) throw logError;

    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('paid_amount, total_amount')
      .eq('id', orderId)
      .single();
    if (orderError) throw orderError;

    const newPaidAmount = (orderData.paid_amount || 0) + amount;

    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    if (newPaidAmount > 0 && newPaidAmount < orderData.total_amount) {
      paymentStatus = 'partial';
    } else if (newPaidAmount >= orderData.total_amount) {
      paymentStatus = 'paid';
    }

    const { error: updateError } = await supabase
      .from('orders')
      .update({
        paid_amount: newPaidAmount,
        payment_status: paymentStatus,
      })
      .eq('id', orderId);
    if (updateError) throw updateError;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const getPaymentLogsByOrderId = async (orderId: string): Promise<PaymentLog[]> => {
  try {
    const { data, error } = await supabase
      .from('payment_logs')
      .select('*')
      .eq('order_id', orderId)
      .order('payment_date', { ascending: true });
    if (error) throw error;
    return data || [];
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

export const deletePaymentLog = async (id: string): Promise<void> => {
  try {
    // Fetch the payment log to get its amount and order_id
    const { data: paymentLog, error: fetchError } = await supabase
      .from('payment_logs')
      .select('amount, order_id')
      .eq('id', id)
      .single();

    if (fetchError) throw fetchError;
    if (!paymentLog) throw new Error('Payment log not found');

    const { order_id, amount } = paymentLog;

    // Delete the payment log
    const { error: deleteError } = await supabase
      .from('payment_logs')
      .delete()
      .eq('id', id);

    if (deleteError) throw deleteError;

    // Fetch the order to update paid_amount and payment_status
    const { data: orderData, error: orderError } = await supabase
      .from('orders')
      .select('paid_amount, total_amount')
      .eq('id', order_id)
      .single();

    if (orderError) throw orderError;
    if (!orderData) throw new Error('Order not found');

    // Calculate new paid_amount
    const newPaidAmount = Math.max(0, (orderData.paid_amount || 0) - amount);

    // Determine new payment_status
    let paymentStatus: 'unpaid' | 'partial' | 'paid' = 'unpaid';
    if (newPaidAmount > 0 && newPaidAmount < orderData.total_amount) {
      paymentStatus = 'partial';
    } else if (newPaidAmount >= orderData.total_amount) {
      paymentStatus = 'paid';
    }

    // Update the order
    const { error: updateError } = await supabase
      .from('orders')
      .update({
        paid_amount: newPaidAmount,
        payment_status: paymentStatus,
      })
      .eq('id', order_id);

    if (updateError) throw updateError;
  } catch (error) {
    handleSupabaseError(error);
    throw error;
  }
};

// Sample, Pipeline, Exhibition functions
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

// Export types
export type { Company, BankAccount, Customer, Product, Batch, Order, OrderItem, Pipeline, Exhibition, BatchProduct, BatchShipment, PaymentLog };