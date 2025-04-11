import { useEffect, useState } from 'react';
import Navbar2 from '../components/Navbar2';

interface Exhibition {
  id: string;
  name: string;
  website?: string;
  address?: string;
  date_event?: string;
  country?: string;
  description?: string;
}

const ExhibitionPage = () => {
  const [exhibitions, setExhibitions] = useState<Exhibition[]>([]);
  const [showModal, setShowModal] = useState(false);
  const [editExhibition, setEditExhibition] = useState<Exhibition | null>(null);
  const [formData, setFormData] = useState<Omit<Exhibition, 'id'>>({
    name: '',
    website: '',
    address: '',
    date_event: '',
    country: '',
    description: ''
  });

  const fetchExhibitions = async () => {
    try {
      const res = await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/exhibitions?select=*`, {
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      const data = await res.json();
      setExhibitions(data);
    } catch (error) {
      console.error('Error fetching exhibitions:', error);
    }
  };

  useEffect(() => {
    fetchExhibitions();
  }, []);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      if (editExhibition) {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/exhibitions?id=eq.${editExhibition.id}`, {
          method: 'PATCH',
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      } else {
        await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/exhibitions`, {
          method: 'POST',
          headers: {
            apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
            Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(formData)
        });
      }
      setShowModal(false);
      setEditExhibition(null);
      setFormData({
        name: '',
        website: '',
        address: '',
        date_event: '',
        country: '',
        description: ''
      });
      fetchExhibitions();
    } catch (error) {
      console.error('Error saving exhibition:', error);
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this exhibition?')) return;
    try {
      await fetch(`${import.meta.env.VITE_SUPABASE_URL}/rest/v1/exhibitions?id=eq.${id}`, {
        method: 'DELETE',
        headers: {
          apikey: import.meta.env.VITE_SUPABASE_ANON_KEY,
          Authorization: `Bearer ${import.meta.env.VITE_SUPABASE_ANON_KEY}`
        }
      });
      fetchExhibitions();
    } catch (error) {
      console.error('Error deleting exhibition:', error);
    }
  };

  return (
    <>
      <Navbar2 />
      <div className="container mx-auto p-6 min-h-screen text-white">
        <div className="flex justify-between items-center mb-6">
          <h1 className="text-3xl font-bold">Exhibitions</h1>
          <button
            onClick={() => {
              setEditExhibition(null);
              setFormData({
                name: '',
                website: '',
                address: '',
                date_event: '',
                country: '',
                description: ''
              });
              setShowModal(true);
            }}
            className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
          >
            Add Exhibition
          </button>
        </div>

        <div className="overflow-x-auto">
          <table className="min-w-full bg-gray-800 rounded-lg">
            <thead>
              <tr className="text-gray-400 text-left">
                <th className="py-3 px-4">Name</th>
                <th className="py-3 px-4">Website</th>
                <th className="py-3 px-4">Address</th>
                <th className="py-3 px-4">Date</th>
                <th className="py-3 px-4">Country</th>
                <th className="py-3 px-4">Description</th>
                <th className="py-3 px-4">Actions</th>
              </tr>
            </thead>
            <tbody>
              {exhibitions.map((ex) => (
                <tr key={ex.id} className="border-t border-gray-700 hover:bg-gray-700">
                  <td className="py-3 px-4">{ex.name}</td>
                  <td className="py-3 px-4">{ex.website}</td>
                  <td className="py-3 px-4">{ex.address}</td>
                  <td className="py-3 px-4">{ex.date_event}</td>
                  <td className="py-3 px-4">{ex.country}</td>
                  <td className="py-3 px-4">{ex.description}</td>
                  <td className="py-3 px-4 flex gap-2">
                    <button
                      onClick={() => {
                        setEditExhibition(ex);
                        setFormData({
                          name: ex.name,
                          website: ex.website || '',
                          address: ex.address || '',
                          date_event: ex.date_event || '',
                          country: ex.country || '',
                          description: ex.description || ''
                        });
                        setShowModal(true);
                      }}
                      className="text-blue-400 hover:text-blue-300 text-sm"
                    >
                      Edit
                    </button>
                    <button
                      onClick={() => handleDelete(ex.id)}
                      className="text-red-400 hover:text-red-300 text-sm"
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {showModal && (
          <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50">
            <div className="bg-gray-800 p-6 rounded-lg w-full max-w-md text-white">
              <h2 className="text-xl font-bold mb-4">{editExhibition ? 'Edit Exhibition' : 'Add Exhibition'}</h2>
              <form onSubmit={handleSubmit}>
                <div className="mb-4">
                  <label className="block mb-1">Name</label>
                  <input
                    type="text"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                    required
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Website</label>
                  <input
                    type="text"
                    value={formData.website}
                    onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Address</label>
                  <textarea
                    value={formData.address}
                    onChange={(e) => setFormData({ ...formData, address: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Date Event</label>
                  <input
                    type="date"
                    value={formData.date_event}
                    onChange={(e) => setFormData({ ...formData, date_event: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Country</label>
                  <input
                    type="text"
                    value={formData.country}
                    onChange={(e) => setFormData({ ...formData, country: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div className="mb-4">
                  <label className="block mb-1">Description</label>
                  <textarea
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    className="w-full p-2 rounded bg-gray-700 border border-gray-600"
                  />
                </div>
                <div className="flex justify-end gap-2">
                  <button
                    type="button"
                    onClick={() => setShowModal(false)}
                    className="px-4 py-2 bg-gray-600 rounded hover:bg-gray-500"
                  >
                    Cancel
                  </button>
                  <button
                    type="submit"
                    className="px-4 py-2 bg-blue-500 rounded hover:bg-blue-600"
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

export default ExhibitionPage;
