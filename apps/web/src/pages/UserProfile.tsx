import { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import type { Listing } from '@campuscart/types';

interface User {
  id: number;
  preferredName: string;
  realName: string;
  avatarUrl: string;
  about: string;
  createdAt: string;
}

export default function UserProfile() {
  const { userId } = useParams();
  const navigate = useNavigate();
  const [user, setUser] = useState<User | null>(null);
  const [isEditing, setIsEditing] = useState(false);
  const [editAbout, setEditAbout] = useState("");
  const [wishlist, setWishlist] = useState<Listing[]>([]);

  // Check if we are viewing our own profile based on URL
  const isOwnProfile = !userId || userId === 'me' || window.location.pathname.includes('edit');

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    if (isOwnProfile) {
      // Fetch our own profile
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditAbout(data.about || "");
      })
      .catch(console.error);

      // Fetch wishlist
      fetch(`${API_URL}/api/wishlist`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => setWishlist(data))
      .catch(console.error);
    } else {
      // Fetch another user's profile
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      fetch(`${API_URL}/api/users/${userId}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditAbout(data.about || "");
      })
      .catch(console.error);
    }
  }, [userId, isOwnProfile]);

  const handleSave = async () => {
    const token = localStorage.getItem('jwt');
    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/users/me/about`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ about: editAbout })
      });
      if (res.ok) {
        const updatedUser = await res.json();
        setUser(updatedUser);
      }
    } catch (err) {
      console.error(err);
    }
    setIsEditing(false);
  };

  if (!user) return <div className="p-8 text-center font-semibold text-slate-500">Loading profile...</div>;

  return (
    <div className="min-h-screen bg-slate-50 py-12 px-4 selection:bg-slate-200">
      <div className="max-w-4xl mx-auto">
        
        <div className="flex items-center justify-between mb-6">
           <button onClick={() => navigate('/marketplace')} className="flex items-center gap-2 text-slate-500 hover:text-slate-900 font-semibold transition-colors">
             <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
             Back to Marketplace
           </button>
           
           {isOwnProfile && !isEditing && (
             <div className="flex items-center gap-3">
               <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-slate-200 text-slate-900 font-bold rounded-full hover:bg-slate-300 transition-colors">
                 Edit Profile
               </button>
               <button 
                 onClick={() => {
                   localStorage.removeItem('jwt');
                   navigate('/login');
                 }}
                 className="px-5 py-2 bg-red-50 text-red-600 font-bold rounded-full hover:bg-red-100 transition-colors"
               >
                 Log Out
               </button>
             </div>
           )}
        </div>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-100 overflow-hidden shrink-0 border-4 border-white shadow-md flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <span className="text-5xl font-extrabold text-slate-300">{user.realName.charAt(0)}</span>
            )}
          </div>

          <div className="flex-1 w-full">
            <h1 className="text-3xl md:text-4xl font-extrabold text-slate-900 mb-2">{user.preferredName || user.realName}</h1>
            <p className="text-slate-500 font-medium mb-6">Joined {new Date(user.createdAt).getFullYear()}</p>
            
            <div className="bg-slate-50 rounded-2xl p-6 md:p-8 border border-slate-100">
              <h2 className="text-sm font-bold text-slate-900 uppercase tracking-widest mb-4">About</h2>
              
              {isEditing ? (
                <div className="space-y-4">
                  <textarea 
                    value={editAbout}
                    onChange={(e) => setEditAbout(e.target.value)}
                    rows={4}
                    className="w-full p-4 bg-white border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 resize-none text-slate-700"
                    placeholder="Tell your campus a bit about yourself..."
                  />
                  <div className="flex gap-3">
                    <button onClick={handleSave} className="px-6 py-2.5 bg-slate-900 text-white font-bold rounded-xl hover:bg-slate-800 transition-colors">
                      Save Bio
                    </button>
                    <button onClick={() => setIsEditing(false)} className="px-6 py-2.5 bg-slate-200 text-slate-700 font-bold rounded-xl hover:bg-slate-300 transition-colors">
                      Cancel
                    </button>
                  </div>
                </div>
              ) : (
                <p className="text-slate-700 leading-relaxed font-medium">
                  {user.about || <span className="italic text-slate-400">This user hasn't written a bio yet.</span>}
                </p>
              )}
            </div>
          </div>
        </div>

        {isOwnProfile ? (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6">Your Wishlist</h2>
            {wishlist.length === 0 ? (
              <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
                 <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                 </svg>
                 <p className="text-slate-500 font-medium">Your wishlist is currently empty.</p>
                 <button onClick={() => navigate('/marketplace')} className="mt-4 text-slate-900 font-bold hover:underline">Explore Marketplace</button>
              </div>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
                {wishlist.map(item => (
                  <div key={item.id} className="group cursor-pointer flex flex-col" onClick={() => navigate(`/marketplace/item/${item.id}`)}>
                    <div className="aspect-square bg-slate-100 rounded-2xl mb-3 overflow-hidden border border-slate-200/50 relative">
                      {item.images && item.images.length > 0 ? (
                        <img 
                          src={item.images[0].imageUrl} 
                          alt={item.title} 
                          className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" 
                          onError={(e) => { e.currentTarget.src = 'https://placehold.co/400x400/e2e8f0/475569?text=No+Image'; }}
                        />
                      ) : (
                        <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                          <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                          <span className="text-xs font-medium">No Image</span>
                        </div>
                      )}
                      <div className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm text-red-500 fill-red-500 z-10">
                         <svg className="w-5 h-5 fill-red-500" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={0}>
                           <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                         </svg>
                      </div>
                    </div>
                    <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1">₹{item.price}</h3>
                    <p className="text-slate-700 font-medium truncate mb-1">{item.title}</p>
                    <p className="text-slate-400 text-xs font-medium">{item.seller?.preferredName || item.seller?.realName}</p>
                  </div>
                ))}
              </div>
            )}
          </>
        ) : (
          <>
            <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6">Active Listings</h2>
            <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
               <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
               </svg>
               <p className="text-slate-500 font-medium">This user has no active listings.</p>
            </div>
          </>
        )}
      </div>
    </div>
  );
}
