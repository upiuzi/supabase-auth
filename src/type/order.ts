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
    initial_qty: number;
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
    company_id: string;
    bank_account_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    expedition?: string;
    description?: string;
    created_at?: string;
    order_items?: OrderItem[];
    total_amount: number;           // Mencerminkan kolom baru NUMERIC
    paid_amount: number;            // Mencerminkan kolom baru NUMERIC, default 0
    payment_status: 'unpaid' | 'partial' | 'paid'; // Mencerminkan kolom baru TEXT dengan CHECK constraint
}

export interface OrderItem {
    product_id: string;
    qty: number;
    price: number;
}

export interface PaymentLog {
    id: string;                     // UUID PRIMARY KEY
    order_id: string;              // UUID REFERENCES orders(id)
    amount: number;                // NUMERIC NOT NULL
    payment_date: string;          // TIMESTAMP WITH TIME ZONE, menggunakan string untuk kompatibilitas TypeScript
    payment_method?: string;       // TEXT, opsional
    notes?: string;                // TEXT, opsional
    created_at?: string;           // TIMESTAMP WITH TIME ZONE, default NOW()
    updated_at?: string;           // TIMESTAMP WITH TIME ZONE, default NOW()
}

export interface FormData {
    company_id?: string;
    bank_account_id?: string;
    customer_id: string;
    batch_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    order_items: OrderItem[];
    expedition?: string;
    description?: string;
}