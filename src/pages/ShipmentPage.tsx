import { useState, useEffect } from 'react';
import { useSearchParams } from 'react-router-dom';
import { 
  getOrders, 
  getCustomers, 
  getBatches, 
  Customer, 
  Batch, 
  Order, 
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';


const ShipmentPage = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

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
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Shipment</h1>
          <p className="text-gray-400 mt-1">View customer orders and batch allocations</p>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search orders..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-3 pl-10 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
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
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr className="text-gray-400 text-left">
                  <th className="py-3 px-4">Batch</th>
                    <th className="py-3 px-4">Customer</th>
                    <th className="py-3 px-4">Customer Address</th>
                    <th className="py-3 px-4">Customer Phone</th>
                    
                    <th className="py-3 px-4">Product</th>
                    <th className="py-3 px-4">Expedition</th>
                    <th className="py-3 px-4">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((order) => (
                    <tr key={order.id} className="border-t border-gray-700 hover:bg-gray-700">
                        <td className="py-3 px-4 text-white">{getBatchId(order.batch_id)}</td>
                      <td className="py-3 px-4 text-white">{getCustomerName(order.customer_id)}</td>
                      <td className="py-3 px-4 text-white">{getCustomerAddress(order.customer_id)}</td>
                      <td className="py-3 px-4 text-white">{getCustomerPhone(order.customer_id)}</td>
                      
                      <td className="py-3 px-4 text-white">
                        {order.order_items && order.order_items.length > 0 ? (
                          order.order_items.map((item, idx) => (
                            <div key={idx}>
                              {getProductName(item.product_id, order.batch_id)}: {((item.qty)/19)+" Jerigen"} 
                            </div>
                          ))
                        ) : (
                          '-'
                        )}
                      </td>
                      <td className="py-3 px-4 text-white">{order.expedition || '-'}</td>
                      <td className="py-3 px-4 text-white">{order.description || '-'}</td>
                    </tr>
                  ))}
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
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                  >
                    First
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
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
                          ? 'bg-gray-700 text-white hover:bg-gray-600'
                          : 'bg-gray-700 text-gray-400 cursor-default'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 rounded hover:bg-gray-600 disabled:bg-gray-800 disabled:text-gray-500 text-white"
                  >
                    Last
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default ShipmentPage;