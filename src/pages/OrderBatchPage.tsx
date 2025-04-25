import { useState, useEffect } from 'react';
import { useParams } from 'react-router-dom';
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
  getBatches,
  getCompanies,
  getBankAccounts,
  getCustomers,
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';
import OrderTable from '../components/orders/OrderTable';
import OrderShipment from '../components/orders/Ordershipment';
import OrderFormModalBatch from '../components/orders/OrderFormModalBatch';
import OrderDetailModal from '../components/orders/OrderDetailModal';
import DeleteConfirmModal from '../components/orders/DeleteConfirmModal';
import QtyEditModal from '../components/orders/QtyEditModal';
import BulkEditModal from '../components/orders/BulkEditModal';
import ShipmentEditModal from '../components/orders/ShipmentEditModal';
import TotalQtySection from '../components/orders/TotalQtySection';
import BroadcastConfirmModal from '../components/orders/BroadcastConfirmModal';
import { sendOrderConfirmBroadcast } from '../services/waService';
import { Order, Batch, OrderItem, Company, BankAccount, Customer } from '../type/schema';
import { API_BASE_URL } from '../config';

// Extend jsPDF with autoTable plugin types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

// Perbarui tipe FormData untuk menyertakan company_id dan bank_account_id
interface FormData {
  customer_id: string;
  batch_id: string;
  company_id: string; // Tambahkan
  bank_account_id: string; // Tambahkan
  status: 'pending' | 'confirmed' | 'cancelled';
  order_items: OrderItem[];
  expedition: string;
  description: string;
}

