import { useState, useEffect } from 'react';
import { 
  getSamples, 
  createSample, 
  updateSample,
  deleteSample,
  getCustomers, 
  getProducts,
  Customer, 
  Product
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';

type SampleItem = {
  product_id: string;
  qty: number;
};

const RequestSamplePage = () => {
  const [samples, setSamples] = useState<any[]>([]);
  const [filteredSamples, setFilteredSamples] = useState<any[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [sampleToEdit, setSampleToEdit] = useState<any | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState<{
    customer_id: string;
    status: 'Request' | 'Send' | 'Reject' | 'Approve';
    order_items: SampleItem[];
    expedition?: string;
    description?: string;
  }>({
    customer_id: '',
    status: 'Request',
    order_items: [],
    expedition: '',
    description: ''
  });

  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchSamples();
    fetchCustomers();
    fetchProducts();
  }, []);

  const fetchSamples = async () => {
    setLoading(true);
    try {
      const data = await getSamples();
      setSamples(data);
      setFilteredSamples(data);
    } catch (error) {
      console.error('Error fetching samples:', error);
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

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = samples.filter(sample =>
      getCustomerName(sample.customer_id).toLowerCase().includes(query) ||
      sample.status.toLowerCase().includes(query)
    );
    setFilteredSamples(filtered);
    setCurrentPage(1);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleSampleItemChange = (index: number, field: keyof SampleItem, value: string | number) => {
    const updatedItems = formData.order_items.map((item, i) => {
      if (i === index) {
        return { ...item, [field]: value };
      }
      return item;
    });
    setFormData({
      ...formData,
      order_items: updatedItems,
    });
  };

  const handleAddSampleItem = () => {
    setFormData({
      ...formData,
      order_items: [...formData.order_items, { product_id: '', qty: 0 }],
    });
  };

  const handleRemoveSampleItem = (index: number) => {
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
      if (sampleToEdit) {
        await updateSample(sampleToEdit.id, formData as any, formData.order_items as any);
      } else {
        await createSample(formData as any, formData.order_items as any);
      }
      await fetchSamples();
      resetForm();
    } catch (error) {
      console.error('Error saving sample request:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (sample: any) => {
    setSampleToEdit(sample);
    setFormData({
      customer_id: sample.customer_id,
      status: sample.status,
      order_items: sample.sample_items?.map((item: any) => ({
        product_id: item.product_id,
        qty: item.qty
      })) || [],
      expedition: sample.expedition || '',
      description: sample.description || ''
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this sample request?')) {
      setLoading(true);
      try {
        await deleteSample(id);
        await fetchSamples();
      } catch (error) {
        console.error('Error deleting sample request:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSampleToEdit(null);
    setFormData({
      customer_id: '',
      status: 'Request',
      order_items: [],
      expedition: '',
      description: ''
    });
  };

  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredSamples.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredSamples.length / itemsPerPage);

  const paginate = (pageNumber: number) => setCurrentPage(pageNumber);

  const getCustomerName = (customerId: string) => {
    const customer = customers.find(c => c.id === customerId);
    return customer ? customer.name : '-';
  };

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <div className="flex justify-between items-center mb-4">
          <h1 className="text-3xl font-bold">Request Sample</h1>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Sample Request
          </button>
        </div>

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

        <div className="mb-6">
          <input
            type="text"
            placeholder="Search sample requests..."
            value={searchQuery}
            onChange={handleSearch}
            className="w-full p-3 bg-gray-800 border border-gray-700 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 rounded-lg">
                <thead>
                  <tr className="text-gray-400 text-left">
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Products</th>
                    <th className="py-3 px-4">Status</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((sample) => (
                    <tr key={sample.id} className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4">{sample.customers?.name || '-'}</td>
                      <td className="py-3 px-4">{sample.customers?.email || '-'}</td>
                      <td className="py-3 px-4">{sample.customers?.address || '-'}</td>
                      <td className="py-3 px-4">{sample.customers?.phone || '-'}</td>
                      <td className="py-3 px-4">
                        {sample.sample_items?.map((item: any) => item.product?.name).join(', ') || '-'}
                      </td>
                      <td className="py-3 px-4">{sample.status}</td>
                      <td className="py-3 px-4 flex gap-2">
                        <button
                          onClick={() => handleEdit(sample)}
                          className="text-blue-400 hover:text-blue-300"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDelete(sample.id)}
                          className="text-red-400 hover:text-red-300"
                        >
                          Delete
                        </button>
                        <button
                          onClick={() => printSample(sample)}
                          className="text-green-400 hover:text-green-300"
                        >
                          Print
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="mt-4 flex justify-center gap-2">
              {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
                <button
                  key={page}
                  onClick={() => paginate(page)}
                  className={`px-4 py-2 rounded ${
                    page === currentPage
                      ? 'bg-blue-500 text-white'
                      : 'bg-gray-700 text-white hover:bg-gray-600'
                  }`}
                >
                  {page}
                </button>
              ))}
            </div>
          </>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-900 bg-opacity-75 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-lg text-white">
              <h2 className="text-xl font-bold mb-4">{sampleToEdit ? 'Edit Sample Request' : 'Add Sample Request'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-1">Customer</label>
                  <select
                    name="customer_id"
                    value={formData.customer_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700"
                    required
                  >
                    <option value="">Select Customer</option>
                    {customers.map((c) => (
                      <option key={c.id} value={c.id}>{c.name}</option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700"
                    required
                  >
                    <option value="Request">Request</option>
                    <option value="Send">Send</option>
                    <option value="Reject">Reject</option>
                    <option value="Approve">Approve</option>
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Description</label>
                  <textarea
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-600 rounded px-3 py-2 bg-gray-700"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Sample Items</label>
                  {formData.order_items.map((item, index) => (
                    <div key={index} className="flex gap-2 mb-2">
                      <select
                        value={item.product_id}
                        onChange={(e) => handleSampleItemChange(index, 'product_id', e.target.value)}
                        className="flex-1 border border-gray-600 rounded px-3 py-2 bg-gray-700"
                      >
                        <option value="">Select Product</option>
                        {products.map((p) => (
                          <option key={p.id} value={p.id}>{p.name}</option>
                        ))}
                      </select>
                      <input
                        type="number"
                        placeholder="Qty"
                        value={item.qty}
                        onChange={(e) => handleSampleItemChange(index, 'qty', e.target.value)}
                        className="w-20 border border-gray-600 rounded px-3 py-2 bg-gray-700"
                      />
                      <button
                        type="button"
                        onClick={() => handleRemoveSampleItem(index)}
                        className="text-red-400 hover:text-red-300"
                      >
                        Remove
                      </button>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddSampleItem}
                    className="mt-2 bg-green-500 text-white px-3 py-1 rounded hover:bg-green-600"
                  >
                    Add Item
                  </button>
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
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
    </>
  );
};

const printSample = (sample: any) => {
  const customer = sample.customers;
  const products = sample.sample_items?.map((item: any) => item.product?.name).join(', ') || '-';

  const printWindow = window.open('', '_blank', 'width=600,height=400');
  if (!printWindow) return;

  printWindow.document.write(`
    <html>
      <head>
        <title>Sample Request</title>
        <style>
          body { font-family: sans-serif; padding: 20px; }
          h2 { margin-bottom: 20px; }
          p { margin: 5px 0; }
        </style>
      </head>
      <body>
        <h2>Sample Request</h2>
        <p><strong>Name:</strong> ${customer?.name || '-'}</p>
        <p><strong>Email:</strong> ${customer?.email || '-'}</p>
        <p><strong>Address:</strong> ${customer?.address || '-'}</p>
        <p><strong>Phone:</strong> ${customer?.phone || '-'}</p>
        <p><strong>Description:</strong> ${sample.description || '-'}</p>
        <p><strong>Products:</strong> ${products}</p>
      </body>
    </html>
  `);
  printWindow.document.close();
  printWindow.focus();
  printWindow.print();
};

export default RequestSamplePage;
