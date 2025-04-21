import { useState, useEffect } from 'react';
import { 
  createPaymentLog, 
  deletePaymentLog, 
  getPaymentLogsByOrderId, 
  getOrders, 
  PaymentLog, 
  Order 
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';
import { ToastContainer, toast } from 'react-toastify';
import 'react-toastify/dist/ReactToastify.css';

const PaymentLogPage = () => {
  const [paymentLogs, setPaymentLogs] = useState<PaymentLog[]>([]);
  const [filteredPaymentLogs, setFilteredPaymentLogs] = useState<PaymentLog[]>([]);
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedPaymentLog, setSelectedPaymentLog] = useState<PaymentLog | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    order_id: '',
    amount: 0,
    payment_date: '',
    payment_method: '',
    notes: ''
  });

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchOrders();
  }, []);

  const fetchOrders = async () => {
    setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
      // Ambil semua payment logs dari semua order
      const allPaymentLogs = await Promise.all(
        data.map(async (order) => {
          const logs = await getPaymentLogsByOrderId(order.id);
          return logs;
        })
      );
      const flattenedLogs = allPaymentLogs.flat();
      setPaymentLogs(flattenedLogs);
      setFilteredPaymentLogs(flattenedLogs);
    } catch (error) {
      console.error('Error fetching payment logs:', error);
      toast.error('Failed to fetch payment logs.');
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = paymentLogs.filter(log =>
      log.order_id.toLowerCase().includes(query) ||
      log.payment_method?.toLowerCase().includes(query) ||
      log.notes?.toLowerCase().includes(query) ||
      log.amount.toString().includes(query)
    );
    setFilteredPaymentLogs(filtered);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData({
      ...formData,
      [name]: name === 'amount' ? parseFloat(value) : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      if (selectedPaymentLog) {
        // TODO: Implement update logic (requires updatePaymentLog in supabaseService.ts)
        // await updatePaymentLog(selectedPaymentLog.id, {
        //   amount: formData.amount,
        //   payment_date: formData.payment_date,
        //   payment_method: formData.payment_method || undefined,
        //   notes: formData.notes || undefined,
        // });
        toast.info('Update functionality not implemented yet.');
      } else {
        await createPaymentLog(
          formData.order_id,
          formData.amount,
          formData.payment_date,
          formData.payment_method || undefined,
          formData.notes || undefined
        );
        toast.success('Payment log created successfully!');
      }
      await fetchOrders();
      resetForm();
    } catch (error) {
      console.error('Error saving payment log:', error);
      toast.error('Failed to save payment log. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (log: PaymentLog) => {
    setSelectedPaymentLog(log);
    setFormData({
      order_id: log.order_id,
      amount: log.amount,
      payment_date: log.payment_date,
      payment_method: log.payment_method || '',
      notes: log.notes || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this payment log?')) {
      setLoading(true);
      try {
        await deletePaymentLog(id);
        await fetchOrders();
        if (filteredPaymentLogs.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
        toast.success('Payment log deleted successfully!');
      } catch (error) {
        console.error('Error deleting payment log:', error);
        toast.error('Failed to delete payment log. Please try again.');
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedPaymentLog(null);
    setFormData({
      order_id: '',
      amount: 0,
      payment_date: '',
      payment_method: '',
      notes: ''
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredPaymentLogs.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredPaymentLogs.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  // Function to generate pagination buttons with ellipsis
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

  return (
    <div style={{backgroundColor: '#f3f4f6'}}>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen bg-gray-100 text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Payment Log</h1>
          <button
            onClick={() => {
              setShowModal(true);
              setSelectedPaymentLog(null);
              setFormData({
                order_id: '',
                amount: 0,
                payment_date: '',
                payment_method: '',
                notes: ''
              });
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow"
          >
            + Add Payment
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search payment logs..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-3 pl-10 bg-gray-200 border border-gray-300 rounded-lg text-gray-900 placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : (
          <>
            <div className="mb-4 flex gap-4 items-center">
              <label className="text-gray-600">Show per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-200 border border-gray-300 rounded px-3 py-2 text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-200 rounded-lg">
                <thead>
                  <tr className="text-gray-600 text-left">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Order ID</th>
                    <th className="py-3 px-4">Amount</th>
                    <th className="py-3 px-4">Payment Date</th>
                    <th className="py-3 px-4">Payment Method</th>
                    <th className="py-3 px-4">Notes</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((log, index) => (
                    <tr key={log.id} className="border-t border-gray-300 hover:bg-gray-200">
                      <td className="py-3 px-4 text-gray-600">{"pl0" + (indexOfFirstItem + index + 1)}</td>
                      <td className="py-3 px-4 text-gray-900">{log.order_id}</td>
                      <td className="py-3 px-4 text-gray-900">{log.amount.toLocaleString()}</td>
                      <td className="py-3 px-4 text-gray-900">{new Date(log.payment_date).toLocaleDateString()}</td>
                      <td className="py-3 px-4 text-gray-900">{log.payment_method || '-'}</td>
                      <td className="py-3 px-4 text-gray-900">{log.notes || '-'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEdit(log)}
                          className="text-gray-600 hover:text-blue-600 mr-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(log.id)}
                          disabled={loading}
                          className="text-gray-600 hover:text-red-600 disabled:text-gray-400"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5-4h4M9 7v12m6-12v12M3 7h18" />
                          </svg>
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination Controls */}
            {filteredPaymentLogs.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredPaymentLogs.length)} of {filteredPaymentLogs.length} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 text-gray-900"
                  >
                    First
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 text-gray-900"
                  >
                    Previous
                  </button>
                  {getPaginationButtons().map((page, index) => (
                    <button
                      key={index}
                      onClick={() => typeof page === 'number' && paginate(page)}
                      disabled={typeof page !== 'number'}
                      className={`px-4 py-2 rounded ${
                        page === currentPage
                          ? 'bg-blue-500 text-white'
                          : typeof page === 'number'
                          ? 'bg-gray-200 text-gray-900 hover:bg-gray-300'
                          : 'bg-gray-200 text-gray-400 cursor-default'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 text-gray-900"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 disabled:bg-gray-200 disabled:text-gray-400 text-gray-900"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
            <div className="bg-white p-6 rounded-xl w-full max-w-md text-gray-900 shadow-lg">
              <h2 className="text-xl font-bold mb-4">{selectedPaymentLog ? 'Edit Payment Log' : 'Add Payment Log'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Order</label>
                  <select
                    name="order_id"
                    value={formData.order_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Select an order</option>
                    {orders.map((order) => (
                      <option key={order.id} value={order.id}>
                        Order #{order.id} - {order.customer?.name || 'Unknown Customer'}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Amount</label>
                  <input
                    type="number"
                    name="amount"
                    value={formData.amount}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                    step="0.01"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Payment Date</label>
                  <input
                    type="datetime-local"
                    name="payment_date"
                    value={formData.payment_date}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Payment Method</label>
                  <input
                    type="text"
                    name="payment_method"
                    value={formData.payment_method}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-700">Notes</label>
                  <textarea
                    name="notes"
                    value={formData.notes}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    rows={4}
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-400"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
      <ToastContainer position="top-right" autoClose={3000} />
    </div>
  );
};

export default PaymentLogPage;