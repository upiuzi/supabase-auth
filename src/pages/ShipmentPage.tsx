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
  // const [filteredOrders, setFilteredOrders] = useState<Order[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [batches, setBatches] = useState<Batch[]>([]);
  // const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  // const [currentPage, setCurrentPage] = useState(1);
  // const [itemsPerPage] = useState(10);

  const [searchParams] = useSearchParams();
  const batchIdFilter = searchParams.get('batch_id');

  useEffect(() => {
    fetchOrders();
    fetchCustomers();
    fetchBatches();
  }, []);

  const fetchOrders = async () => {
    // setLoading(true);
    try {
      const data = await getOrders();
      setOrders(data);
    } catch (error) {
      console.error('Error fetching orders:', error);
    } finally {
      // setLoading(false);
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
    // setFilteredOrders(filtered);
    // setCurrentPage(1);
  };

  useEffect(() => {
    applyFilters(orders);
  }, [searchQuery, orders, batchIdFilter]);

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchQuery(e.target.value.toLowerCase());
  };

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '-';
  };

  const getBatchId = (batchId: string) => {
    const batch = batches.find(b => b.id === batchId);
    return batch ? batch.batch_id : '-';
  };

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Shipment</h1>
          <p className="text-gray-400 mt-1">View customer orders and batch allocations</p>
        </div>
        <div className="mb-4 flex items-center gap-2">
          <input
            type="text"
            placeholder="Search orders..."
            value={searchQuery}
            onChange={handleSearch}
            className="px-4 py-2 rounded bg-gray-800 border border-gray-600 text-white w-full max-w-xs"
          />
        </div>
        <div>TODO: Implement OrderTableShipment component</div>
      </div>
    </>
  );
};

export default ShipmentPage;