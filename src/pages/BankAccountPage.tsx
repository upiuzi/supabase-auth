import { useState, useEffect } from 'react';
import { 
  createBankAccount, 
  updateBankAccount, 
  deleteBankAccount, 
  getBankAccounts,
  getCompanies,
  BankAccount,
  Company
} from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';

const BankAccountPage = () => {
  const [bankAccounts, setBankAccounts] = useState<BankAccount[]>([]);
  const [filteredBankAccounts, setFilteredBankAccounts] = useState<BankAccount[]>([]);
  const [companies, setCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedBankAccount, setSelectedBankAccount] = useState<BankAccount | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    company_id: '',
    account_name: '',
    account_number: '',
    bank_name: '',
    balance: 0,
    is_default: false
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchBankAccounts();
    fetchCompanies();
  }, []);

  const fetchBankAccounts = async () => {
    setLoading(true);
    try {
      const data = await getBankAccounts();
      setBankAccounts(data);
      setFilteredBankAccounts(data);
    } catch (error) {
      console.error('Error fetching bank accounts:', error);
    } finally {
      setLoading(false);
    }
  };

  const fetchCompanies = async () => {
    try {
      const data = await getCompanies();
      setCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = bankAccounts.filter(account =>
      account.account_name.toLowerCase().includes(query) ||
      account.account_number.toLowerCase().includes(query) ||
      account.bank_name.toLowerCase().includes(query)
    );
    setFilteredBankAccounts(filtered);
    setCurrentPage(1); // Reset to first page when searching
  };

  const handleInputChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    const { name, value, type } = e.target;
    setFormData({
      ...formData,
      [name]: type === 'checkbox' ? (e.target as HTMLInputElement).checked : value
    });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    
    try {
      if (selectedBankAccount) {
        await updateBankAccount(selectedBankAccount.id, formData);
      } else {
        await createBankAccount(formData);
      }
      await fetchBankAccounts();
      resetForm();
    } catch (error) {
      console.error('Error saving bank account:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (account: BankAccount) => {
    setSelectedBankAccount(account);
    setFormData({
      company_id: account.company_id,
      account_name: account.account_name,
      account_number: account.account_number,
      bank_name: account.bank_name,
      balance: account.balance,
      is_default: account.is_default
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this bank account?')) {
      setLoading(true);
      try {
        await deleteBankAccount(id);
        await fetchBankAccounts();
        if (filteredBankAccounts.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error('Error deleting bank account:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedBankAccount(null);
    setFormData({
      company_id: '',
      account_name: '',
      account_number: '',
      bank_name: '',
      balance: 0,
      is_default: false
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredBankAccounts.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredBankAccounts.length / itemsPerPage);

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
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Bank Accounts</h1>
            <p className="text-gray-400 mt-1">Manage your bank accounts</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Bank Account
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search bank accounts..."
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
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Account Name</th>
                    <th className="py-3 px-4">Account Number</th>
                    <th className="py-3 px-4">Bank Name</th>
                    <th className="py-3 px-4">Balance</th>
                    <th className="py-3 px-4">Default</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((account, index) => (
                    <tr key={account.id} className="border-t border-gray-700 hover:bg-gray-700">
                      <td className="py-3 px-4 text-gray-300">{"ba0" + (indexOfFirstItem + index + 1)}</td>
                      <td className="py-3 px-4 text-white">{account.account_name}</td>
                      <td className="py-3 px-4 text-white">{account.account_number}</td>
                      <td className="py-3 px-4 text-white">{account.bank_name}</td>
                      <td className="py-3 px-4 text-white">{account.balance.toLocaleString()}</td>
                      <td className="py-3 px-4 text-white">{account.is_default ? 'Yes' : 'No'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEdit(account)}
                          className="text-gray-400 hover:text-blue-400 mr-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(account.id)}
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

            {/* Pagination Controls */}
            {filteredBankAccounts.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-gray-400">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredBankAccounts.length)} of {filteredBankAccounts.length} entries
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
              <h2 className="text-xl font-bold mb-4">
                {selectedBankAccount ? 'Edit Bank Account' : 'Add Bank Account'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Company</label>
                  <select
                    name="company_id"
                    value={formData.company_id}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  >
                    <option value="" disabled>Select a company</option>
                    {companies.map((company) => (
                      <option key={company.id} value={company.id}>
                        {company.company_name}
                      </option>
                    ))}
                  </select>
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Account Name</label>
                  <input
                    type="text"
                    name="account_name"
                    value={formData.account_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Account Number</label>
                  <input
                    type="text"
                    name="account_number"
                    value={formData.account_number}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Bank Name</label>
                  <input
                    type="text"
                    name="bank_name"
                    value={formData.bank_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">Balance</label>
                  <input
                    type="number"
                    name="balance"
                    value={formData.balance}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 rounded px-3 py-2 bg-gray-700 text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300">
                    <input
                      type="checkbox"
                      name="is_default"
                      checked={formData.is_default}
                      onChange={handleInputChange}
                      className="mr-2"
                    />
                    Set as Default
                  </label>
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
            </div>
          </div>
        )}
      </div>
    </>
  );
};

export default BankAccountPage;