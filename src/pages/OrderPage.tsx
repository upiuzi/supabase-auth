import { useState, useEffect } from 'react';
import { useSearchParams, useNavigate } from 'react-router-dom';
import {
  getOrders,
  createOrder,
  updateOrder,
  deleteOrder,
  getOrderById,
  getCustomers,
  getBatches,
  getCompanies,
  getBankAccounts,
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';
import OrderTable from '../components/orders/OrderTable';
import OrderFormModal from '../components/orders/OrderFormModal';
import DeleteConfirmModal from '../components/orders/DeleteConfirmModal';
import QtyEditModal from '../components/orders/QtyEditModal';
import BulkEditModal from '../components/orders/BulkEditModal';
import ShipmentEditModal from '../components/orders/ShipmentEditModal';
import { Order, Customer, Batch, OrderItem, Company, BankAccount } from '../type/schema';

// Extend jsPDF with autoTable plugin types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

interface FormData {
  customer_id: string;
  batch_id: string;
  company_id: string;
  bank_account_id: string;
  status: 'pending' | 'confirmed' | 'cancelled';
  order_items: OrderItem[];
  expedition: string;
  description: string;
}

const OrderPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [showQtyEditModal, setShowQtyEditModal] = useState(false);
  const [showShipmentEditModal, setShowShipmentEditModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
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
  const [searchType, setSearchType] = useState<'invoice' | 'name' | 'batch'>('invoice');
  const [sortByQty, setSortByQty] = useState<'desc' | 'asc'>('desc');

  const [formData, setFormData] = useState<FormData>({
    customer_id: '',
    batch_id: '',
    company_id: '',
    bank_account_id: '',
    status: 'pending',
    order_items: [],
    expedition: '',
    description: '',
  });

  const [searchParams] = useSearchParams();
  const batchIdFilter = searchParams.get('batch_id');
  const navigate = useNavigate();

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchBatches();
    fetchCompanies();
    fetchBankAccounts();
  }, []);

  useEffect(() => {
    if (orders.length > 0) {
      applyFilters(orders);
    }
  }, [batchIdFilter, orders, searchQuery]);

  useEffect(() => {
    let sorted = [...filteredOrders];
    sorted.sort((a, b) => {
      const qtyA = (a.order_items || []).reduce((sum, item) => sum + item.qty, 0);
      const qtyB = (b.order_items || []).reduce((sum, item) => sum + item.qty, 0);
      return sortByQty === 'desc' ? qtyB - qtyA : qtyA - qtyB;
    });
    setFilteredOrders(sorted);
    // eslint-disable-next-line
  }, [sortByQty]);

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const fetchBankAccounts = async () => {
    try {
      const data = await getBankAccounts();
      setBankAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    }
  };

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
      applyFilters(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCustomers = async () => {
    try {
      const data = await getCustomers();
      setCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    }
  };

  const fetchBatches = async () => {
    try {
      const data = await getBatches();
      setBatches(data);
    } catch (error) {
      console.error('Error fetching batches:', error);
    }
  };

  const applyFilters = (data: Order[]) => {
    let filtered = data;
    if (batchIdFilter) {
      filtered = filtered.filter((order) => order.batch_id === batchIdFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      if (searchType === 'invoice') {
        filtered = filtered.filter((order) => order.invoice_no?.toLowerCase().includes(query));
      } else if (searchType === 'name') {
        filtered = filtered.filter(
          (order) =>
            customers.find((c) => c.id === order.customer_id)?.name.toLowerCase().includes(query)
        );
      } else if (searchType === 'batch') {
        filtered = filtered.filter(
          (order) =>
            batches.find((b) => b.id === order.batch_id)?.batch_id.toLowerCase().includes(query)
        );
      }
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
      if (!formData.company_id) throw new Error('Please select a company');
      if (!formData.bank_account_id) throw new Error('Please select a bank account');
      if (formData.order_items.length === 0)
        throw new Error('Please add at least one product to the order');

      const invalidItem = formData.order_items.find(
        (item) => isNaN(item.qty) || item.qty <= 0 || isNaN(item.price) || item.price <= 0
      );
      if (invalidItem)
        throw new Error('Please ensure all product quantities and prices are valid positive numbers');

      const selectedBatch = batches.find((b) => b.id === formData.batch_id);
      if (!selectedBatch || !selectedBatch.batch_products)
        throw new Error('Selected batch is invalid or has no products');

      for (const item of formData.order_items) {
        const batchProduct = selectedBatch.batch_products.find(
          (bp) => bp.product_id === item.product_id
        );
        if (!batchProduct)
          throw new Error(`Product is not available in the selected batch`);
        if (batchProduct.remaining_qty < item.qty) {
          throw new Error(
            `Insufficient quantity for product. Available: ${batchProduct.remaining_qty}, Requested: ${item.qty}`
          );
        }
      }

      if (orderToEdit) {
        await updateOrder(
          orderToEdit.id,
          {
            customer_id: formData.customer_id,
            batch_id: formData.batch_id,
            company_id: formData.company_id,
            bank_account_id: formData.bank_account_id,
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
            company_id: formData.company_id,
            bank_account_id: formData.bank_account_id,
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
              company_id: order.company_id,
              bank_account_id: order.bank_account_id,
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
          company_id: order.company_id,
          bank_account_id: order.bank_account_id,
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
          company_id: order.company_id,
          bank_account_id: order.bank_account_id,
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
    setOrderToEdit(null);
    setFormData({
      customer_id: '',
      batch_id: '',
      company_id: '',
      bank_account_id: '',
      status: 'pending',
      order_items: [],
      expedition: '',
      description: '',
    });
  };

  return (
    <div className="bg-white text-gray-900" style={{backgroundColor: '#f3f4f6'}}>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-gray-400 mt-1">Manage customer orders and batch allocations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkEditModal(true)}
              disabled={selectedOrders.length === 0 || loading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-yellow-300"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"
                />
              </svg>
              Edit Dates
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 disabled:bg-blue-600"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Order
            </button>
          </div>
        </div>

        <div className="flex flex-col md:flex-row md:items-center gap-2 mb-4">
          <div className="flex-1 flex items-center relative">
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input
              type="text"
              placeholder={
                searchType === 'invoice' ? 'Cari Invoice...'
                  : searchType === 'name' ? 'Cari Nama Customer...'
                  : 'Cari Batch...'
              }
              className="border border-gray-300 text-gray-900 px-10 py-2 rounded w-full placeholder-gray-400 bg-white"
              value={searchQuery}
              onChange={handleSearch}
              style={{ minWidth: 220 }}
              autoComplete="off"
            />
          </div>
          <select
            className="border border-gray-300 text-gray-900 px-2 py-2 rounded"
            value={searchType}
            onChange={(e) => setSearchType(e.target.value as 'invoice' | 'name' | 'batch')}
            style={{ minWidth: 140 }}
          >
            <option value="invoice">Search by Invoice</option>
            <option value="name">Search by Name</option>
            <option value="batch">Search by Batch</option>
          </select>
          <select
            className="border border-gray-300 text-gray-900 px-2 py-2 rounded"
            value={sortByQty}
            onChange={(e) => setSortByQty(e.target.value as 'desc' | 'asc')}
            style={{ minWidth: 140 }}
          >
            <option value="desc">Sort by Qty Terbanyak</option>
            <option value="asc">Sort by Qty Terdikit</option>
          </select>
        </div>

        <div className="mb-6">
          <div className="flex border-b border-gray-300">
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'orders'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => {
                setActiveTab('orders');
              }}
            >
              Orders
            </button>
            <button
              className={`px-4 py-2 text-sm font-medium ${
                activeTab === 'shipment'
                  ? 'border-b-2 border-blue-500 text-blue-500'
                  : 'text-gray-400 hover:text-gray-200'
              }`}
              onClick={() => {
                setActiveTab('shipment');
              }}
            >
              Shipment
            </button>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-gray-400">No orders available.</div>
        ) : (
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
            onSelectOrder={handleSelectOrder}
            onPageChange={setCurrentPage}
            onItemsPerPageChange={(items) => {
              setItemsPerPage(items);
              setCurrentPage(1);
            }}
            onViewDetails={(order) => {
              navigate(`/orders/${order.id}`);
            }}
            onEditOrder={(order) => {
              setOrderToEdit(order);
              setFormData({
                customer_id: order.customer_id,
                batch_id: order.batch_id,
                company_id: order.company_id,
                bank_account_id: order.bank_account_id,
                status: order.status,
                expedition: order.expedition || '',
                description: order.description || '',
                order_items: order.order_items?.map((item) => ({
                  product_id: item.product_id,
                  qty: item.qty,
                  price: item.price,
                })) || [],
              });
              setShowEditModal(true);
            }}
            onDeleteOrder={(orderId) => {
              setOrderToDelete(orderId);
              setShowDeleteConfirm(true);
            }}
            onEditShipment={(order) => {
              setOrderToEditShipment(order);
              setShowShipmentEditModal(true);
            }}
          />
        )}

        <OrderFormModal
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
        />

        <DeleteConfirmModal
          show={showDeleteConfirm}
          loading={loading}
          onConfirm={handleDelete}
          onCancel={() => setShowDeleteConfirm(false)}
        />

        <QtyEditModal
          show={showQtyEditModal}
          loading={loading}
          orderId={selectedOrderId}
          productId={selectedProductId}
          newQty={newQty}
          orders={orders}
          batches={batches}
          onClose={() => {
            setShowQtyEditModal(false);
            setSelectedOrderId(null);
            setSelectedProductId(null);
            setNewQty(0);
          }}
          onSave={handleQtyChange}
          onQtyChange={setNewQty}
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
          companies={companies}
          bankAccounts={bankAccounts}
          onClose={() => {
            setShowShipmentEditModal(false);
            setOrderToEditShipment(null);
          }}
          onSave={handleShipmentEdit}
        />
      </div>
    </div>
  );
};

export default OrderPage;