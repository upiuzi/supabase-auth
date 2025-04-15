export interface Customer {
  id: string;
  name: string;
  brand: string;
  city: string;
  phone: string;
  email?: string;
  address: string;
  created_at?: string;
}

export interface Pipeline {
  id: string;
  customer_id: string;
  product_id: string | null;
  status: 'Prospect' | 'Contacted' | 'Negotiation' | 'Won' | 'Lost';
  notes?: string;
  created_at?: string;
  updated_at?: string;
  customer?: Customer;
  product?: Product;
}

export interface Exhibition {
  id: string;
  name: string;
  website?: string;
  address?: string;
  date_event?: string;
  country?: string;
  description?: string;
  created_at?: string;
}

export interface Product {
  id: string;
  name: string;
  description?: string;
  created_at?: string;
}

export interface BatchProduct {
  id: string;
  batch_id: string;
  product_id: string;
  product?: Product;
  initial_qty: number;
  remaining_qty: number;
}

export interface BatchShipment {
  tracking_number?: string;
  carrier?: string;
  date?: string;
}

export interface Batch {
  id: string;
  batch_id: string;
  status: 'active' | 'sold_out' | 'cancelled';
  created_at: string;
  batch_products?: BatchProduct[];
  orders?: Order[];
}

export interface OrderItem {
  id?: string; // Made optional to align with insert operations
  order_id?: string; // Made optional for creation
  product_id: string;
  product?: Product;
  qty: number;
  price: number;
}

export interface Order {
  id: string;
  customer_id: string;
  customer?: Customer;
  batch_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  order_items?: OrderItem[];
  expedition?: string;
  description?: string;
  total_amount?: number; // Made optional since it may be calculated
}

// Mock data generator functions
export const generateMockBatches = (): Batch[] => {
  return [
    {
      id: '1',
      batch_id: 'BATCH-1122',
      status: 'active',
      created_at: '2023-10-01T08:00:00Z',
      batch_products: [
        {
          id: 'bp1',
          batch_id: '1',
          product_id: 'PROD-001',
          product: { id: 'PROD-001', name: 'Product A', description: 'High-quality product A' },
          initial_qty: 3000,
          remaining_qty: 1500,
        },
        {
          id: 'bp2',
          batch_id: '1',
          product_id: 'PROD-002',
          product: { id: 'PROD-002', name: 'Product B', description: 'Premium product B' },
          initial_qty: 5000,
          remaining_qty: 3500,
        },
      ],
    },
    {
      id: '2',
      batch_id: 'BATCH-1123',
      status: 'active',
      created_at: '2023-10-05T10:30:00Z',
      batch_products: [
        {
          id: 'bp3',
          batch_id: '2',
          product_id: 'PROD-003',
          product: { id: 'PROD-003', name: 'Product C', description: 'Standard product C' },
          initial_qty: 2000,
          remaining_qty: 800,
        },
        {
          id: 'bp4',
          batch_id: '2',
          product_id: 'PROD-004',
          product: { id: 'PROD-004', name: 'Product D', description: 'Product D description' },
          initial_qty: 4000,
          remaining_qty: 1200,
        },
      ],
    },
    {
      id: '3',
      batch_id: 'BATCH-1124',
      status: 'sold_out',
      created_at: '2023-09-28T14:15:00Z',
      batch_products: [
        {
          id: 'bp5',
          batch_id: '3',
          product_id: 'PROD-001',
          product: { id: 'PROD-001', name: 'Product A', description: 'High-quality product A' },
          initial_qty: 1500,
          remaining_qty: 0,
        },
        {
          id: 'bp6',
          batch_id: '3',
          product_id: 'PROD-005',
          product: { id: 'PROD-005', name: 'Product E', description: 'Product E description' },
          initial_qty: 2500,
          remaining_qty: 0,
        },
      ],
    },
  ];
};

export const generateMockProducts = (): Product[] => {
  return [
    {
      id: 'PROD-001',
      name: 'Product A',
      description: 'High-quality product A',
    },
    {
      id: 'PROD-002',
      name: 'Product B',
      description: 'Premium product B',
    },
    {
      id: 'PROD-003',
      name: 'Product C',
      description: 'Standard product C',
    },
    {
      id: 'PROD-004',
      name: 'Product D',
      description: 'Product D description',
    },
    {
      id: 'PROD-005',
      name: 'Product E',
      description: 'Product E description',
    },
  ];
};

export const generateMockCustomers = (): Customer[] => {
  return [
    {
      id: 'CUST-001',
      name: 'John Doe',
      brand: 'Brand A',
      city: 'Jakarta',
      phone: '+62 812-3456-7890',
      address: 'Jl. Sudirman No. 123, Jakarta',
      created_at: '2023-10-01T08:00:00Z',
    },
    {
      id: 'CUST-002',
      name: 'Jane Smith',
      brand: 'Brand B',
      city: 'Jakarta',
      phone: '+62 813-9876-5432',
      address: 'Jl. Gatot Subroto No. 456, Jakarta',
      created_at: '2023-10-01T08:00:00Z',
    },
    {
      id: 'CUST-003',
      name: 'Robert Johnson',
      brand: 'Brand C',
      city: 'Jakarta',
      phone: '+62 857-1234-5678',
      address: 'Jl. MH Thamrin No. 789, Jakarta',
      created_at: '2023-10-01T08:00:00Z',
    },
  ];
};

export const generateMockOrders = (): Order[] => {
  return [
    {
      id: 'ORD-001',
      customer_id: 'CUST-001',
      batch_id: '1',
      status: 'confirmed',
      created_at: '2023-10-10T09:45:00Z',
      total_amount: 12500000,
      order_items: [
        {
          id: 'oi1',
          order_id: 'ORD-001',
          product_id: 'PROD-001',
          qty: 100,
          price: 125000,
        },
      ],
    },
    {
      id: 'ORD-002',
      customer_id: 'CUST-002',
      batch_id: '1',
      status: 'pending',
      created_at: '2023-10-12T13:20:00Z',
      total_amount: 7800000,
      order_items: [
        {
          id: 'oi2',
          order_id: 'ORD-002',
          product_id: 'PROD-002',
          qty: 50,
          price: 156000,
        },
      ],
    },
    {
      id: 'ORD-003',
      customer_id: 'CUST-003',
      batch_id: '2',
      status: 'confirmed',
      created_at: '2023-10-08T11:30:00Z',
      total_amount: 15600000,
      order_items: [
        {
          id: 'oi3',
          order_id: 'ORD-003',
          product_id: 'PROD-003',
          qty: 200,
          price: 78000,
        },
      ],
    },
    {
      id: 'ORD-004',
      customer_id: 'CUST-001',
      batch_id: '2',
      status: 'cancelled',
      created_at: '2023-10-06T16:15:00Z',
      total_amount: 5200000,
      order_items: [
        {
          id: 'oi4',
          order_id: 'ORD-004',
          product_id: 'PROD-004',
          qty: 80,
          price: 65000,
        },
      ],
    },
  ];
};