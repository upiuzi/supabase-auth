export interface Customer {
    id: string;
    name: string;
    phone?: string;
    address?: string;
  }
  
  export interface Batch {
    id: string;
    batch_id: string;
    batch_products?: BatchProduct[];
  }
  
  export interface BatchProduct {
    product_id: string;
    initial_qty: number; // Added to track initial quantity
    remaining_qty: number;
    product?: {
      name?: string;
      description?: string;
    };
  }
  
  export interface Order {
    id: string;
    customer_id: string;
    batch_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    expedition?: string;
    description?: string;
    created_at?: string;
    order_items?: OrderItem[];
  }
  
  export interface OrderItem {
    product_id: string;
    qty: number;
    price: number;
  }
  
  export interface FormData {
    customer_id: string;
    batch_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    order_items: OrderItem[];
    expedition?: string;
    description?: string;
  }