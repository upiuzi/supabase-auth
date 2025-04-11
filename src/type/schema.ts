
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
    // price: number;
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
    // shipment?: BatchShipment | null;
    batch_products?: BatchProduct[];
    orders?: Order[];
  }
  
  export interface OrderItem {
    id: string;
    order_id: string;
    product_id: string;
    product?: Product;
    qty: number;
    price: number;
  }
  
  export interface Order {
    total_amount: number;
    id: string;
    customer_id: string;
    customer?: Customer;
    batch_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    created_at: string;
    order_items?: OrderItem[];
    expedition?: string;
    description?: string;
  }
  
  // Mock data generator functions
  export const generateMockBatches = () => {
    return [
      {
        id: '1',
        batchId: 'BATCH-1122',
        status: 'Available',
        createdAt: '2023-10-01T08:00:00Z',
        products: [
          {
            name: 'Product A',
            capacity: 3000,
            remaining: 1500
          },
          {
            name: 'Product B',
            capacity: 5000,
            remaining: 3500
          }
        ]
      },
      {
        id: '2',
        batchId: 'BATCH-1123',
        status: 'Partially Sold',
        createdAt: '2023-10-05T10:30:00Z',
        products: [
          {
            name: 'Product C',
            capacity: 2000,
            remaining: 800
          },
          {
            name: 'Product D',
            capacity: 4000,
            remaining: 1200
          }
        ]
      },
      {
        id: '3',
        batchId: 'BATCH-1124',
        status: 'Sold Out',
        createdAt: '2023-09-28T14:15:00Z',
        products: [
          {
            name: 'Product A',
            capacity: 1500,
            remaining: 0
          },
          {
            name: 'Product E',
            capacity: 2500,
            remaining: 0
          }
        ]
      }
    ];
  };
  
  export const generateMockProducts = () => {
    return [
      {
        productId: 'PROD-001',
        name: 'Product A',
        description: 'High-quality product A'
      },
      {
        productId: 'PROD-002',
        name: 'Product B',
        description: 'Premium product B'
      },
      {
        productId: 'PROD-003',
        name: 'Product C',
        description: 'Standard product C'
      }
    ];
  };
  
  export const generateMockCustomers = () => {
    return [
      {
        customerId: 'CUST-001',
        name: 'John Doe',
        phoneNumber: '+62 812-3456-7890',
        address: 'Jl. Sudirman No. 123, Jakarta'
      },
      {
        customerId: 'CUST-002',
        name: 'Jane Smith',
        phoneNumber: '+62 813-9876-5432',
        address: 'Jl. Gatot Subroto No. 456, Jakarta'
      },
      {
        customerId: 'CUST-003',
        name: 'Robert Johnson',
        phoneNumber: '+62 857-1234-5678',
        address: 'Jl. MH Thamrin No. 789, Jakarta'
      }
    ];
  };
  
  export const generateMockOrders = () => {
    return [
      {
        orderId: 'ORD-001',
        customerName: 'John Doe',
        batchId: 'BATCH-1122',
        status: 'Confirmed',
        createdAt: '2023-10-10T09:45:00Z',
        totalAmount: 12500000
      },
      {
        orderId: 'ORD-002',
        customerName: 'Jane Smith',
        batchId: 'BATCH-1122',
        status: 'Pending',
        createdAt: '2023-10-12T13:20:00Z',
        totalAmount: 7800000
      },
      {
        orderId: 'ORD-003',
        customerName: 'Robert Johnson',
        batchId: 'BATCH-1123',
        status: 'Completed',
        createdAt: '2023-10-08T11:30:00Z',
        totalAmount: 15600000
      },
      {
        orderId: 'ORD-004',
        customerName: 'John Doe',
        batchId: 'BATCH-1123',
        status: 'Cancelled',
        createdAt: '2023-10-06T16:15:00Z',
        totalAmount: 5200000
      }
    ];
  };
