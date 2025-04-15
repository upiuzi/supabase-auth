import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getOrders, 
  createOrder, 
  updateOrder,
  deleteOrder,
  getOrderById,
  getCustomers, 
  getBatches, 
  Customer, 
  Batch, 
  Order, 
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';
import { jsPDF } from 'jspdf';
import 'jspdf-autotable';

// Extend jsPDF with autoTable plugin types
declare module 'jspdf' {
  interface jsPDF {
    autoTable: (options: any) => jsPDF;
    lastAutoTable?: {
      finalY: number;
    };
  }
}

type OrderItem = {
  product_id: string;
  qty: number;
  price: number;
};

const OrderPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [showDeleteConfirm, setShowDeleteConfirm] = useState(false);
  const [showEditModal, setShowEditModal] = useState(false);
  const [showDetailModal, setShowDetailModal] = useState(false);
  const [showBulkEditModal, setShowBulkEditModal] = useState(false);
  const [orderToDelete, setOrderToDelete] = useState<string | null>(null);
  const [orderToEdit, setOrderToEdit] = useState<Order | null>(null);
  const [orderToView, setOrderToView] = useState<Order | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedOrders, setSelectedOrders] = useState<string[]>([]);
  const [bulkEditDate, setBulkEditDate] = useState('');
  const [showQtyEditModal, setShowQtyEditModal] = useState(false);
  const [selectedOrderId, setSelectedOrderId] = useState<string | null>(null);
  const [selectedProductId, setSelectedProductId] = useState<string | null>(null);
  const [newQty, setNewQty] = useState<number>(0);

  const [formData, setFormData] = useState<{
    customer_id: string;
    batch_id: string;
    status: 'pending' | 'confirmed' | 'cancelled';
    order_items: OrderItem[];
    expedition?: string;
    description?: string;
  }>({
    customer_id: '',
    batch_id: '',
    status: 'pending',
    order_items: [],
    expedition: '',
    description: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const [searchParams] = useSearchParams();
  const batchIdFilter = searchParams.get('batch_id');

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchBatches();
  }, []);

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
      filtered = filtered.filter(order => order.batch_id === batchIdFilter);
    }
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      filtered = filtered.filter(order =>
        getCustomerName(order.customer_id).toLowerCase().includes(query) ||
        getBatchId(order.batch_id).toLowerCase().includes(query) ||
        order.status.toLowerCase().includes(query)
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

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleOrderItemChange = (index: number, field: keyof OrderItem, value: string | number) => {
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
    const availableProducts = getAvailableProducts();
    if (availableProducts.length > 0) {
      setFormData({
        ...formData,
        order_items: [...formData.order_items, { 
          product_id: availableProducts[0].product_id, 
          qty: 0, 
          price: 0 
        }],
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
      if (formData.order_items.length === 0) throw new Error('Please add at least one product to the order');

      const invalidItem = formData.order_items.find(
        item => isNaN(item.qty) || item.qty <= 0 || isNaN(item.price) || item.price <= 0
      );
      if (invalidItem) throw new Error('Please ensure all product quantities and prices are valid positive numbers');

      const selectedBatch = batches.find(b => b.id === formData.batch_id);
      if (!selectedBatch || !selectedBatch.batch_products) throw new Error('Selected batch is invalid or has no products');

      for (const item of formData.order_items) {
        const batchProduct = selectedBatch.batch_products.find(bp => bp.product_id === item.product_id);
        if (!batchProduct) throw new Error(`Product ${getProductName(item.product_id, formData.batch_id)} is not available in the selected batch`);
        if (batchProduct.remaining_qty < item.qty) {
          throw new Error(`Insufficient quantity for product ${getProductName(item.product_id, formData.batch_id)}. Available: ${batchProduct.remaining_qty}, Requested: ${item.qty}`);
        }
      }

      if (orderToEdit) {
        await updateOrder(
          orderToEdit.id,
          {
            customer_id: formData.customer_id,
            batch_id: formData.batch_id,
            status: formData.status,
            expedition: formData.expedition,
            description: formData.description
          },
          formData.order_items
        );
      } else {
        await createOrder(
          {
            customer_id: formData.customer_id,
            batch_id: formData.batch_id,
            status: formData.status,
            expedition: formData.expedition,
            description: formData.description
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
    setSelectedOrders(prev => 
      prev.includes(orderId) 
        ? prev.filter(id => id !== orderId)
        : [...prev, orderId]
    );
  };

  const handleSelectAll = () => {
    if (selectedOrders.length === currentItems.length) {
      setSelectedOrders([]);
    } else {
      setSelectedOrders(currentItems.map(order => order.id));
    }
  };

  const handleBulkEditSubmit = async () => {
    if (!bulkEditDate || selectedOrders.length === 0) {
      alert('Please select orders and a date');
      return;
    }

    setLoading(true);
    try {
      await Promise.all(
        selectedOrders.map(async orderId => {
          const order = await getOrderById(orderId);
          if (!order) return;
          
          return updateOrder(orderId, { 
            ...order,
            created_at: bulkEditDate 
          }, order.order_items?.map(item => ({
            product_id: item.product_id,
            qty: item.qty,
            price: item.price
          })) || []);
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

  const resetForm = () => {
    setShowModal(false);
    setShowEditModal(false);
    setShowDetailModal(false);
    setOrderToEdit(null);
    setOrderToView(null);
    setFormData({
      customer_id: '',
      batch_id: '',
      status: 'pending',
      order_items: [],
      expedition: '',
      description: ''
    });
  };

  const getAvailableProducts = () => {
    if (!formData.batch_id) return [];
    const selectedBatch = batches.find(b => b.id === formData.batch_id);
    if (!selectedBatch || !selectedBatch.batch_products) return [];
    return selectedBatch.batch_products;
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '-';
  };

  const getCustomerPhone = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.phone || '-';
  };

  const getCustomerAddress = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer?.address || '-';
  };

  const getBatchId = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch ? batch.batch_id : '-';
  };

  const getProductName = (productId: string, batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (batch && batch.batch_products) {
      const batchProduct = batch.batch_products.find(bp => bp.product_id === productId);
      if (batchProduct && batchProduct.product) {
        return batchProduct.product.name || 'Unknown Product';
      }
    }
    return 'Unknown Product';
  };

  const getProductDescription = (productId: string, batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    if (batch && batch.batch_products) {
      const batchProduct = batch.batch_products.find(bp => bp.product_id === productId);
      if (batchProduct && batchProduct.product) {
        return batchProduct.product.description || 'No description available';
      }
    }
    return 'No description available';
  };

  const getTotalAmount = (order: Order) => {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + (item.price * item.qty), 0);
  };

  const getTotalQtyPerProduct = (order: Order, productId: string) => {
    if (!order.order_items) return 0;
    const item = order.order_items.find(item => item.product_id === productId);
    return item ? item.qty : 0;
  };

  const getTotalQtyAllProducts = (order: Order) => {
    if (!order.order_items) return 0;
    return order.order_items.reduce((total, item) => total + item.qty, 0);
  };

  const getOverallTotalAmount = () => {
    return filteredOrders.reduce((total, order) => total + getTotalAmount(order), 0);
  };

  const getOverallTotalQtyAllProducts = () => {
    return filteredOrders.reduce((total, order) => total + getTotalQtyAllProducts(order), 0);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'confirmed': return 'bg-yellow-900 text-yellow-200';
      case 'pending': return 'bg-blue-900 text-blue-200';
      case 'cancelled': return 'bg-red-900 text-red-200';
      default: return 'bg-gray-700 text-gray-200';
    }
  };

  const handleQtyChange = async (
    orderId: string,
    productId: string,
    newQty: number
  ) => {
    setLoading(true);
    try {
      if (isNaN(newQty) || newQty <= 0) {
        throw new Error('Quantity must be a positive number');
      }
  
      const order = await getOrderById(orderId);
      if (!order) throw new Error('Order not found');
  
      const updatedOrderItems = order.order_items?.map((item) =>
        item.product_id === productId ? { ...item, qty: newQty } : item
      ) || [];
  
      await updateOrder(
        orderId,
        {
          ...order,
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

  const generatePDF = (order: Order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftColumnX = 10;
    const rightColumnX = 100;
    let yPos = 10;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${order.id}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    doc.text(`Date: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('SAT COCONUT', leftColumnX, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('WhatsApp: +6281122244446', leftColumnX, yPos);
    yPos += 6;
    doc.text('Email: jaya@satcoconut.com', leftColumnX, yPos);
    yPos += 6;
    doc.text('Address: Chubb Square, 9th Floor', leftColumnX, yPos);
    yPos += 6;
    doc.text('Jln. Jendral Sudirman Kav.60', leftColumnX, yPos);
    yPos += 6;
    doc.text('Jakarta, Indonesia', leftColumnX, yPos);

    let customerYPos = 34;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Customer Details', rightColumnX, customerYPos);
    customerYPos += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${getCustomerName(order.customer_id)}`, rightColumnX, customerYPos);
    customerYPos += 6;
    doc.text(`Phone Number: ${getCustomerPhone(order.customer_id)}`, rightColumnX, customerYPos);
    customerYPos += 6;

    const customerAddress = getCustomerAddress(order.customer_id);
    const maxWidth = 90;
    const addressLines = doc.splitTextToSize(`Address: ${customerAddress}`, maxWidth);
    doc.text(addressLines, rightColumnX, customerYPos);
    customerYPos += 6 * addressLines.length;
    doc.text(`Batch: ${getBatchId(order.batch_id)}`, rightColumnX, customerYPos);

    yPos = Math.max(yPos, customerYPos) + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Products', leftColumnX, yPos);
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(150, 150, 150);
    doc.line(leftColumnX, yPos, pageWidth - 10, yPos);
    yPos += 6;

    const headers = ['Product Name', 'Description', 'Qty', 'Price', 'Total'];
    const data = order.order_items?.map(item => [
      getProductName(item.product_id, order.batch_id),
      getProductDescription(item.product_id, order.batch_id).substring(0, 20) + '...',
      item.qty.toString(),
      `Rp ${item.price.toLocaleString('id-ID')}`,
      `Rp ${(item.price * item.qty).toLocaleString('id-ID')}`,
    ]) || [];

    doc.autoTable({
      startY: yPos,
      head: [headers],
      body: [
        ...data,
        ['', '', '', 'Grand Total', `Rp ${getTotalAmount(order).toLocaleString('id-ID')}`],
        ['', '', `${getTotalQtyAllProducts(order)}`, 'Total Qty', '']
      ],
      styles: { fontSize: 10, font: "helvetica" },
      headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      margin: { left: leftColumnX, right: 10 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Payment Methods', leftColumnX, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('Transfer to account:', leftColumnX, yPos);
    yPos += 6;
    doc.text('Bank BCA', leftColumnX, yPos);
    yPos += 6;
    doc.text('233-333-3368 : Alvin S Yohan', leftColumnX, yPos);

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`Invoice_${order.id}.pdf`);
  };

  const generatePDFPTSATI = (order: Order) => {
    const doc = new jsPDF();
    const pageWidth = doc.internal.pageSize.getWidth();
    const leftColumnX = 10;
    const rightColumnX = 100;
    let yPos = 10;

    doc.setFontSize(18);
    doc.setFont("helvetica", "bold");
    doc.text('INVOICE', pageWidth / 2, yPos, { align: 'center' });
    yPos += 8;
    doc.setFontSize(12);
    doc.setFont("helvetica", "normal");
    doc.text(`Invoice #: ${order.id}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 6;
    const currentDate = new Date().toLocaleDateString('id-ID', {
      day: '2-digit',
      month: '2-digit',
      year: 'numeric',
    });
    doc.text(`Date: ${currentDate}`, pageWidth / 2, yPos, { align: 'center' });
    yPos += 10;

    doc.setFontSize(14);
    doc.setFont("helvetica", "bold");
    doc.text('SAT COCONUT', leftColumnX, yPos);
    yPos += 8;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('WhatsApp: +6281122244446', leftColumnX, yPos);
    yPos += 6;
    doc.text('Email: jaya@satcoconut.com', leftColumnX, yPos);
    yPos += 6;
    doc.text('Address: Chubb Square, 9th Floor', leftColumnX, yPos);
    yPos += 6;
    doc.text('Jln. Jendral Sudirman Kav.60', leftColumnX, yPos);
    yPos += 6;
    doc.text('Jakarta, Indonesia', leftColumnX, yPos);

    let customerYPos = 34;
    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Customer Details', rightColumnX, customerYPos);
    customerYPos += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text(`Name: ${getCustomerName(order.customer_id)}`, rightColumnX, customerYPos);
    customerYPos += 6;
    doc.text(`Phone Number: ${getCustomerPhone(order.customer_id)}`, rightColumnX, customerYPos);
    customerYPos += 6;

    const customerAddress = getCustomerAddress(order.customer_id);
    const maxWidth = 90;
    const addressLines = doc.splitTextToSize(`Address: ${customerAddress}`, maxWidth);
    doc.text(addressLines, rightColumnX, customerYPos);
    customerYPos += 6 * addressLines.length;
    doc.text(`Batch: ${getBatchId(order.batch_id)}`, rightColumnX, customerYPos);

    yPos = Math.max(yPos, customerYPos) + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Products', leftColumnX, yPos);
    yPos += 2;
    doc.setLineWidth(0.5);
    doc.setDrawColor(150, 150, 150);
    doc.line(leftColumnX, yPos, pageWidth - 10, yPos);
    yPos += 6;

    const headers = ['Product Name', 'Description', 'Qty', 'Price', 'Total'];
    const data = order.order_items?.map(item => [
      getProductName(item.product_id, order.batch_id),
      getProductDescription(item.product_id, order.batch_id).substring(0, 20) + '...',
      item.qty.toString(),
      `Rp ${item.price.toLocaleString('id-ID')}`,
      `Rp ${(item.price * item.qty).toLocaleString('id-ID')}`,
    ]) || [];

    doc.autoTable({
      startY: yPos,
      head: [headers],
      body: [
        ...data,
        ['', '', '', 'Grand Total', `Rp ${getTotalAmount(order).toLocaleString('id-ID')}`],
        ['', '', `${getTotalQtyAllProducts(order)}`, 'Total Qty', '']
      ],
      styles: { fontSize: 10, font: "helvetica" },
      headStyles: { fillColor: [50, 50, 50], textColor: [255, 255, 255], fontStyle: 'bold' },
      bodyStyles: { fillColor: [240, 240, 240], textColor: [0, 0, 0] },
      alternateRowStyles: { fillColor: [255, 255, 255] },
      margin: { left: leftColumnX, right: 10 },
    });
    yPos = (doc as any).lastAutoTable.finalY + 10;

    doc.setFontSize(12);
    doc.setFont("helvetica", "bold");
    doc.text('Payment Methods', leftColumnX, yPos);
    yPos += 6;
    doc.setFontSize(10);
    doc.setFont("helvetica", "normal");
    doc.text('Transfer to account:', leftColumnX, yPos);
    yPos += 6;
    doc.text('Bank BCA', leftColumnX, yPos);
    yPos += 6;
    doc.text('2610 - 222 - 628 : PT Semesta Agro Tani', leftColumnX, yPos);

    const pageHeight = doc.internal.pageSize.getHeight();
    doc.setFontSize(8);
    doc.setTextColor(150, 150, 150);
    doc.text('Thank you for your business!', pageWidth / 2, pageHeight - 10, { align: 'center' });

    doc.save(`Invoice_${order.id}.pdf`);
  };

  const handleStatusChange = async (orderId: string, newStatus: 'pending' | 'confirmed' | 'cancelled') => {
    setLoading(true);
    try {
      const order = await getOrderById(orderId);
      if (!order) throw new Error('Order not found');
  
      await updateOrder(
        orderId,
        {
          ...order,
          status: newStatus,
        },
        order.order_items?.map((item) => ({
          product_id: item.product_id,
          qty: item.qty,
          price: item.price,
        })) || []
      );
      await fetchOrders();
      alert('Status updated successfully');
    } catch (error) {
      console.error('Error updating status:', error);
      alert('Failed to update status');
    } finally {
      setLoading(false);
    }
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredOrders.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getPaginationButtons = () => {
    const maxVisibleButtons = 5;
    const buttons: (number | string)[] = [];
    let startPage: number;
    let endPage: number;

    if (totalPages <= maxVisibleButtons) {
      startPage = 1;
      endPage = totalPages;
    } else {
      const halfVisible = Math.floor(maxVisibleButtons / 2);
      startPage = Math.max(1, currentPage - halfVisible);
      endPage = Math.min(totalPages, currentPage + halfVisible);

      if (endPage - startPage + 1 < maxVisibleButtons) {
        if (currentPage <= halfVisible + 1) {
          endPage = maxVisibleButtons;
        } else {
          startPage = totalPages - maxVisibleButtons + 1;
        }
      }
    }

    if (startPage > 1) {
      buttons.push(1);
      if (startPage > 2) buttons.push('...');
    }

    for (let i = startPage; i <= endPage; i++) {
      buttons.push(i);
    }

    if (endPage < totalPages) {
      if (endPage < totalPages - 1) buttons.push('...');
      buttons.push(totalPages);
    }

    return buttons;
  };

  useEffect(() => {
    if (orders.length > 0) {
      applyFilters(orders);
    }
  }, [batchIdFilter, orders]);

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Orders</h1>
            <p className="text-gray-400 mt-1">Manage customer orders and batch allocations</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => setShowBulkEditModal(true)}
              disabled={selectedOrders.length === 0 || loading}
              className="bg-yellow-500 text-white px-4 py-2 rounded hover:bg-yellow-600 disabled:bg-yellow-300 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              Edit Dates
            </button>
            <button
              onClick={() => setShowModal(true)}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Create Order
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : filteredOrders.length === 0 ? (
          <div className="text-center text-gray-400">No orders available.</div>
        ) : (
          <>
            <div className="mb-4 flex gap-4 items-center">
              <label className="text-gray-300">Show per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-700 border border-gray-600 rounded px-3 py-2"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>


            <div className="overflow-x-auto">
  <table className="min-w-full bg-gray-800 rounded-lg">
    <thead>
      <tr className="text-gray-400 text-left">
        <th className="py-3 px-4">
          <input
            type="checkbox"
            checked={selectedOrders.length === currentItems.length && currentItems.length > 0}
            onChange={handleSelectAll}
            disabled={loading}
            className="rounded w-4 h-4 py-4 text-blue-500 focus:ring-blue-500"
          />
        </th>
        <th className="py-3 px-4">Order ID</th>
        <th className="py-3 px-4">Customer</th>
        <th className="py-3 px-4">Batch</th>
        <th className="py-3 px-4">Product</th>
        <th className="py-3 px-4">Qty</th>
        <th className="py-3 px-4">Price</th>
        {/* <th className="py-3 px-4">Date</th> */}
        <th className="py-3 px-4">Amount</th>
        <th className="py-3 px-4">Status</th>
        <th className="py-3 px-4">Actions</th>
      </tr>
    </thead>
    <tbody>
      {currentItems.map((order, index) => (
        <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-700">
          <td className="py-4 px-4">
            <input
              type="checkbox"
              checked={selectedOrders.includes(order.id)}
              onChange={() => handleSelectOrder(order.id)}
              disabled={loading}
              className="rounded w-4 h-4 text-blue-500 focus:ring-blue-500"
            />
          </td>
          <td className="py-4 px-4 text-gray-300">{"order" + (index + 1)}</td>
          <td className="py-4 px-4 text-white">{getCustomerName(order.customer_id)}</td>
          <td className="py-4 px-4 text-white">{getBatchId(order.batch_id)}</td>
          <td className="py-4 px-4 text-white">
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-1">
                {order.order_items.map((item, idx) => (
                  <div key={idx}>{getProductName(item.product_id, order.batch_id)}</div>
                ))}
              </div>
            ) : (
              <span>-</span>
            )}
          </td>
          <td className="py-4 px-4 text-white">
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-1">
                {order.order_items.map((item, idx) => (
                  <div key={idx} className="flex items-center gap-2">
                    <button
                      onClick={() => {
                        setSelectedOrderId(order.id);
                        setSelectedProductId(item.product_id);
                        setNewQty(item.qty);
                        setShowQtyEditModal(true);
                      }}
                      className="text-white hover:text-gray-300 flex items-center gap-1"
                      disabled={loading}
                    >
                      {item.qty} kg
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth="2"
                          d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                        />
                      </svg>
                    </button>
                  </div>
                ))}
              </div>
            ) : (
              <span>-</span>
            )}
          </td>
          <td className="py-4 px-4 text-white">
            {order.order_items && order.order_items.length > 0 ? (
              <div className="space-y-1">
                {order.order_items.map((item, idx) => (
                  <div key={idx}>Rp {item.price.toLocaleString('id-ID')}</div>
                ))}
              </div>
            ) : (
              <span>-</span>
            )}
          </td>
          {/* <td className="py-4 px-4 text-white">
            {order.created_at
              ? new Date(order.created_at).toLocaleDateString('en-US', {
                  month: 'short',
                  day: 'numeric',
                  year: 'numeric',
                })
              : '-'}
          </td> */}
          <td className="py-4 px-4 text-white">
           {getTotalAmount(order).toLocaleString('id-ID')},00
          </td>
          <td className="py-4 px-4">
            <select
              value={order.status}
              onChange={(e) =>
                handleStatusChange(
                  order.id,
                  e.target.value as 'pending' | 'confirmed' | 'cancelled'
                )
              }
              className={`text-sm px-3 py-1 rounded-full ${getStatusColor(
                order.status
              )} focus:outline-none`}
              disabled={loading}
            >
              <option value="pending">Pending</option>
              <option value="confirmed">Confirmed</option>
              <option value="cancelled">Cancelled</option>
            </select>
          </td>
          <td className="py-4 px-4 flex gap-2">
            <button
              onClick={() => {
                setOrderToView(order);
                setShowDetailModal(true);
              }}
              className="text-gray-400 hover:text-green-400"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M15 12a3 3 0 11-6 0 3 3 0 016 0zm-3 8a8 8 0 100-16 8 8 0 000 16z"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                setOrderToEdit(order);
                setFormData({
                  customer_id: order.customer_id,
                  batch_id: order.batch_id,
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
              className="text-gray-400 hover:text-blue-400"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
                />
              </svg>
            </button>
            <button
              onClick={() => {
                setOrderToDelete(order.id);
                setShowDeleteConfirm(true);
              }}
              className="text-gray-400 hover:text-red-400"
              disabled={loading}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12M3 7h18"
                />
              </svg>
            </button>
          </td>
        </tr>
      ))}
      <tr className="border-t border-gray-700 font-bold">
        <td colSpan={8} className="py-4 px-4 text-right">Overall Total:</td>
        <td className="py-4 px-4 text-white">
          Rp {getOverallTotalAmount().toLocaleString('id-ID')},00
        </td>
        <td className="py-4 px-4 text-white">
          Qty: {getOverallTotalQtyAllProducts()}
        </td>
        <td></td>
      </tr>
    </tbody>
  </table>
</div>

            {filteredOrders.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-gray-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredOrders.length)} of {filteredOrders.length} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1 || loading}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                  >
                    First
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1 || loading}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                  >
                    Previous
                  </button>
                  {getPaginationButtons().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && paginate(page)}
                      disabled={typeof page !== 'number' || loading}
                      className={`px-4 py-2 rounded ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : typeof page === 'number'
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-700 text-gray-400 cursor-default'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages || loading}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages || loading}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {showQtyEditModal && selectedOrderId && selectedProductId && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
              <h2 className="text-xl font-bold mb-4">Edit Quantity</h2>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Product
                </label>
                <input
                  type="text"
                  value={getProductName(
                    selectedProductId,
                    orders.find((o) => o.id === selectedOrderId)?.batch_id || ''
                  )}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none"
                  disabled
                />
              </div>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-300">
                  Quantity
                </label>
                <input
                  type="number"
                  value={newQty}
                  onChange={(e) => setNewQty(parseInt(e.target.value))}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  min="1"
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => {
                    setShowQtyEditModal(false);
                    setSelectedOrderId(null);
                    setSelectedProductId(null);
                    setNewQty(0);
                  }}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleQtyChange(selectedOrderId, selectedProductId, newQty)}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
                  disabled={loading || isNaN(newQty) || newQty <= 0}
                >
                  {loading ? 'Saving...' : 'Save'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg text-white shadow-lg">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold text-white">Create New Order</h2>
                <button onClick={resetForm} className="text-gray-400 hover:text-gray-200" disabled={loading}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Customer</label>
                    <select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                    >
                      <option value="" className="bg-gray-700 text-gray-200">Select customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id} className="bg-gray-700 text-gray-200">
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-300">Batch</label>
                    <select
                      name="batch_id"
                      value={formData.batch_id}
                      onChange={handleInputChange}
                      className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                    >
                      <option value="" className="bg-gray-700 text-gray-200">Select batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id} className="bg-gray-700 text-gray-200">
                          {batch.batch_id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium.mb-1 text-gray-300">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  >
                    <option value="pending" className="bg-gray-700 text-gray-200">Pending</option>
                    <option value="confirmed" className="bg-gray-700 text-gray-200">Confirmed</option>
                    <option value="cancelled" className="bg-gray-700 text-gray-200">Cancelled</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Expedition</label>
                  <input
                    type="text"
                    name="expedition"
                    value={formData.expedition}
                    onChange={handleInputChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                    placeholder="Enter expedition"
                    disabled={loading}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                    rows={3}
                    placeholder="Enter description"
                    disabled={loading}
                  />
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-300">Order Items</label>
                    <button
                      type="button"
                      onClick={handleAddOrderItem}
                      disabled={!formData.batch_id || getAvailableProducts().length === 0 || loading}
                      className="text-blue-400 text-sm hover:text-blue-300 disabled:text-gray-600"
                    >
                      + Add Item
                    </button>
                  </div>
                  {formData.order_items.length === 0 ? (
                    <div className="border border-gray-600 rounded p-4 text-center text-gray-400">
                      Select a batch first to see available products.
                    </div>
                  ) : (
                    formData.order_items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 mb-3 p-3 border border-gray-600 rounded bg-gray-700">
                        <div className="flex-1">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleOrderItemChange(index, 'product_id', e.target.value)}
                            className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-600 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            disabled={loading}
                          >
                            {getAvailableProducts().map((product) => (
                              <option key={product.product_id} value={product.product_id} className="bg-gray-600 text-gray-200">
                                {getProductName(product.product_id, formData.batch_id)} ({product.remaining_qty} available)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleOrderItemChange(index, 'qty', e.target.value)}
                            className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-600 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
                            min="1"
                            disabled={loading}
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleOrderItemChange(index, 'price', e.target.value)}
                            className="w-full border border-gray-600 rounded px-2 py-1 bg-gray-600 text-gray-200 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 placeholder-gray-500"
                            min="0"
                            step="1000"
                            placeholder="Price"
                            disabled={loading}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItem(index)}
                          className="text-gray-400 hover:text-red-400"
                          disabled={loading}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12M3 7h18" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:bg-blue-400"
                  >
                    {loading ? 'Creating...' : 'Create Order'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDeleteConfirm && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
              <h2 className="text-xl font-bold mb-4">Confirm Delete</h2>
              <p className="mb-4">Are you sure you want to delete this order?</p>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowDeleteConfirm(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleDelete}
                  className="px-4 py-2 bg-red-500 text-white rounded hover:bg-red-600"
                  disabled={loading}
                >
                  {loading ? 'Deleting...' : 'Delete'}
                </button>
              </div>
            </div>
          </div>
        )}

        {showEditModal && orderToEdit && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-lg text-black">
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold">Edit Order</h2>
                <button onClick={resetForm} className="text-gray-500 hover:text-gray-700" disabled={loading}>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              <form onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4 mb-4">
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Customer</label>
                    <select
                      name="customer_id"
                      value={formData.customer_id}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                    >
                      <option value="">Select customer</option>
                      {customers.map((customer) => (
                        <option key={customer.id} value={customer.id}>
                          {customer.name}
                        </option>
                      ))}
                    </select>
                  </div>
                  <div>
                    <label className="block text-sm font-medium mb-1 text-gray-700">Batch</label>
                    <select
                      name="batch_id"
                      value={formData.batch_id}
                      onChange={handleInputChange}
                      className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                      required
                      disabled={loading}
                    >
                      <option value="">Select batch</option>
                      {batches.map((batch) => (
                        <option key={batch.id} value={batch.id}>
                          {batch.batch_id}
                        </option>
                      ))}
                    </select>
                  </div>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    disabled={loading}
                  >
                    <option value="pending">Pending</option>
                    <option value="confirmed">Confirmed</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Expedition</label>
                  <input
                    type="text"
                    name="expedition"
                    value={formData.expedition}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    disabled={loading}
                  />
                </div>

                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={3}
                    disabled={loading}
                  />
                </div>

                <div className="mb-4">
                  <div className="flex justify-between items-center mb-2">
                    <label className="block text-sm font-medium text-gray-700">Order Items</label>
                    <button
                      type="button"
                      onClick={handleAddOrderItem}
                      disabled={!formData.batch_id || getAvailableProducts().length === 0 || loading}
                      className="text-blue-500 text-sm hover:text-blue-600 disabled:text-gray-400"
                    >
                      + Add Item
                    </button>
                  </div>
                  {formData.order_items.length === 0 ? (
                    <div className="border border-gray-300 rounded p-4 text-center text-gray-500">
                      Select a batch first to see available products.
                    </div>
                  ) : (
                    formData.order_items.map((item, index) => (
                      <div key={index} className="flex items-center gap-3 mb-3 p-3 border border-gray-300 rounded">
                        <div className="flex-1">
                          <select
                            value={item.product_id}
                            onChange={(e) => handleOrderItemChange(index, 'product_id', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 text-sm"
                            disabled={loading}
                          >
                            {getAvailableProducts().map((product) => (
                              <option key={product.product_id} value={product.product_id}>
                                {getProductName(product.product_id, formData.batch_id)} ({product.remaining_qty} available)
                              </option>
                            ))}
                          </select>
                        </div>
                        <div className="w-20">
                          <input
                            type="number"
                            value={item.qty}
                            onChange={(e) => handleOrderItemChange(index, 'qty', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 text-sm"
                            min="1"
                            disabled={loading}
                          />
                        </div>
                        <div className="w-24">
                          <input
                            type="number"
                            value={item.price}
                            onChange={(e) => handleOrderItemChange(index, 'price', e.target.value)}
                            className="w-full border border-gray-300 rounded px-2 py-1 bg-white text-gray-700 text-sm"
                            min="0"
                            step="1000"
                            placeholder="Price"
                            disabled={loading}
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveOrderItem(index)}
                          className="text-gray-500 hover:text-red-500"
                          disabled={loading}
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12M3 7h18" />
                          </svg>
                        </button>
                      </div>
                    ))
                  )}
                </div>

                <div className="flex justify-end">
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
                  >
                    {loading ? 'Saving...' : 'Save Changes'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}

        {showDetailModal && orderToView && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-2xl text-white">
              <h2 className="text-xl font-bold mb-4">Order Details</h2>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <h3 className="font-bold text-lg">SAT COCONUT</h3>
                  <p>WhatsApp: +6281122244446</p>
                  <p>Email: jaya@satcoconut.com</p>
                  <p>
                    Address: Chubb Square, 9th Floor<br />
                    Jln. Jendral Sudirman Kav.60<br />
                    Jakarta, Indonesia
                  </p>
                </div>

                <div>
                  <h3 className="font-bold text-lg">Customer Details</h3>
                  <p><strong>Name:</strong> {getCustomerName(orderToView.customer_id)}</p>
                  <p><strong>Phone Number:</strong> {getCustomerPhone(orderToView.customer_id)}</p>
                  <p><strong>Address:</strong> {getCustomerAddress(orderToView.customer_id)}</p>
                  <p><strong>Batch:</strong> {getBatchId(orderToView.batch_id)}</p>
                </div>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">Products</h3>
                <table className="w-full bg-gray-700 rounded-lg">
                  <thead>
                    <tr className="text-gray-300 text-left">
                      <th className="py-2 px-4">Product Name</th>
                      <th className="py-2 px-4">Description</th>
                      <th className="py-2 px-4">Qty</th>
                      <th className="py-2 px-4">Price</th>
                      <th className="py-2 px-4">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    {orderToView.order_items?.map((item, index) => (
                      <tr key={index} className="border-t border-gray-600">
                        <td className="py-2 px-4">{getProductName(item.product_id, orderToView.batch_id)}</td>
                        <td className="py-2 px-4">{getProductDescription(item.product_id, orderToView.batch_id)}</td>
                        <td className="py-2 px-4">{item.qty}</td>
                        <td className="py-2 px-4">Rp {item.price.toLocaleString('id-ID')}</td>
                        <td className="py-2 px-4">Rp {(item.price * item.qty).toLocaleString('id-ID')}</td>
                      </tr>
                    ))}
                    <tr className="font-bold">
                      <td colSpan={2} className="py-2 px-4 text-right">Total Quantity:</td>
                      <td className="py-2 px-4">{getTotalQtyAllProducts(orderToView)}</td>
                      <td className="py-2 px-4 text-right">Grand Total:</td>
                      <td className="py-2 px-4">Rp {getTotalAmount(orderToView).toLocaleString('id-ID')}</td>
                    </tr>
                  </tbody>
                </table>
              </div>

              <div className="mt-6">
                <h3 className="font-bold text-lg mb-2">Payment Methods</h3>
                <p>Transfer to account:</p>
                <p><strong>Bank BCA</strong></p>
                <p>233-333-3368 : Alvin S Yohan</p>
              </div>

              <div className="flex justify-end mt-6 gap-2">
                <button
                  onClick={() => generatePDFPTSATI(orderToView)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600"
                  disabled={loading}
                >
                  Generate PDF PT SATI
                </button>
                <button
                  onClick={() => generatePDF(orderToView)}
                  className="px-4 py-2 bg-green-500 text-white rounded hover:bg-blue-600"
                  disabled={loading}
                >
                  Generate PDF
                </button>
                <button
                  onClick={() => setShowDetailModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
                  disabled={loading}
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        )}

        {showBulkEditModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
              <h2 className="text-xl font-bold mb-4">Bulk Edit Dates</h2>
              <p className="mb-4">Selected orders: {selectedOrders.length}</p>
              <div className="mb-4">
                <label className="block text-sm font-medium mb-1 text-gray-300">New Date</label>
                <input
                  type="date"
                  value={bulkEditDate}
                  onChange={(e) => setBulkEditDate(e.target.value)}
                  className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700 text-gray-200 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  disabled={loading}
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  onClick={() => setShowBulkEditModal(false)}
                  className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
                  disabled={loading}
                >
                  Cancel
                </button>
                <button
                  onClick={handleBulkEditSubmit}
                  className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
                  disabled={loading}
                >
                  {loading ? 'Updating...' : 'Update Dates'}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default OrderPage;