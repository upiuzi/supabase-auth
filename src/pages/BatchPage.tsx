import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { 
  getBatches, 
  createBatch, 
  updateBatch, 
  deleteBatch, 
  getProducts,
  Batch,
  Product 
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';

type BatchProduct = {
  product_id: string;
  initial_qty: number;
  remaining_qty: number;
};

const BatchPage = () => {
  const [batches, setBatches] = useState<Batch[]>([]);
  const [filteredBatches, setFilteredBatches] = useState<Batch[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBatch, setSelectedBatch] = useState<Batch | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [statusFilter, setStatusFilter] = useState<string>('ALL');
  const [formData, setFormData] = useState<{
    batch_id: string;
    status: 'active' | 'sold_out' | 'cancelled';
    products: BatchProduct[];
  }>({
    batch_id: '',
    status: 'active',
    products: [],
  });

  const navigate = useNavigate();

  useEffect(() => {
    fetchBatches();
    fetchProducts();
  }, []);

  const fetchBatches = async () => {
    setLoading(true);
    try {
      const data = await getBatches();
      console.log('Fetched batches:', data);
      // Sort batches by created_at in descending order (most recent first)
      const sortedBatches = data.sort((a: Batch, b: Batch) => {
        return new Date(b.created_at).getTime() - new Date(a.created_at).getTime();
      });
      setBatches(sortedBatches);
      setFilteredBatches(sortedBatches);
    } catch (error) {
      console.error('Error fetching batches:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchProducts = async () => {
    try {
      const data = await getProducts();
      console.log('Fetched products:', data);
      setProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    filterBatches(query, statusFilter);
  };

  const handleStatusFilter = (e: React.ChangeEvent<HTMLSelectElement>) => {
    const status = e.target.value;
    setStatusFilter(status);
    filterBatches(searchQuery, status);
  };

  const filterBatches = (query: string, status: string) => {
    let filtered = batches;

    if (query) {
      filtered = filtered.filter(batch =>
        batch.batch_id.toLowerCase().includes(query) ||
        batch.batch_products?.some(bp => 
          getProductName(bp.product_id).toLowerCase().includes(query)
        )
      );
    }

    if (status !== 'ALL') {
      filtered = filtered.filter(batch => {
        const totalInitialQty = batch.batch_products?.reduce(
          (sum, bp) => sum + (bp.initial_qty || 0),
          0
        ) || 0;
        const totalRemainingQty = batch.batch_products?.reduce(
          (sum, bp) => sum + (bp.remaining_qty || 0),
          0
        ) || 0;

        if (status === 'Available' && totalRemainingQty === totalInitialQty) return true;
        if (status === 'Partially Sold' && totalRemainingQty > 0 && totalRemainingQty < totalInitialQty) return true;
        if (status === 'Sold Out' && totalRemainingQty === 0) return true;
        return false;
      });
    }

    setFilteredBatches(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value,
    });
  };

  const handleProductChange = (
    index: number,
    field: keyof BatchProduct,
    value: string | number
  ) => {
    const updatedProducts = formData.products.map((product, i) => {
      if (i === index) {
        if (field === 'product_id') {
          return { ...product, [field]: value as string };
        }
        const numericValue = typeof value === 'string' ? parseInt(value) : (value as number);
        const newValue = isNaN(numericValue) ? product[field] : numericValue;
        if (field === 'remaining_qty' && !isNaN(newValue) && !isNaN(product.initial_qty)) {
          return { ...product, [field]: Math.min(newValue, product.initial_qty) };
        }
        return { ...product, [field]: newValue };
      }
      return product;
    });
    setFormData({
      ...formData,
      products: updatedProducts,
    });
  };

  const handleAddProduct = () => {
    const availableProducts = products.filter(
      p => !formData.products.some(fp => fp.product_id === p.id)
    );
    if (availableProducts.length > 0) {
      setFormData({
        ...formData,
        products: [...formData.products, { 
          product_id: availableProducts[0].id,
          initial_qty: 0, 
          remaining_qty: 0 
        }],
      });
    }
  };

  const handleRemoveProduct = (index: number) => {
    const updatedProducts = formData.products.filter((_, i) => i !== index);
    setFormData({
      ...formData,
      products: updatedProducts,
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      const invalidProduct = formData.products.find(
        p => isNaN(p.initial_qty) || isNaN(p.remaining_qty) || p.initial_qty < 0 || p.remaining_qty < 0
      );
      if (invalidProduct) {
        throw new Error('Please ensure all product quantities are valid non-negative numbers');
      }

      if (formData.products.length === 0) {
        throw new Error('Please add at least one product to the batch');
      }

      if (selectedBatch) {
        await updateBatch(selectedBatch.id, formData, formData.products);
      } else {
        await createBatch(
          {
            batch_id: formData.batch_id,
            status: formData.status,
            created_at: '',
            batch_name: undefined
          },
          formData.products
        );
      }
      await fetchBatches();
      resetForm();
    } catch (error: any) {
      console.error('Error saving batch:', error);
      if (error.code === 401) {
        alert('Authentication error: Please check your Supabase API key and permissions.');
      } else {
        alert('Failed to save batch: ' + (error.message || 'Unknown error'));
      }
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (batch: Batch) => {
    setSelectedBatch(batch);
    setFormData({
      batch_id: batch.batch_id,
      status: batch.status,
      products: batch.batch_products ? batch.batch_products.map(bp => ({
        product_id: bp.product_id,
        initial_qty: bp.initial_qty,
        remaining_qty: bp.remaining_qty,
      })) : [],
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this batch?')) {
      setLoading(true);
      try {
        await deleteBatch(id);
        await fetchBatches();
      } catch (error) {
        console.error('Error deleting batch:', error);
        alert('Failed to delete batch: ' + (error instanceof Error ? error.message : 'Unknown error'));
      } finally {
        setLoading(false);
      }
    }
  };

  const handleShipmentClick = (batchId: string) => {
    navigate(`/shipment?batch_id=${batchId}`);
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedBatch(null);
    setFormData({
      batch_id: '',
      status: 'active',
      products: [],
    });
  };

  const getProductName = (productId: string) => {
    const product = products.find(p => p.id === productId);
    return product ? product.name : 'Unknown Product';
  };

  const getBatchStatus = (batch: Batch) => {
    const totalInitialQty = batch.batch_products?.reduce(
      (sum, bp) => sum + (bp.initial_qty || 0),
      0
    ) || 0;
    const totalRemainingQty = batch.batch_products?.reduce(
      (sum, bp) => sum + (bp.remaining_qty || 0),
      0
    ) || 0;

    if (totalRemainingQty === 0) return 'Sold Out';
    if (totalRemainingQty === totalInitialQty) return 'Available';
    return 'Partially Sold';
  };

  const getBatchStatusColor = (batch: Batch) => {
    const totalInitialQty = batch.batch_products?.reduce(
      (sum, bp) => sum + (bp.initial_qty || 0),
      0
    ) || 0;
    const totalRemainingQty = batch.batch_products?.reduce(
      (sum, bp) => sum + (bp.remaining_qty || 0),
      0
    ) || 0;

    if (totalRemainingQty === 0) return 'bg-red-900 text-red-200';
    if (totalRemainingQty === totalInitialQty) return 'bg-green-900 text-green-200';
    return 'bg-yellow-900 text-yellow-200';
  };

  return (
    <>
      <Navbar2 />
      <div style={{backgroundColor: '#ffffff' }}>
      <div className="container mx-auto p-6 min-h-screen bg-white text-gray-900">
        <div className="mb-4">
          <h1 className="text-3xl font-bold">Batch</h1>
          <p className="text-gray-600 mt-1">Manage your product batches and allocations</p>
        </div>
        <div className="mb-4 flex flex-wrap gap-2 items-center">
          <input
            type="text"
            placeholder="Search batch or product..."
            value={searchQuery}
            onChange={handleSearch}
            className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <select
            value={statusFilter}
            onChange={handleStatusFilter}
            className="px-4 py-2 border border-gray-300 rounded bg-white text-gray-900"
          >
            <option value="ALL">All Status</option>
            <option value="Available">Available</option>
            <option value="Partially Sold">Partially Sold</option>
            <option value="Sold Out">Sold Out</option>
          </select>
          <button
            onClick={() => setShowModal(true)}
            className="ml-auto px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 font-semibold shadow"
          >
            + Create Batch
          </button>
        </div>

        {/* Batch List */}
        {loading ? (
          <div className="text-center text-gray-600">Loading...</div>
        ) : filteredBatches.length === 0 ? (
          <div className="text-center text-gray-600">No batches available.</div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6" style={{backgroundColor: '#fffff'}}>
            {filteredBatches.map((batch) => (
              <div 
                key={batch.id} 
                className="bg-white p-6 rounded-xl shadow-lg ring-1 ring-gray-200 hover:ring-blue-200 transition-shadow duration-150 relative"
              >
                <div className="flex flex-col justify-between h-full p-0">
                  <div>
                    <div className="flex justify-between items-center mb-2">
                      <h3 className="text-lg font-semibold">
                        Batch #{batch.batch_id}
                      </h3>
                    </div>
                    {batch.batch_products && batch.batch_products.length > 0 ? (
                      batch.batch_products.map((bp, index) => (
                        <div key={index} className="mb-2">
                          <p className="text-gray-600">{getProductName(bp.product_id)}</p>
                          <div className="w-full bg-gray-200 rounded-full h-2.5">
                            <div
                              className="bg-blue-500 h-2.5 rounded-full"
                              style={{ width: `${(bp.remaining_qty / bp.initial_qty) * 100}%` }}
                            ></div>
                          </div>
                          <p className="text-sm text-gray-600">
                            {bp.remaining_qty} / {bp.initial_qty}
                          </p>
                        </div>
                      ))
                    ) : (
                      <p className="text-gray-600">No products</p>
                    )}
                  </div>
                  <div className="mt-auto flex justify-center pt-2">
                    <span className={`px-5 py-2 text-base font-bold rounded-full ${getBatchStatusColor(batch)}`}>{getBatchStatus(batch)}</span>
                  </div>
                  <div className="absolute top-4 right-4 flex gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleEdit(batch);
                      }}
                      className="text-gray-600 hover:text-blue-600"
                      title="Edit Batch"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15.232 5.232l3.536 3.536M9 13h3l8-8a2.828 2.828 0 10-4-4l-8 8v3z" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDelete(batch.id);
                      }}
                      className="text-gray-600 hover:text-red-600"
                      title="Delete Batch"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/orderbatch/${batch.id}`);
                      }}
                      className="text-gray-600 hover:text-yellow-600"
                      title="View Orders"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 17v-6a2 2 0 012-2h6" />
                      </svg>
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleShipmentClick(batch.id);
                      }}
                      className="text-gray-600 hover:text-green-600"
                      title="View Shipments"
                    >
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                      </svg>
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-white p-6 rounded-lg w-full max-w-md text-gray-900">
              <h2 className="text-xl font-bold mb-4">
                {selectedBatch ? 'Edit Batch' : 'Add Batch'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-600">Batch ID</label>
                  <input
                    type="text"
                    name="batch_id"
                    value={formData.batch_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-600">Status</label>
                  <select
                    name="status"
                    value={formData.status}
                    onChange={handleInputChange}
                    className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="active">Active</option>
                    <option value="sold_out">Sold Out</option>
                    <option value="cancelled">Cancelled</option>
                  </select>
                </div>

                <div className="mb-4">
                  <h3 className="text-lg font-bold mb-2">Products</h3>
                  {formData.products.map((product, index) => (
                    <div key={index} className="mb-2">
                      <div className="flex items-center">
                        <div className="w-1/3">
                          <label className="block text-sm font-medium mb-1 text-gray-600">Product</label>
                          <select
                            value={product.product_id}
                            onChange={(e) => handleProductChange(index, 'product_id', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                          >
                            <option value="">Select Product</option>
                            {products
                              .filter((prod) => !formData.products.some((p, i) => p.product_id === prod.id && i !== index))
                              .map((prod) => (
                                <option key={prod.id} value={prod.id}>
                                  {prod.name}
                                </option>
                              ))}
                          </select>
                        </div>
                        <div className="w-1/3">
                          <label className="block text-sm font-medium mb-1 text-gray-600">Initial Qty</label>
                          <input
                            type="number"
                            value={isNaN(product.initial_qty) ? '' : product.initial_qty}
                            onChange={(e) => handleProductChange(index, 'initial_qty', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="0"
                          />
                        </div>
                        <div className="w-1/3">
                          <label className="block text-sm font-medium mb-1 text-gray-600">Remaining Qty</label>
                          <input
                            type="number"
                            value={isNaN(product.remaining_qty) ? '' : product.remaining_qty}
                            onChange={(e) => handleProductChange(index, 'remaining_qty', e.target.value)}
                            className="w-full border border-gray-300 rounded px-3 py-2 bg-white text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                            required
                            min="0"
                          />
                        </div>
                        <button
                          type="button"
                          onClick={() => handleRemoveProduct(index)}
                          className="ml-2 px-2 py-1 bg-red-500 text-white rounded hover:bg-red-600"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                  <button
                    type="button"
                    onClick={handleAddProduct}
                    className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600"
                    disabled={products.length === 0 || formData.products.length === products.length}
                  >
                    Add Product
                  </button>
                  {products.length === 0 && (
                    <p className="text-red-500 text-sm mt-2">No products available. Please add products first.</p>
                  )}
                  {formData.products.length === products.length && products.length > 0 && (
                    <p className="text-red-500 text-sm mt-2">All available products have been added.</p>
                  )}
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-300 rounded hover:bg-gray-400 text-gray-900"
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
      </div>
    </>
  );
};

export default BatchPage;