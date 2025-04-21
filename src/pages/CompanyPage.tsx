import { useState, useEffect } from 'react';
import { 
  createCompany, 
  updateCompany, 
  deleteCompany, 
  Company 
} from '../services/supabaseService';
import { getCompanies } from '../services/supabaseService';
import Navbar2 from '../components/Navbar2';

const CompanyPage = () => {
  const [companies, setCompanies] = useState<Company[]>([]);
  const [filteredCompanies, setFilteredCompanies] = useState<Company[]>([]);
  const [loading, setLoading] = useState(false);
  const [showModal, setShowModal] = useState(false);
  const [selectedCompany, setSelectedCompany] = useState<Company | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [formData, setFormData] = useState({
    company_name: '',
    phone: '',
    address: '',
    email: '',
    is_default: false
  });
  
  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  useEffect(() => {
    fetchCompanies();
  }, []);

  const fetchCompanies = async () => {
    setLoading(true);
    try {
      const data = await getCompanies();
      setCompanies(data);
      setFilteredCompanies(data);
    } catch (error) {
      console.error('Error fetching companies:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const query = e.target.value.toLowerCase();
    setSearchQuery(query);
    const filtered = companies.filter(company =>
      company.company_name.toLowerCase().includes(query) ||
      company.phone?.toLowerCase().includes(query) ||
      company.address?.toLowerCase().includes(query) ||
      company.email?.toLowerCase().includes(query)
    );
    setFilteredCompanies(filtered);
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
      if (selectedCompany) {
        await updateCompany(selectedCompany.id, formData);
      } else {
        await createCompany(formData);
      }
      await fetchCompanies();
      resetForm();
    } catch (error) {
      console.error('Error saving company:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleEdit = (company: Company) => {
    setSelectedCompany(company);
    setFormData({
      company_name: company.company_name,
      phone: company.phone || '',
      address: company.address || '',
      email: company.email || '',
      is_default: company.is_default
    });
    setShowModal(true);
  };

  const handleDelete = async (id: string) => {
    if (confirm('Are you sure you want to delete this company?')) {
      setLoading(true);
      try {
        await deleteCompany(id);
        await fetchCompanies();
        if (filteredCompanies.length === 1 && currentPage > 1) {
          setCurrentPage(currentPage - 1);
        }
      } catch (error) {
        console.error('Error deleting company:', error);
      } finally {
        setLoading(false);
      }
    }
  };

  const resetForm = () => {
    setShowModal(false);
    setSelectedCompany(null);
    setFormData({
      company_name: '',
      phone: '',
      address: '',
      email: '',
      is_default: false
    });
  };

  // Pagination logic
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredCompanies.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredCompanies.length / itemsPerPage);

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
    <main className="min-h-screen bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900">
      <Navbar2 />
      <div className="container mx-auto p-8">
        <div className="flex justify-between items-center mb-4">
          <div>
            <h1 className="text-3xl font-bold">Companies</h1>
            <p className="text-gray-400 mt-1">Manage your company database</p>
          </div>
          <button
            onClick={() => setShowModal(true)}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 flex items-center gap-2"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
            </svg>
            Add Company
          </button>
        </div>

        <div className="mb-6">
          <div className="relative">
            <input
              type="text"
              placeholder="Search companies..."
              value={searchQuery}
              onChange={handleSearch}
              className="w-full p-3 pl-10 bg-gray-800 dark:bg-gray-200 border border-gray-700 dark:border-gray-300 rounded-lg text-white dark:text-gray-900 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <svg className="w-5 h-5 text-gray-400 dark:text-gray-500 absolute left-3 top-1/2 transform -translate-y-1/2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
          </div>
        </div>

        {loading ? (
          <div className="text-center text-gray-400">Loading...</div>
        ) : (
          <>
            <div className="mb-4 flex gap-4 items-center">
              <label className="text-gray-300 dark:text-gray-600">Show per page:</label>
              <select
                value={itemsPerPage}
                onChange={(e) => {
                  setItemsPerPage(parseInt(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-gray-700 dark:bg-gray-200 border border-gray-600 dark:border-gray-300 rounded px-3 py-2 text-white dark:text-gray-900"
              >
                <option value={10}>10</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>
            <div className="overflow-x-auto">
              <table className="min-w-full bg-gray-800 dark:bg-white rounded-lg">
                <thead>
                  <tr className="text-gray-400 dark:text-gray-600 text-left">
                    <th className="py-3 px-4">ID</th>
                    <th className="py-3 px-4">Company Name</th>
                    <th className="py-3 px-4">Phone</th>
                    <th className="py-3 px-4">Email</th>
                    <th className="py-3 px-4">Address</th>
                    <th className="py-3 px-4">Default</th>
                    <th className="py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {currentItems.map((company, index) => (
                    <tr key={company.id} className="border-t border-gray-700 dark:border-gray-200 hover:bg-gray-700 dark:hover:bg-gray-200">
                      <td className="py-3 px-4 text-gray-300 dark:text-gray-700">{"cmp0" + (indexOfFirstItem + index + 1)}</td>
                      <td className="py-3 px-4 text-white dark:text-gray-900">{company.company_name}</td>
                      <td className="py-3 px-4 text-white dark:text-gray-900">{company.phone || '-'}</td>
                      <td className="py-3 px-4 text-white dark:text-gray-900">{company.email || '-'}</td>
                      <td className="py-3 px-4 text-white dark:text-gray-900">{company.address || '-'}</td>
                      <td className="py-3 px-4 text-white dark:text-gray-900">{company.is_default ? 'Yes' : 'No'}</td>
                      <td className="py-3 px-4">
                        <button
                          onClick={() => handleEdit(company)}
                          className="text-gray-400 dark:text-gray-700 hover:text-blue-400 dark:hover:text-blue-600 mr-3"
                        >
                          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                          </svg>
                        </button>
                        <button
                          onClick={() => handleDelete(company.id)}
                          className="text-gray-400 dark:text-gray-700 hover:text-red-400 dark:hover:text-red-600"
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
            {filteredCompanies.length > 0 && (
              <div className="mt-4 flex justify-between items-center">
                <div className="text-gray-400 dark:text-gray-600">
                  Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredCompanies.length)} of {filteredCompanies.length} entries
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => paginate(1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 dark:bg-gray-200 rounded hover:bg-gray-600 dark:hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 text-white dark:text-gray-900"
                  >
                    First
                  </button>
                  <button
                    onClick={() => paginate(currentPage - 1)}
                    disabled={currentPage === 1}
                    className="px-4 py-2 bg-gray-700 dark:bg-gray-200 rounded hover:bg-gray-600 dark:hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 text-white dark:text-gray-900"
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
                          ? 'bg-blue-500 text-white dark:text-gray-900'
                          : typeof page === 'number'
                          ? 'bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 hover:bg-gray-600 dark:hover:bg-gray-300'
                          : 'bg-gray-700 dark:bg-gray-200 text-gray-400 dark:text-gray-600 cursor-default'
                      }`}
                    >
                      {page}
                    </button>
                  ))}
                  <button
                    onClick={() => paginate(currentPage + 1)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 dark:bg-gray-200 rounded hover:bg-gray-600 dark:hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 text-white dark:text-gray-900"
                  >
                    Next
                  </button>
                  <button
                    onClick={() => paginate(totalPages)}
                    disabled={currentPage === totalPages}
                    className="px-4 py-2 bg-gray-700 dark:bg-gray-200 rounded hover:bg-gray-600 dark:hover:bg-gray-300 disabled:bg-gray-800 disabled:text-gray-500 text-white dark:text-gray-900"
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
          <div className="fixed inset-0 bg-gray-600 dark:bg-gray-100 bg-opacity-50 flex items-center justify-center">
            <div className="bg-gray-800 dark:bg-gray-200 p-6 rounded-lg w-full max-w-md text-white dark:text-gray-900">
              <h2 className="text-xl font-bold mb-4">
                {selectedCompany ? 'Edit Company' : 'Add Company'}
              </h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-600">Company Name</label>
                  <input
                    type="text"
                    name="company_name"
                    value={formData.company_name}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 dark:border-gray-300 rounded px-3 py-2 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-600">Phone</label>
                  <input
                    type="text"
                    name="phone"
                    value={formData.phone}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 dark:border-gray-300 rounded px-3 py-2 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-600">Email</label>
                  <input
                    type="email"
                    name="email"
                    value={formData.email}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 dark:border-gray-300 rounded px-3 py-2 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-600">Address</label>
                  <input
                    type="text"
                    name="address"
                    value={formData.address}
                    onChange={handleInputChange}
                    className="w-full border border-gray-700 dark:border-gray-300 rounded px-3 py-2 bg-gray-700 dark:bg-gray-200 text-white dark:text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  />
                </div>
                <div className="mb-4">
                  <label className="block text-sm font-medium mb-1 text-gray-300 dark:text-gray-600">
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
                    className="px-4 py-2 bg-gray-600 dark:bg-gray-300 rounded hover:bg-gray-500 dark:hover:bg-gray-400 text-white dark:text-gray-900"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    disabled={loading}
                    className="px-4 py-2 bg-blue-500 dark:bg-blue-600 text-white rounded hover:bg-blue-600 dark:hover:bg-blue-700 disabled:bg-blue-400 dark:disabled:bg-blue-500"
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

export default CompanyPage;