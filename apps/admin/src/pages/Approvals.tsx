import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Check, X } from 'lucide-react';

export default function Approvals() {
  const queryClient = useQueryClient();
  const token = localStorage.getItem('jwt');
  const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const { data: listings = [], isLoading } = useQuery({
    queryKey: ['pending-listings'],
    queryFn: async () => {
      const res = await fetch(`${API_URL}/api/admin/listings/pending`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch pending listings');
      return res.json();
    }
  });

  const approveListing = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/admin/listings/${id}/approve`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to approve');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-listings'] })
  });

  const rejectListing = useMutation({
    mutationFn: async (id: number) => {
      const res = await fetch(`${API_URL}/api/admin/listings/${id}/reject`, {
        method: 'PUT',
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to reject');
    },
    onSuccess: () => queryClient.invalidateQueries({ queryKey: ['pending-listings'] })
  });

  if (isLoading) return <div className="p-8 text-center text-slate-500 font-medium">Loading pending listings...</div>;

  return (
    <div>
      <h1 className="text-3xl font-black text-slate-900 mb-8">Listing Approvals</h1>
      
      {listings.length === 0 ? (
        <div className="bg-white border border-slate-200 rounded-2xl p-12 text-center shadow-sm">
          <Check className="w-16 h-16 text-slate-300 mx-auto mb-4" />
          <h2 className="text-xl font-bold text-slate-900 mb-2">All caught up!</h2>
          <p className="text-slate-500 font-medium">There are no listings waiting for approval.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {listings.map((listing: any) => (
            <div key={listing.id} className="bg-white rounded-2xl border border-slate-200 overflow-hidden shadow-sm flex flex-col">
              <div className="aspect-[4/3] bg-slate-100 relative">
                {listing.images && listing.images.length > 0 ? (
                  <img src={listing.images[0].imageUrl} alt={listing.title} className="w-full h-full object-cover" />
                ) : (
                  <div className="w-full h-full flex items-center justify-center text-slate-400 font-medium">No Image</div>
                )}
                <div className="absolute top-3 right-3 bg-white/90 px-3 py-1 rounded-lg shadow-sm font-bold text-slate-900">
                  ₹{listing.price.toFixed(2)}
                </div>
              </div>
              <div className="p-5 flex-1 flex flex-col">
                <h3 className="font-bold text-lg text-slate-900 mb-1 line-clamp-1">{listing.title}</h3>
                <p className="text-sm text-slate-500 mb-4">By {listing.seller?.realName}</p>
                <div className="flex gap-2 mt-auto">
                  <button 
                    onClick={() => rejectListing.mutate(listing.id)}
                    disabled={rejectListing.isPending || approveListing.isPending}
                    className="flex-1 py-2.5 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all flex items-center justify-center gap-2 border border-slate-200 disabled:opacity-50"
                  >
                    <X className="w-4 h-4" /> 
                    <span>{rejectListing.isPending && (rejectListing.variables as unknown as number) === listing.id ? 'Rejecting...' : 'Reject'}</span>
                  </button>
                  <button 
                    onClick={() => approveListing.mutate(listing.id)}
                    disabled={approveListing.isPending || rejectListing.isPending}
                    className="flex-1 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 active:scale-95 transition-all flex items-center justify-center gap-2 shadow-sm disabled:opacity-50"
                  >
                    <Check className="w-4 h-4" /> 
                    <span>{approveListing.isPending && (approveListing.variables as unknown as number) === listing.id ? 'Approving...' : 'Approve'}</span>
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