const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]); // Tambahkan state untuk companies
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]); // Tambahkan state untuk bank accounts
  const [customers, setCustomers] = useState<Customer[]>([]); // Tambahkan state untuk customers
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showQtyEditModal, setShowQtyEditModal] = useState(false);
  const [showShipmentEditModal, setShowShipmentEditModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToView, setOrderToView] = useState<Order | null>(null);
  const [orderToEditShipment, setOrderToEditShipment] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkEditDate, setBulkEditDate] = useState('');
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState<number>(0);
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);
  const [activeTab, setActiveTab] = useState<'orders' | 'shipment'>('orders');
  const [showBroadcastConfirm, setShowBroadcastConfirm] = useState(false);
  const [broadcastLoading, setBroadcastLoading] = useState(false);
  const [waSessions, setWaSessions] = useState<{ session_id: string; status: string }[]>([]);
  const [broadcastBatchData, setBroadcastBatchData] = useState<{
    payment_status: string;
    total: string;
    invoice_no: string;
    name: string;
    phone: string;
    product: string;
    qty: number;
    customer_id: string;
    price?: number; // price opsional
  }[]>([]);
  const [showBroadcastDropdown, setShowBroadcastDropdown] = useState(false);

  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    batch_id: '',
    company_id: '', // Tambahkan
    bank_account_id: '', // Tambahkan
    status: 'pending',
    order_items: [],
    expedition: '',
    description: '',
  });

  const [batchLabel, setBatchLabel] = useState('');

  const { batchid } = useParams();

  useEffect(() => {
    fetchAllData();
  }, []);

  useEffect(() => {
    if (batchid && batches.length > 0) {
      // Filter orders by batchid from URL param
      const filtered = orders.filter(order => order.batch_id === batchid);
      setFilteredOrders(filtered);
      setCurrentPage(1);
    } else {
      applyFilters(orders);
    }
    // eslint-disable-next-line
  }, [batchid, orders, batches]);

  useEffect(() => {
    if (orders.length > 0 && !batchid) {
      applyFilters(orders);
    }
  }, [searchQuery, orders]);

  useEffect(() => {
    if (showBroadcastConfirm) fetchWaSessions();
  }, [showBroadcastConfirm]);

  useEffect(() => {
    setBatchLabel(batches.find((b) => b.id === formData.batch_id)?.batch_id || '');
  }, [formData.batch_id, batches]);

  useEffect(() => {
    fetch(`${API_BASE_URL}/whatsapp/sessions`)
      .then(res => res.json())
      .then(data => setWaSessions(data))
      .catch(() => setWaSessions([]));
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const ordersData = await getOrders();
      setOrders(ordersData);
      applyFilters(ordersData);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchBatches = async () => {
    try {
      const batchesData = await getBatches();
      setBatches(batchesData);
    } catch (error) {

      console.error('Error fetching batches:', error);
    }
  };

  const fetchAllData = async () => {
    setLoading(true);
    try {
      const [ordersData, batchesData, companiesData, bankAccountsData, customersData] = await Promise.all([
        getOrders(),
        getBatches(),
        getCompanies(),
        getBankAccounts(),
        getCustomers()
      ]);
      setOrders(ordersData);
      setBatches(batchesData);
      setCompanies(companiesData);
      setBankAccounts(bankAccountsData);
      setCustomers(customersData);
    } catch (error) {
      console.error('Error fetching data:', error);
    } finally {
      setLoading(false);
    }
  };

  const applyFilters = (orders: Order[]) => {
    let filtered = orders;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(
        (order) =>
          order.customer_id.toLowerCase().includes(query) ||
          batches.find((b) => b.id === order.batch_id)?.batch_id.toLowerCase().includes(query) ||
          order.status.toLowerCase().includes(query) ||
          order.expedition?.toLowerCase().includes(query) ||
          order.description?.toLowerCase().includes(query)
      );
    }
    setFilteredOrders(filtered);
    setCurrentPage(1);
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    applyFilters(orders);
  };

  const handleInputChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>
  ) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOrderItemChange = (
    index: number,
    field: keyof OrderItem,
    value: string | number
  ) => {
    const updatedItems = formData.order_items.map((item, i) => {
      if (i === index) {
        if (field === 'product_id') {
          return { ...item, [field]: value as string };
        }
        const numericValue = typeof value === 'string' ? parseInt(value) : value;
        const newValue = isNaN(numericValue) ? item[field] : numericValue;
        return { ...item, [field]: newValue };
      }
      return item;
    });
    setFormData({
      ...formData,
      order_items: updatedItems,
    });
  };

  const handleAddOrderItem = () => {
    const availableProducts = batches
      .find((b) => b.id === formData.batch_id)
      ?.batch_products?.filter((bp) => bp.remaining_qty > 0);
    if (availableProducts && availableProducts.length > 0) {
      setFormData({
        ...formData,
        order_items: [
          ...formData.order_items,
          {
            product_id: availableProducts[0].product_id,
            qty: 0,
            price: 0,
          },
        ],
      });
    }
  };

  const handleRemoveOrderItem = (index: number) => {
    const updatedItems = formData.order_items.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      order_items: updatedItems,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (!formData.customer_id) throw new Error('Please select a customer');
      if (!formData.batch_id) throw new Error('Please select a batch');
      if (!formData.company_id) throw new Error('Please select a company'); // Validasi
      if (!formData.bank_account_id) throw new Error('Please select a bank account'); // Validasi
      if (formData.order_items.length === 0)
        throw new Error('Please add at least one product to the order');

      const invalidItem = formData.order_items.find(
        (item) => isNaN(item.qty) || item.qty <= 0 || isNaN(item.price) || item.price <= 0
      );
      if (invalidItem)
        throw new Error('Please ensure all product quantities and prices are valid positive numbers');

      if (orderToEdit) {
        // Cek jika ada perubahan pada order_items atau qty
        // const prevItems = (orderToEdit.order_items || []).map(item => ({ product_id: item.product_id, qty: item.qty, price: item.price }));
        // const currItems = (formData.order_items || []).map(item => ({ product_id: item.product_id, qty: item.qty, price: item.price }));
        // let needStockValidation = false;
        // if (JSON.stringify(prevItems) !== JSON.stringify(currItems)) {
        //   needStockValidation = true;
        // }

        // if (needStockValidation) {
        //   const selectedBatch = batches.find((b) => b.id === formData.batch_id);
        //   if (!selectedBatch || !selectedBatch.batch_products)
        //     throw new Error('Selected batch is invalid or has no products');

        //   for (const item of formData.order_items) {
        //     const batchProduct = selectedBatch.batch_products.find(
        //       (bp) => bp.product_id === item.product_id
        //     );
        //     if (!batchProduct)
        //       throw new Error(`Product is not available in the selected batch`);
        //     if (batchProduct.remaining_qty < item.qty) {
        //       throw new Error(
        //         `Insufficient quantity for product. Available: ${batchProduct.remaining_qty}, Requested: ${item.qty}`
        //       );
        //     }
        //   }
        // }
      }

      if (orderToEdit) {
        await updateOrder(
          orderToEdit.id,
          {
            customer_id: formData.customer_id,
            batch_id: formData.batch_id,
            company_id: formData.company_id, // Tambahkan
            bank_account_id: formData.bank_account_id, // Tambahkan
            status: formData.status,
            expedition: formData.expedition,
            description: formData.description,
          },
          formData.order_items
        );
      } else {
        await createOrder(
          {
            customer_id: formData.customer_id,
            batch_id: formData.batch_id,
            company_id: formData.company_id, // Tambahkan
            bank_account_id: formData.bank_account_id, // Tambahkan
            status: formData.status,
            expedition: formData.expedition,
            description: formData.description,
          },
          formData.order_items
        );
      }
      await fetchOrders();
      await fetchBatches();
      resetForm();
      setBatchLabel(""); // Reset batchLabel
    } catch (error: any) {
      console.error('Error creating/updating order:', error);
      alert('Failed to create/update order: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (orderToDelete) {
      try {
        setLoading(true);
        await deleteOrder(orderToDelete);
        await fetchOrders();
        await fetchBatches();
        setOrderToDelete(null); // Gunakan setter setOrderToDelete
        setShowDeleteConfirm(false);
        if (filteredOrders.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error('Error deleting order:', error);
        alert('Failed to delete order');
      } finally {
        setLoading(false);
      }
    }
  };

  const handleSelectOrder = (orderId: string) => {
    setSelectedOrders((prev) =>
      prev.includes(orderId) ? prev.filter((id) => id !== orderId) : [...prev, orderId]
    );
  };

  const handleBulkEditSubmit = async () => {
    if (!bulkEditDate || selectedOrders.length === 0) {
      alert('Please select orders and a date');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedOrders.map(async (orderId) => {
          const order = await getOrderById(orderId);
          if (!order) return;

          return updateOrder(
            orderId,
            {
              ...order,
              created_at: bulkEditDate,
              company_id: order.company_id, // Pastikan tetap ada
              bank_account_id: order.bank_account_id, // Pastikan tetap ada
            },
            order.order_items?.map((item) => ({
              product_id: item.product_id,
              qty: item.qty,
              price: item.price,
            })) || []
          );
        })
      );
      await fetchOrders();
      setSelectedOrders([]);
      setShowBulkEditModal(false);
      setBulkEditDate('');
    } catch (error) {
      console.error('Error updating dates:', error);
      alert('Failed to update dates');
    } finally {
      setLoading(false);
    }
  };

  const handleQtyChange = async (orderId: string, productId: string, newQty: number) => {
    setLoading(true);
    try {
      if (isNaN(newQty) || newQty <= 0) {
        throw new Error('Quantity must be a positive number');
      }

      const order = await getOrderById(orderId);
      if (!order) throw new Error('Order not found');

      const updatedOrderItems =
        order.order_items?.map((item) =>
          item.product_id === productId ? { ...item, qty: newQty } : item
        ) || [];

      await updateOrder(
        orderId,
        {
          ...order,
          company_id: order.company_id, // Pastikan tetap ada
          bank_account_id: order.bank_account_id, // Pastikan tetap ada
        },
        updatedOrderItems
      );

      await fetchOrders();
      setShowQtyEditModal(false);
      setSelectedOrderId(null);
      setSelectedProductId(null);
      setNewQty(0);
      alert('Quantity updated successfully');
    } catch (error: any) {
      console.error('Error updating quantity:', error);
      alert('Failed to update quantity: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  const handleShipmentEdit = async (orderId: string, expedition: string, description: string) => {
    setLoading(true);
    try {
      const order = await getOrderById(orderId);
      if (!order) throw new Error('Order not found');

      await updateOrder(
        orderId,
        {
          ...order,
          expedition,
          description,
          company_id: order.company_id, // Pastikan tetap ada
          bank_account_id: order.bank_account_id, // Pastikan tetap ada
        },
        order.order_items?.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          price: item.price,
        })) || []
      );
      await fetchOrders();
      alert('Shipment details updated successfully');
    } catch (error) {
      console.error('Error updating shipment details:', error);
      alert('Failed to update shipment details');
    } finally {
      setLoading(false);
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setOrderToEdit(null);
    setOrderToView(null);
    setFormData({
      customer_id: '',
      batch_id: '',
      company_id: '', // Tambahkan
      bank_account_id: '', // Tambahkan
      status: 'pending',
      order_items: [],
      expedition: '',
      description: '',
    });
  };

  const fetchWaSessions = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/whatsapp/sessions`);
      if (!res.ok) return;
      // const data = await res.json();
    } catch (e) {}
  };

  const handleBroadcastBatch = async (arrivalDate: string, session: string) => {
    if (!broadcastBatchData.length) {
      alert('Data broadcast kosong!');
      return;
    }
    setBroadcastLoading(true);

    // 1. Group by phone
    const grouped: Record<string, { name: string; phone: string; products: { product: string; qty: number; price: number }[] }> = {};
    for (const d of broadcastBatchData) {
      if (!grouped[d.phone]) {
        grouped[d.phone] = { name: d.name, phone: d.phone, products: [] };
      }
      grouped[d.phone].products.push({ product: d.product, qty: d.qty, price: d.price ?? 0 });
    }
    const groupedList = Object.values(grouped);

    // setBroadcastStatusList(
    //   groupedList.map(d => ({ phone: d.phone, status: 'pending', message: '' }))
    // );
    for (const d of groupedList) {
      // setBroadcastStatusList(prev => prev.map(s => s.phone === d.phone ? { ...s, status: 'sending', message: '' } : s));
      // Build message listing all products in jerigen (1 jerigen = 19kg)
      const productLines = d.products.map(p => {
        const jerigen = Math.round(p.qty / 19);
        return `- ${p.product}:  ${jerigen} jerigen dengan harga ${p.price * 19} per jerigen nya`;
      }).join('\n');
      // Add price info: price x 9 = harga 1 jerigen (if price available)
      // If you want to show price per jerigen, you must include price in broadcastBatchData
      const message = `Hello ${d.name}, mau konfirmasi pesanan order:\n${productLines}\nKeterangan:\n1 jerigen = 20,9 liter/19kg\nAkan tiba pada tanggal ${arrivalDate}. Terima kasih.`;
      try {
        await sendOrderConfirmBroadcast({
          to: d.phone,
          message,
          session,
        });
        // setBroadcastStatusList(prev => prev.map(s => s.phone === d.phone ? { ...s, status: 'sent', message: 'Terkirim' } : s));
      } catch (e: any) {
        // setBroadcastStatusList(prev => prev.map(s => s.phone === d.phone ? { ...s, status: 'failed', message: e?.message || 'Gagal' } : s));
      }
    }
    setBroadcastLoading(false);
  };

  // const handleBroadcastBatchUnpaid = async (arrivalDate: string, session: string) => {
  //   if (!broadcastBatchData.length) {
  //     alert('Data broadcast kosong!');
  //     return;
  //   }
  //   setBroadcastLoading(true);
  //   for (const d of broadcastBatchData) {
  //     // Pesan penagihan
  //     const message = `Hallo ka ${d.name}, izin update untuk payment dengan invoice nomor ${d.invoice_no ?? '-'} dengan total tagihan ${d.total ?? '-'} kapan di proses ya?\n\nTerima kasih`;
  //     try {
  //       await sendOrderConfirmBroadcast({
  //         to: d.phone,
  //         message,
  //         session,
  //       });
  //     } catch (e) {}
  //   }
  //   setBroadcastLoading(false);
  // };

  console.log('DEBUG broadcastBatchData di render:', broadcastBatchData);

  // Add this function to fetch broadcast batch data for review
  const fetchBroadcastBatchData = async () => {
    try {
      setBroadcastLoading(true);
      // Use API_BASE_URL from config
      const res = await fetch(`${API_BASE_URL}/api/databroadcastbatch/${batchid}`);
      if (!res.ok) throw new Error('Failed to fetch broadcast batch data');
      const data = await res.json();
      setBroadcastBatchData(data);
      setShowBroadcastConfirm(true);
    } catch (e) {
      alert('Gagal mengambil data broadcast batch: ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBroadcastLoading(false);
    }
  };

  // Fetch unpaid broadcast batch data for review
  const fetchBroadcastBatchDataUnpaid = async () => {
    try {
      setBroadcastLoading(true);
      const res = await fetch(`${API_BASE_URL}/api/databroadcastbatch_unpaid/${batchid}`);
      if (!res.ok) throw new Error('Failed to fetch broadcast batch data (unpaid)');
      const data = await res.json();
      setBroadcastBatchData(data);
      setShowBroadcastConfirm(true);
    } catch (e) {
      alert('Gagal mengambil data broadcast batch (unpaid): ' + (e instanceof Error ? e.message : String(e)));
    } finally {
      setBroadcastLoading(false);
    }
  };

  // --- SUMMARY SECTION: TotalQtySection ---
  // Hapus deklarasi selectedBatch yang tidak terpakai
  // const selectedBatch = batches.find((b) => b.id === formData.batch_id);

  return (
    <div className="min-h-screen bg-white text-gray-900" style={{backgroundColor: '#f3f4f6'}}>
      <Navbar2 />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">
              Orders
              {batchid && batches.find(b => b.id === batchid) ? ` - ${batches.find(b => b.id === batchid)?.batch_name || batches.find(b => b.id === batchid)?.batch_id}` : ''}
            </h1>
            <p className="text-gray-600 mt-1">Manage customer orders and batch allocations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkEditModal(true)}
              disabled={selectedOrders.length === 0 || loading}
              className="flex items-center justify-center font-bold rounded shadow-sm text-base transition-all duration-150"
              style={{ minWidth: 160, minHeight: 48, background: '#FFC107', color: '#222', border: 'none' }}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Edit Dates
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="flex items-center justify-center font-bold rounded shadow-sm text-base transition-all duration-150"
              style={{ minWidth: 160, minHeight: 48, background: '#2196F3', color: 'white', border: 'none' }}
              disabled={loading}
            >
              <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Order
            </button>
            <div className="relative inline-block text-left" style={{ minWidth: 160, minHeight: 48 }}>
              <button
                type="button"
                className="flex items-center justify-center font-bold rounded shadow-sm text-base transition-all duration-150 w-full h-full"
                style={{ background: '#00E676', color: 'white', border: showBroadcastDropdown ? '2px solid #2196F3' : 'none' }}
                onClick={() => setShowBroadcastDropdown((prev) => !prev)}
                disabled={loading || broadcastLoading}
              >
                <svg className="w-5 h-5 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
                Broadcast
                <svg className="w-4 h-4 ml-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                </svg>
              </button>
              {showBroadcastDropdown && (
                <div className="origin-top-right absolute right-0 mt-2 w-56 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
                  <div className="py-1" role="menu" aria-orientation="vertical" aria-labelledby="options-menu">
                    <button
                      onClick={() => { setShowBroadcastDropdown(false); fetchBroadcastBatchData(); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      role="menuitem"
                    >
                      <span className="inline-block w-4 h-4 mr-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V4a2 2 0 10-4 0v1.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                        </svg>
                      </span>
                      Broadcast Pesanan
                    </button>
                    <button
                      onClick={() => { setShowBroadcastDropdown(false); fetchBroadcastBatchDataUnpaid(); }}
                      className="w-full text-left px-4 py-2 text-sm text-gray-700 hover:bg-gray-100 flex items-center gap-2"
                      role="menuitem"
                    >
                      <span className="inline-block w-4 h-4 mr-2">
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      </span>
                      Broadcast Tagihan
                    </button>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>

        <TotalQtySection
          filteredOrders={filteredOrders}
          batches={batches}
        />

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full px-4 py-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <svg
              className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth="2"
                d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
              />
            </svg>
          </div>
        </div>

        <div className="mb-6">
          <div className="flex border-b border-gray-200">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                console.log('Switching to Orders tab');
                setActiveTab('orders');
              }}
            >
              Orders
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'shipment'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-600 hover:text-gray-900'
              }`}
              onClick={() => {
                console.log('Switching to Shipment tab');
                setActiveTab('shipment');
              }}
            >
              Shipment
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : activeTab === 'shipment' ? (
          <div>
            <OrderShipment
              key={activeTab}
              orders={orders}
              filteredOrders={filteredOrders}
              customers={customers}
              batches={batches}
              companies={companies}
              bankAccounts={bankAccounts}
              loading={loading}
              selectedOrders={selectedOrders}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              tableType={activeTab}
              onSelectOrder={handleSelectOrder}
              onPageChange={(page: number) => setCurrentPage(page)}
            />
          </div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-gray-600">No orders available.</div>
        ) : (
          <div>
            <OrderTable
              key={activeTab}
              orders={orders}
              filteredOrders={filteredOrders}
              customers={customers}
              batches={batches}
              companies={companies}
              bankAccounts={bankAccounts}
              loading={loading}
              selectedOrders={selectedOrders}
              itemsPerPage={itemsPerPage}
              currentPage={currentPage}
              tableType={activeTab}
              onViewDetails={order => {
                setOrderToView(order);
                setShowDetailModal(true);
              }}
              onEditOrder={order => {
                setOrderToEdit(order);
                setFormData({
                  customer_id: order.customer_id,
                  batch_id: order.batch_id,
                  company_id: order.company_id,
                  bank_account_id: order.bank_account_id,
                  status: order.status,
                  order_items: order.order_items ? order.order_items.map(item => ({
                    product_id: item.product_id,
                    qty: item.qty,
                    price: item.price,
                  })) : [],
                  expedition: order.expedition || '',
                  description: order.description || '',
                });
                setShowEditModal(true);
              }}
              onDeleteOrder={orderId => {
                setOrderToDelete(orderId); // Gunakan setter setOrderToDelete
                setShowDeleteConfirm(true);
              }}
              onEditShipment={order => {
                setOrderToEditShipment(order);
                setShowShipmentEditModal(true);
              }}
              onPageChange={(page: number) => setCurrentPage(page)}
              onItemsPerPageChange={(items: number) => setItemsPerPage(items)}
              onSelectOrder={handleSelectOrder}
            />
          </div>
        )}

        <div className="mb-4 flex justify-between items-center">
          <div className="flex gap-4 items-center">
            <label className="text-gray-600">Show per page:</label>
            <select
              value={itemsPerPage}
              onChange={(e) => setItemsPerPage(parseInt(e.target.value))}
              className="bg-white border border-gray-300 rounded px-3 py-2 text-gray-900"
            >
              <option value={10}>10</option>
              <option value={50}>50</option>
              <option value={100}>100</option>
            </select>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setCurrentPage(currentPage - 1)}
              disabled={currentPage === 1}
              className="bg-gray-100 text-gray-900 px-4 py-2 rounded hover:bg-gray-200 disabled:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Prev
            </button>
            <button
              onClick={() => setCurrentPage(currentPage + 1)}
              disabled={currentPage >= Math.ceil(filteredOrders.length / itemsPerPage)}
              className="bg-gray-100 text-gray-900 px-4 py-2 rounded hover:bg-gray-200 disabled:bg-gray-100 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
              Next
            </button>
          </div>
        </div>

        <OrderFormModalBatch
          show={showModal || showEditModal}
          loading={loading}
          formData={formData}
          batches={batches}
          companies={companies}
          bankAccounts={bankAccounts}
          customers={customers}
          isEdit={showEditModal}
          onClose={resetForm}
          onSubmit={handleSubmit}
          onInputChange={handleInputChange}
          onOrderItemChange={handleOrderItemChange}
          onAddOrderItem={handleAddOrderItem}
          onRemoveOrderItem={handleRemoveOrderItem}
          batchLabel={batchLabel}
        />

        <DeleteConfirmModal
          show={showDeleteConfirm}
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        <OrderDetailModal
          show={showDetailModal}
          order={orderToView}
          batches={batches}
          companies={companies}
          bankAccounts={bankAccounts}
          loading={loading}
          onClose={resetForm}
          customers={customers}
        />

        <QtyEditModal
          show={showQtyEditModal}
          loading={loading}
          orderId={selectedOrderId}
          productId={selectedProductId}
          newQty={newQty}
          orders={orders}
          onClose={() => {
            setShowQtyEditModal(false);
            setSelectedOrderId(null);
            setSelectedProductId(null);
            setNewQty(0);
          }}
          onSave={handleQtyChange}
          onQtyChange={setNewQty}
          batches={batches}
        />

        <BulkEditModal
          show={showBulkEditModal}
          loading={loading}
          bulkEditDate={bulkEditDate}
          onClose={() => {
            setShowBulkEditModal(false);
            setBulkEditDate('');
          }}
          onSave={handleBulkEditSubmit}
          onDateChange={setBulkEditDate}
        />

        <ShipmentEditModal
          show={showShipmentEditModal}
          loading={loading}
          order={orderToEditShipment}
          onClose={() => {
            setShowShipmentEditModal(false);
            setOrderToEditShipment(null);
          }}
          onSave={handleShipmentEdit}
          companies={[]}
          bankAccounts={[]}
        />

        <BroadcastConfirmModal
          show={showBroadcastConfirm}
          onClose={() => setShowBroadcastConfirm(false)}
          onSend={handleBroadcastBatch}
          loading={broadcastLoading}
          sessions={waSessions}
        />
      </div>
    </div>
  );
};

export default OrderPage;