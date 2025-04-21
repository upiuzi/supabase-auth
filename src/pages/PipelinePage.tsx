import { useEffect, useState } from 'react';
import Navbar2 from '../components/Navbar2';
import { Pipeline } from '../type/schema';
import { getPipelines, createPipeline, updatePipeline, deletePipeline } from '../services/supabaseService';

const statuses: Pipeline['status'][] = ['Prospect', 'Contacted', 'Negotiation', 'Won', 'Lost'];

const PipelinePage = () => {
  const [pipelines, setPipelines] = useState<Pipeline[]>([]);
  const [customers, setCustomers] = useState<{ id: string; name: string }[]>([]);
  const [products, setProducts] = useState<{ id: string; name: string }[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editPipeline, setEditPipeline] = useState<Pipeline | null>(null);
  const [formData, setFormData] = useState<{
    customer_id: string;
    product_id: string | null;
    status: Pipeline['status'];
    notes: string;
  }>({
    customer_id: '',
    product_id: null,
    status: 'Prospect',
    notes: ''
  });

  const fetchPipelines = async () => {
    try {
      const data = await getPipelines();
      setPipelines(data);
    } catch (error) {
      console.error('Error fetching pipelines:', error);
    }
  };

  const fetchCustomersAndProducts = async () => {
    try {
      const [customerData, productData] = await Promise.all([
        (await import('../services/supabaseService')).getCustomers(),
        (await import('../services/supabaseService')).getProducts()
      ]);
      setCustomers(customerData.map(c => ({ id: c.id, name: c.name })));
      setProducts(productData.map(p => ({ id: p.id, name: p.name })));
    } catch (error) {
      console.error('Error fetching customers/products:', error);
    }
  };

  useEffect(() => {
    fetchPipelines();
    fetchCustomersAndProducts();
  }, []);

  return (
    <>
    <div style={{backgroundColor: '#f3f4f6'}}>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen bg-gray-100 text-gray-900">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Pipeline Kanban Board</h1>
          <button
            onClick={() => {
              setEditPipeline(null);
              setFormData({
                customer_id: '',
                product_id: null,
                status: 'Prospect',
                notes: ''
              });
              setShowModal(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600 shadow"
          >
            Add Prospect
          </button>
        </div>
        <div className="flex gap-4 overflow-x-auto">
          {statuses.map((status) => (
            <div
              key={status}
              className="flex-1 min-w-[250px] bg-white rounded-xl p-4 shadow ring-1 ring-gray-200"
              onDragOver={(e) => e.preventDefault()}
              onDrop={async (e) => {
                e.preventDefault();
                const pipelineId = e.dataTransfer.getData('text/plain');
                try {
                  await updatePipeline(pipelineId, { status });
                  fetchPipelines();
                } catch (error) {
                  console.error('Error updating pipeline status:', error);
                }
              }}
            >
              <h2 className="text-xl font-semibold mb-4">{status}</h2>
              <div className="flex flex-col gap-4">
                {pipelines
                  .filter((p) => p.status === status)
                  .map((p) => (
                    <div
                      key={p.id}
                      className="bg-gray-100 p-3 rounded shadow border border-gray-200 text-gray-900"
                      draggable
                      onDragStart={(e) => {
                        e.dataTransfer.setData('text/plain', p.id);
                      }}
                    >
                      <h3 className="font-bold text-gray-900">{p.customer?.name}</h3>
                      <p className="text-sm text-gray-700">{p.product?.name}</p>
                      <p className="text-xs text-gray-500 mt-1">{p.notes}</p>
                      <div className="flex gap-2 mt-2">
                        <button
                          onClick={() => {
                            setEditPipeline(p);
                            setFormData({
                              customer_id: p.customer_id,
                              product_id: p.product_id,
                              status: p.status,
                              notes: p.notes || ''
                            });
                            setShowModal(true);
                          }}
                          className="px-2 py-1 bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                        >
                          Edit
                        </button>
                        <button
                          onClick={async () => {
                            if (window.confirm('Delete this pipeline?')) {
                              await deletePipeline(p.id);
                              fetchPipelines();
                            }
                          }}
                          className="px-2 py-1 bg-red-100 text-red-700 rounded hover:bg-red-200"
                        >
                          Delete
                        </button>
                      </div>
                    </div>
                  ))}
              </div>
            </div>
          ))}
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-30 flex items-center justify-center z-50">
          <div className="bg-white p-6 rounded-xl w-full max-w-md text-gray-900 shadow-lg">
            <h2 className="text-xl font-bold mb-4">{editPipeline ? 'Edit Prospect' : 'Add Prospect'}</h2>
            <form
              onSubmit={async (e) => {
                e.preventDefault();
                try {
                  if (editPipeline) {
                    await updatePipeline(editPipeline.id, formData);
                  } else {
                    await createPipeline(formData);
                  }
                  setShowModal(false);
                  setEditPipeline(null);
                  fetchPipelines();
                } catch (error) {
                  console.error('Error saving pipeline:', error);
                }
              }}
            >
              <div className="mb-4">
                <label className="block mb-1 text-gray-700">Customer</label>
                <select
                  value={formData.customer_id}
                  onChange={(e) => setFormData({ ...formData, customer_id: e.target.value })}
                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                  required
                >
                  <option value="">Select Customer</option>
                  {customers.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-gray-700">Product</label>
                <select
                  value={formData.product_id || ''}
                  onChange={(e) => setFormData({ ...formData, product_id: e.target.value || null })}
                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                >
                  <option value="">Select Product</option>
                  {products.map((p) => (
                    <option key={p.id} value={p.id}>
                      {p.name}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-gray-700">Status</label>
                <select
                  value={formData.status}
                  onChange={(e) => setFormData({ ...formData, status: e.target.value as Pipeline['status'] })}
                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                >
                  {statuses.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
              </div>
              <div className="mb-4">
                <label className="block mb-1 text-gray-700">Notes</label>
                <textarea
                  value={formData.notes}
                  onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                  className="w-full p-2 rounded bg-white border border-gray-300 text-gray-900"
                />
              </div>
              <div className="flex justify-end gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowModal(false);
                    setEditPipeline(null);
                  }}
                  className="px-4 py-2 bg-gray-200 rounded hover:bg-gray-300 text-gray-900"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600 text-white"
                >
                  Save
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

export default PipelinePage;
