import { ReactNode } from "react";

export interface Company {
  id: string;
  company_name: string;
  phone: string;
  address: string;
  email: string;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
  bank_accounts?: BankAccount[];
}

export interface BankAccount {
  id: string;
  company_id: string;
  account_name: string;
  account_number: string;
  bank_name: string;
  balance: number;
  is_default: boolean;
  created_at?: string;
  updated_at?: string;
}

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
  batch_name: ReactNode;
  id: string;
  batch_id: string;
  status: 'active' | 'sold_out' | 'cancelled';
  created_at: string;
  batch_products?: BatchProduct[];
  orders?: Order[];
}

export interface OrderItem {
  id?: string;
  order_id?: string;
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
  company_id: string;
  bank_account_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  created_at: string;
  invoice_no?: string;
  order_items?: OrderItem[];
  expedition?: string;
  description?: string;
  total_amount: number;           // Kolom baru untuk total jumlah pesanan
  paid_amount: number;            // Kolom baru untuk jumlah yang sudah dibayar, default 0
  payment_status: 'unpaid' | 'partial' | 'paid'; // Kolom baru untuk status pembayaran
  payment_logs?: PaymentLog[];    // Kolom baru untuk riwayat pembayaran, opsional
}

export interface PaymentLog {
  bank_account: string;
  id: string;                     // UUID untuk identifikasi unik
  order_id: string;              // Referensi ke order
  amount: number;                // Jumlah pembayaran
  payment_date: string;          // Tanggal pembayaran
  payment_method?: string;       // Metode pembayaran, opsional
  notes?: string;                // Catatan, opsional
  created_at?: string;           // Waktu pembuatan
  updated_at?: string;           // Waktu pembaruan
}