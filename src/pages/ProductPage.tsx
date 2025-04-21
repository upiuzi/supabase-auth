// src/pages/ProductPage.tsx
import { useState, useEffect } from 'react';
import { 
  getProducts, 
  createProduct, 
  updateProduct, 
  deleteProduct, 
  Product 
} from '../services/supabaseService'; // Sesuaikan path dengan struktur proyek Anda
import Navbar2 from '../components/Navbar2';

const ProductPage = () => {
  const [products, setProducts] = useState<Product[]>([]);
  const [filteredProducts, setFilteredProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedProduct, setSelectedProduct] = useState<Product | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    description: '',
  });

  // Fetch products on mount
  useEffect(() => {
    fetchProducts();
  }, []);

  const fetchProducts = async () => {
    setLoading(true);
    try {
      const data = await getProducts();
      setProducts(data);
      setFilteredProducts(data);
    } catch (error) {
      console.error('Error fetching products:', error);
    } finally {
      setLoading(false);
    }
  };

  // Handle search
  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = products.filter(product =>
      product.name.toLowerCase().includes(query) ||
      product.description?.toLowerCase().includes(query)
    );
    setFilteredProducts(filtered);
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setFormData({
      ...formData,
      [e.target.name]: e.target.value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedProduct) {
        // Update product
        await updateProduct(selectedProduct.id, formData);
      } else {
        // Create product
        await createProduct(formData);
      }
      await fetchProducts();
      resetForm();
    } catch (error) {
      console.error('Error saving product:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (product: Product) => {
    setSelectedProduct(product);
    setFormData({
      name: product.name,
      description: product.description || '',
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this product?')) {
      setLoading(true);
      try {
        await deleteProduct(id);
        await fetchProducts();
      } catch (error) {
        console.error('Error deleting product:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedProduct(null);
    setFormData({
      name: '',
      description: '',
    });
  };

  return (
    <main className="min-h-screen bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
      <Navbar2 />
      <div className="container mx-auto p-6">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold dark:text-gray-900">Products</h1>
            <p className="text-gray-400 dark:text-gray-600 mt-1">Manage your product catalog</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 dark:bg-blue-300 text-white dark:text-gray-900 px-4 py-2 rounded hover:bg-blue-600 dark:hover:bg-blue-400 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Product
          </button>
        </div>

        {/* Search Bar */}
        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search products..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-3 pl-10 bg-gray-800 dark:bg-gray-200 border border-gray-700 dark:border-gray-400 rounded-lg text-white dark:text-gray-900 placeholder-gray-400 dark:placeholder-gray-600 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
            />
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-600 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {/* Product List */}
        {loading ? (
          <div className="text-center text-gray-400 dark:text-gray-600">Loading...</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="min-w-full bg-gray-800 dark:bg-gray-200 rounded-lg">
              <thead>
                <tr className="text-gray-400 dark:text-gray-700 text-left">
                  <th className="py-3 px-4">ID</th>
                  <th className="py-3 px-4">Name</th>
                  <th className="py-3 px-4">Description</th>
                  <th className="py-3 px-4">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredProducts.map((product, index) => (
                  <tr key={product.id} className="border-t border-gray-700 dark:border-gray-400 hover:bg-gray-700 dark:hover:bg-gray-300">
                    <td className="py-3 px-4 text-gray-300 dark:text-gray-600">{"prd"+index + 1}</td>
                    <td className="py-3 px-4 text-white dark:text-gray-900">{product.name}</td>
                    <td className="py-3 px-4 text-white dark:text-gray-900">{product.description || '-'}</td>
                    <td className="py-3 px-4">
                      <button
                        onClick={() => handleEdit(product)}
                        className="text-gray-400 dark:text-gray-600 hover:text-blue-400 dark:hover:text-blue-300 mr-3"
                      >
                        <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                        </svg>
                      </button>
                      <button
                        onClick={() => handleDelete(product.id)}
                        className="text-gray-400 dark:text-gray-600 hover:text-red-400 dark:hover:text-red-300"
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
        )}

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 dark:bg-gray-400 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 dark:bg-gray-200 p-6 rounded-lg w-full max-w-md text-white dark:text-gray-900">
              <h2 className="text-xl font-bold mb-4">
                {selectedProduct ? 'Edit Product' : 'Add Product'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-600">Name</label>
                  <input
                    type="text"
                    name="name"
                    value={formData.name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 dark:border-gray-400 rounded px-3 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-600">Description</label>
                  <input
                    type="text"
                    name="description"
                    value={formData.description}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 dark:border-gray-400 rounded px-3 py-2 bg-gray-800 dark:bg-gray-200 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-300"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={resetForm}
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-400 rounded hover:bg-gray-500 dark:hover:bg-gray-300 text-white dark:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 dark:bg-blue-300 text-white dark:text-gray-900 rounded hover:bg-blue-600 dark:hover:bg-blue-400 disabled:bg-blue-400 dark:disabled:bg-blue-300"
                  >
                    {loading ? 'Saving...' : 'Save'}
                  </button>
                </div>
              </form>
            </div>
          </div>
        )}
      </div>
    </main>
  );
};

export default ProductPage;