import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { useNavigate } from 'react-router-dom';

export default function SellerDashboard() {
  const navigate = useNavigate();
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    }
  });

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['seller-listings', user?.id],
    queryFn: async () => {
      const token = localStorage.getItem('jwt');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${baseUrl}/api/listings/seller/${user.id}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch listings');
      return res.json();
    },
    enabled: !!user?.id
  });

  const updateStatusMutation = useMutation({
    mutationFn: async ({ id, status }: { id: number, status: string }) => {
      const token = localStorage.getItem('jwt');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${baseUrl}/api/listings/${id}/status?status=${status}`, {
        method: 'PATCH',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to update status');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-listings'] })
  });

  const deleteMutation = useMutation({
    mutationFn: async (id: number) => {
      const token = localStorage.getItem('jwt');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${baseUrl}/api/listings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to delete listing');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['seller-listings'] })
  });

  const getStatusColor = (status: string) => {
    switch(status) {
      case 'ACTIVE': return 'bg-emerald-100 text-emerald-800 border-emerald-200';
      case 'PENDING': return 'bg-amber-100 text-amber-800 border-amber-200';
      case 'SOLD': return 'bg-slate-200 text-slate-800 border-slate-300';
      case 'DELETED': return 'bg-red-100 text-red-800 border-red-200';
      default: return 'bg-slate-100 text-slate-800 border-slate-200';
    }
  };

  const activeListings = listings.filter((l: any) => l.status !== 'DELETED');

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      <nav className="sticky top-0 w-full bg-white border-b border-slate-200 z-50 px-6 py-3 flex items-center shadow-sm">
        <button onClick={() => navigate('/marketplace')} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors mr-4">
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <h1 className="font-extrabold text-xl text-slate-900">Your Listings</h1>
      </nav>

      <div className="max-w-4xl mx-auto pt-8 px-4 sm:px-6">
        {isLoading ? (
          <div className="flex justify-center py-20"><div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div></div>
        ) : activeListings.length === 0 ? (
          <div className="bg-white rounded-3xl p-12 text-center border border-slate-200 shadow-sm mt-10">
            <h2 className="text-2xl font-bold text-slate-900 mb-2">No active listings</h2>
            <p className="text-slate-500 mb-6">You haven't posted any items yet, or they've all been deleted.</p>
            <button onClick={() => navigate('/marketplace/create')} className="px-6 py-3 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
              Create a Listing
            </button>
          </div>
        ) : (
          <div className="space-y-6">
            {activeListings.map((item: any) => (
              <div key={item.id} className="bg-white rounded-2xl border border-slate-200 p-6 flex flex-col md:flex-row gap-6 shadow-sm hover:shadow-md transition-shadow">
                <div className="w-full md:w-48 h-32 bg-slate-100 rounded-xl overflow-hidden shrink-0 cursor-pointer" onClick={() => navigate(`/marketplace/item/${item.id}`)}>
                  {item.images && item.images.length > 0 ? (
                    <img src={item.images[0].imageUrl} alt={item.title} className="w-full h-full object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">No Image</div>
                  )}
                </div>
                
                <div className="flex-1 flex flex-col justify-between">
                  <div>
                    <div className="flex justify-between items-start mb-2">
                      <h3 className="font-extrabold text-xl text-slate-900 line-clamp-1 cursor-pointer hover:underline" onClick={() => navigate(`/marketplace/item/${item.id}`)}>{item.title}</h3>
                      <span className={`px-3 py-1 text-xs font-bold rounded-full border ${getStatusColor(item.status)}`}>
                        {item.status}
                      </span>
                    </div>
                    <p className="font-black text-slate-700 text-lg mb-2">₹{item.price}</p>
                    <p className="text-slate-500 text-sm line-clamp-2">{item.description}</p>
                  </div>
                  
                  <div className="mt-4 flex flex-wrap gap-3">
                    {item.status !== 'SOLD' && (
                      <select 
                        value={item.status}
                        onChange={(e) => updateStatusMutation.mutate({ id: item.id, status: e.target.value })}
                        disabled={updateStatusMutation.isPending}
                        className="px-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm font-bold text-slate-700 outline-none hover:bg-slate-100 transition-colors cursor-pointer"
                      >
                        <option value="ACTIVE">Mark Active</option>
                        <option value="PENDING">Mark Pending</option>
                        <option value="SOLD">Mark Sold</option>
                      </select>
                    )}
                    
                    <button 
                      onClick={() => {
                        if (confirm('Are you sure you want to delete this listing?')) {
                          deleteMutation.mutate(item.id);
                        }
                      }}
                      disabled={deleteMutation.isPending}
                      className="px-4 py-2 bg-red-50 text-red-600 font-bold text-sm rounded-lg hover:bg-red-100 transition-colors ml-auto"
                    >
                      Delete
                    </button>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
