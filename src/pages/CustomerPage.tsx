
// src/pages/CustomerPage.tsx
import { useState, useEffect } from 'react';
import { 
  createCustomer, 
  updateCustomer, 
  deleteCustomer, 
  Customer 
} from '../services/supabaseService';
import { getCustomers } from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';

const CustomerPage = () => {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [filteredCustomers, setFilteredCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [modalType, setModalType] = useState<'customer' | 'whatsapp' | null>(null);
  const [selectedCustomer, setSelectedCustomer] = useState<Customer | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    name: '',
    phone: '',
    address: '',
    brand: '',
    city: '',
    email: ''
  });
  const [whatsappMessage, setWhatsappMessage] = useState('');
  const [sendingWhatsApp, setSendingWhatsApp] = useState(false);
  const [selectedCustomerIds, setSelectedCustomerIds] = useState<string[]>([]); // State untuk pelanggan terpilih
  const [sendToAll, setSendToAll] = useState(true); // State untuk opsi pengiriman
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCustomers();
  }, []);

  const fetchCustomers = async () => {
    setLoading(true);
    try {
      const data = await getCustomers();
      setCustomers(data);
      setFilteredCustomers(data);
    } catch (error) {
      console.error('Error fetching customers:', error);
    } finally {
      setLoading(false);
    }
  };

  // Fungsi untuk mengirim WhatsApp
  const sendWhatsApp = async (recipients: Customer[]) => {
    if (!whatsappMessage.trim()) {
      alert('Masukkan pesan WhatsApp terlebih dahulu!');
      return;
    }

    setSendingWhatsApp(true);
    const customersWithPhone = recipients.filter(customer => customer.phone);

    if (customersWithPhone.length === 0) {
      alert('Tidak ada pelanggan dengan nomor telepon yang valid!');
      setSendingWhatsApp(false);
      return;
    }

    for (let i = 0; i < customersWithPhone.length; i++) {
      const customer = customersWithPhone[i];
      try {
        const response = await fetch('https://wagt.satcoconut.com/send', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            sessionId: '6281122244446',
            to: customer.phone,
            text: whatsappMessage
          })
        });

        if (response.ok) {
          console.log(`Pesan WhatsApp berhasil dikirim ke ${customer.name} (${customer.phone})`);
        } else {
          console.error(`Gagal mengirim WhatsApp ke ${customer.name}`);
        }

        if (i < customersWithPhone.length - 1) {
          await new Promise(resolve => setTimeout(resolve, 30000)); // Interval 30 detik
        }
      } catch (error) {
        console.error(`Error mengirim WhatsApp ke ${customer.name}:`, error);
      }
    }

    setSendingWhatsApp(false);
    setWhatsappMessage('');
    setShowModal(false);
    setModalType(null);
    setSelectedCustomerIds([]); // Reset pilihan setelah pengiriman
    alert('Pengiriman WhatsApp selesai!');
  };

  // Fungsi untuk mengirim ke semua pelanggan
  const sendWhatsAppToAll = () => {
    sendWhatsApp(filteredCustomers);
  };

  // Fungsi untuk mengirim ke pelanggan terpilih
  const sendWhatsAppToSelected = () => {
    const selectedCustomers = filteredCustomers.filter(customer => 
      selectedCustomerIds.includes(customer.id)
    );
    if (selectedCustomers.length === 0) {
      alert('Pilih setidaknya satu pelanggan!');
      return;
    }
    sendWhatsApp(selectedCustomers);
  };

  // Fungsi untuk menangani pemilihan checkbox
  const handleSelectCustomer = (customerId: string) => {
    setSelectedCustomerIds(prev => 
      prev.includes(customerId) 
        ? prev.filter(id => id !== customerId) 
        : [...prev, customerId]
    );
  };

  // Fungsi untuk memilih semua pelanggan di halaman saat ini
  const handleSelectAll = () => {
    const currentPageIds = currentItems.map(customer => customer.id);
    if (selectedCustomerIds.length === currentItems.length) {
      setSelectedCustomerIds([]);
    } else {
      setSelectedCustomerIds(currentPageIds);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = customers.filter(customer =>
      customer.name.toLowerCase().includes(query) ||
      customer.phone?.toLowerCase().includes(query) ||
      customer.address?.toLowerCase().includes(query) ||
      customer.brand?.toLowerCase().includes(query) ||
      customer.city?.toLowerCase().includes(query) ||
      customer.email?.toLowerCase().includes(query)
    );
    setFilteredCustomers(filtered);
    setSelectedCustomerIds([]); // Reset pilihan saat pencarian
    setCurrentPage(1);
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
      if (selectedCustomer) {
        await updateCustomer(selectedCustomer.id, formData);
      } else {
        await createCustomer(formData);
      }
      await fetchCustomers();
      resetForm();
    } catch (error) {
      console.error('Error saving customer:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (customer: Customer) => {
    setSelectedCustomer(customer);
    setFormData({
      name: customer.name,
      phone: customer.phone || '',
      address: customer.address || '',
      brand: customer.brand || '',
      city: customer.city || '',
      email: customer.email || ''
    });
    setModalType('customer');
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this customer?')) {
      setLoading(true);
      try {
        await deleteCustomer(id);
        await fetchCustomers();
        setSelectedCustomerIds(prev => prev.filter(customerId => customerId !== id));
        if (filteredCustomers.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error('Error deleting customer:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setModalType(null);
    setSelectedCustomer(null);
    setFormData({
      name: '',
      phone: '',
      address: '',
      brand: '',
      city: '',
      email: ''
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCustomers.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCustomers.length / itemsPerPage);

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

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Customers</h1>
            <p className="text-gray-400 mt-1">Manage your customer database</p>
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => {
                setModalType('customer');
                setShowModal(true);
              }}
              className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Customer
            </button>
            <button
              onClick={() => {
                setModalType('whatsapp');
                setShowModal(true);
              }}
              className="bg-green-500 text-white px-4 py-2 rounded hover:bg-green-600 flex items-center gap-2"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M7 8h10M7 12h4m1 8l-4-4H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-3l-4 4z" />
              </svg>
              Kirim WhatsApp
            </button>
          </div>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search customers..."
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
                        checked={currentItems.length > 0 && selectedCustomerIds.length === currentItems.length}
                        onChange={handleSelectAll}
                        className="form-checkbox h-5 w-5 text-blue-500"
                      />
                    </th>
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Name</th>
                    <th className="py-3 px-4">Brand</th>
                    <th className="py-3 px-4">Phone Number</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">City</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((customer, index) => (
                    <tr key={customer.id} className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedCustomerIds.includes(customer.id)}
                          onChange={() => handleSelectCustomer(customer.id)}
                          className="form-checkbox h-5 w-5 text-blue-500"
                        />
                      </td>
                      <td className="py-3 px-4 text-gray-300">{"csr0" + (indexOfFirstItem + index + 1)}</td>
                      <td className="py-3 px-4 text-white">{customer.name}</td>
                      <td className="py-3 px-4 text-white">{customer.brand || '-'}</td>
                      <td className="py-3 px-4 text-white">{customer.phone || '-'}</td>
                      <td className="py-3 px-4 text-white">{customer.email || '-'}</td>
                      <td className="py-3 px-4 text-white">{customer.address || '-'}</td>
                      <td className="py-3 px-4 text-white">{customer.city || '-'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEdit(customer)}
                          className="text-gray-400 hover:text-blue-400 mr-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(customer.id)}
                          className="text-gray-400 hover:text-red-400"
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

            {filteredCustomers.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-gray-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCustomers.length)} of {filteredCustomers.length} entries
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

        {/* Modal */}
        {showModal && (
          <div className="fixed inset-0 bg-gray-600 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
              {modalType === 'customer' ? (
                <>
                  <h2 className="text-xl font-bold mb-4">
                    {selectedCustomer ? 'Edit Customer' : 'Add Customer'}
                  </h2>
                  <form onSubmit={handleSubmit}>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Name</label>
                      <input
                        type="text"
                        name="name"
                        value={formData.name}
                        onChange={handleInputChange}
                        className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                        required
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Phone</label>
                      <input
                        type="text"
                        name="phone"
                        value={formData.phone}
                        onChange={handleInputChange}
                        className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Email</label>
                      <input
                        type="email"
                        name="email"
                        value={formData.email}
                        onChange={handleInputChange}
                        className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Address</label>
                      <input
                        type="text"
                        name="address"
                        value={formData.address}
                        onChange={handleInputChange}
                        className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-300">City</label>
                      <input
                        type="text"
                        name="city"
                        value={formData.city}
                        onChange={handleInputChange}
                        className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="mb-4">
                      <label className="block text-sm font-medium mb-1 text-gray-300">Brand</label>
                      <input
                        type="text"
                        name="brand"
                        value={formData.brand}
                        onChange={handleInputChange}
                        className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      />
                    </div>
                    <div className="flex justify-end gap-2">
                      <button
                        type="button"
                        onClick={resetForm}
                        className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
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
                </>
              ) : modalType === 'whatsapp' ? (
                <>
                  <h2 className="text-xl font-bold mb-4">Kirim WhatsApp</h2>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-300">Kirim Ke</label>
                    <div className="flex gap-4">
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sendOption"
                          checked={sendToAll}
                          onChange={() => setSendToAll(true)}
                          className="form-radio h-5 w-5 text-blue-500"
                        />
                        <span className="ml-2 text-gray-300">Semua Pelanggan</span>
                      </label>
                      <label className="flex items-center">
                        <input
                          type="radio"
                          name="sendOption"
                          checked={!sendToAll}
                          onChange={() => setSendToAll(false)}
                          className="form-radio h-5 w-5 text-blue-500"
                        />
                        <span className="ml-2 text-gray-300">Pelanggan Terpilih</span>
                      </label>
                    </div>
                  </div>
                  <div className="mb-4">
                    <label className="block text-sm font-medium mb-1 text-gray-300">Pesan WhatsApp</label>
                    <textarea
                      value={whatsappMessage}
                      onChange={(e) => setWhatsappMessage(e.target.value)}
                      placeholder="Masukkan pesan WhatsApp..."
                      className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                      rows={5}
                      required
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => {
                        setWhatsappMessage('');
                        setShowModal(false);
                        setModalType(null);
                        setSendToAll(true);
                      }}
                      className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500 text-white"
                    >
                      Cancel
                    </button>
                    <button
                      onClick={sendToAll ? sendWhatsAppToAll : sendWhatsAppToSelected}
                      disabled={sendingWhatsApp || !whatsappMessage.trim()}
                      className="px-4 py-2 bg-green-500 text-white rounded hover:bg-green-600 disabled:bg-green-400"
                    >
                      {sendingWhatsApp ? 'Mengirim...' : 'Kirim'}
                    </button>
                  </div>
                </>
              ) : null}
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default CustomerPage;
