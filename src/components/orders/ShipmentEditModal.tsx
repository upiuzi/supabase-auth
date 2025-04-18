
import { useEffect, useState } from 'react';



import { Order, Company, BankAccount } from '../../type/schema';

interface ShipmentEditModalProps {
  show: boolean;
  loading: boolean;
  order: Order | null;
  companies: Company[];
  bankAccounts: BankAccount[];
  onClose: () => void;
  onSave: (
    orderId: string,
    expedition: string,
    description: string,
    companyId: string,
    bankAccountId: string
  ) => Promise<void>;
}

const ShipmentEditModal: React.FC<ShipmentEditModalProps> = ({
  show,
  loading,
  order,
  companies,
  bankAccounts,
  onClose,
  onSave,
}) => {
  const [expedition, setExpedition] = useState('');
  const [description, setDescription] = useState('');
  const [companyId, setCompanyId] = useState('');
  const [bankAccountId, setBankAccountId] = useState('');
  const [error, setError] = useState<string | null>(null);

  // Initialize form fields when order changes
  useEffect(() => {
    if (order) {
      setExpedition(order.expedition || '');
      setDescription(order.description || '');
      setCompanyId(order.company_id || '');
      setBankAccountId(order.bank_account_id || '');
      setError(null);
    }
  }, [order]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!order) return;

    // Validate required fields
    if (!expedition.trim()) {
      setError('Expedition is required');
      return;
    }
    if (!companyId) {
      setError('Company is required');
      return;
    }
    if (!bankAccountId) {
      setError('Bank Account is required');
      return;
    }

    try {
      await onSave(order.id, expedition, description, companyId, bankAccountId);
      onClose();
    } catch (error) {
      console.error('Error saving shipment details:', error);
      setError('Failed to save shipment details. Please try again.');
    }
  };

  if (!show) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
      <div className="bg-gray-800 rounded-lg p-6 w-full max-w-md text-white">
        <h2 className="text-xl font-bold mb-4">Edit Shipment Details</h2>
        {error && (
          <div className="mb-4 p-2 bg-red-900 text-red-200 rounded" role="alert">
            {error}
          </div>
        )}
        <form onSubmit={handleSubmit}>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="expedition">
              Expedition
            </label>
            <input
              id="expedition"
              type="text"
              value={expedition}
              onChange={(e) => setExpedition(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              aria-required="true"
            />
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="company">
              Company
            </label>
            <select
              id="company"
              value={companyId}
              onChange={(e) => setCompanyId(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              aria-required="true"
            >
              <option value="">Select a company</option>
              {companies.map((company) => (
                <option key={company.id} value={company.id}>
                  {company.company_name}
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="bankAccount">
              Bank Account
            </label>
            <select
              id="bankAccount"
              value={bankAccountId}
              onChange={(e) => setBankAccountId(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              disabled={loading}
              aria-required="true"
            >
              <option value="">Select a bank account</option>
              {bankAccounts.map((bankAccount) => (
                <option key={bankAccount.id} value={bankAccount.id}>
                  {bankAccount.account_name} ({bankAccount.bank_name})
                </option>
              ))}
            </select>
          </div>
          <div className="mb-4">
            <label className="block text-gray-300 mb-2" htmlFor="description">
              Description
            </label>
            <textarea
              id="description"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full p-2 bg-gray-700 border border-gray-600 rounded text-white focus:outline-none focus:ring-2 focus:ring-blue-500"
              rows={4}
              disabled={loading}
            />
          </div>
          <div className="flex justify-end gap-2">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 bg-gray-600 text-white rounded hover:bg-gray-500 disabled:bg-gray-400"
              disabled={loading}
              aria-label="Cancel editing shipment details"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-500 text-white rounded hover:bg-blue-600 disabled:bg-blue-300"
              disabled={loading}
              aria-label="Save shipment details"
            >
              {loading ? 'Saving...' : 'Save'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default ShipmentEditModal;
