import { useState, useEffect } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useInfiniteQuery, useMutation, useQueryClient } from '@tanstack/react-query';


function useDebounce<T>(value: T, delay: number): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);
  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);
    return () => clearTimeout(handler);
  }, [value, delay]);
  return debouncedValue;
}

export default function Marketplace() {
  const navigate = useNavigate();
  const { id: category } = useParams();

  const [searchQuery, setSearchQuery] = useState('');
  const debouncedSearch = useDebounce(searchQuery, 500);
  const [minPrice, setMinPrice] = useState('');
  const [maxPrice, setMaxPrice] = useState('');
  const [condition, setCondition] = useState('');
  const [dateListed, setDateListed] = useState('');
  const [sortBy, setSortBy] = useState('newest');

  const queryClient = useQueryClient();
  const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';

  const { data: wishlistIds = [] } = useQuery<number[]>({
    queryKey: ['wishlistIds'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt');
      if (!token) return [];
      const res = await fetch(`${baseUrl}/api/wishlist/ids`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('jwt');
        navigate('/login');
        return [];
      }
      if (!res.ok) return [];
      return res.json();
    }
  });

  const toggleWishlist = useMutation({
    mutationFn: async ({ listingId, isSaved }: { listingId: number, isSaved: boolean }) => {
      const token = localStorage.getItem('jwt');
      const method = isSaved ? 'DELETE' : 'POST';
      const res = await fetch(`${baseUrl}/api/wishlist/${listingId}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to toggle wishlist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistIds'] });
    }
  });

  const { 
    data: listingsData, 
    isLoading: loading,
    fetchNextPage,
    hasNextPage,
    isFetchingNextPage
  } = useInfiniteQuery({
    queryKey: ['listings', category || 'all', debouncedSearch, minPrice, maxPrice, condition, dateListed, sortBy],
    initialPageParam: 0,
    queryFn: async ({ pageParam = 0 }) => {
      const token = localStorage.getItem('jwt');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const endpoint = category 
        ? `${baseUrl}/api/listings/category/${category}`
        : `${baseUrl}/api/listings`;

      const params = new URLSearchParams();
      if (debouncedSearch) params.append('q', debouncedSearch);
      if (minPrice) params.append('minPrice', minPrice);
      if (maxPrice) params.append('maxPrice', maxPrice);
      if (condition) params.append('condition', condition);
      if (dateListed) params.append('days', dateListed);
      if (sortBy) params.append('sortBy', sortBy);
      params.append('page', pageParam.toString());
      params.append('size', '12');

      const url = params.toString() ? `${endpoint}?${params.toString()}` : endpoint;

      const res = await fetch(url, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('jwt');
        navigate('/login');
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Failed to fetch listings');
      return res.json();
    },
    getNextPageParam: (lastPage, allPages) => {
      if (lastPage.last) return undefined;
      return allPages.length;
    }
  });

  const allListings = listingsData?.pages.flatMap(page => page.content) || [];

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt');
      const baseUrl = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${baseUrl}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (res.status === 401) {
        localStorage.removeItem('jwt');
        navigate('/login');
        throw new Error('Unauthorized');
      }
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    }
  });

  const listings = allListings.filter(item => !user || item.seller?.id !== user.id);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <nav className="sticky top-0 w-full bg-white border-b border-slate-200 z-50 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigate('/marketplace')} 
            className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer"
          >
             <span className="text-white font-bold text-xl">C</span>
          </div>
          <div className="relative hidden md:block">
            <svg className="w-5 h-5 absolute left-3 top-2.5 text-slate-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
            </svg>
            <input 
              type="text" 
              placeholder="Search CampusCart..." 
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full w-64 focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/marketplace/create')}
            className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 active:scale-95 transition-all shadow-sm"
          >
            Sell Item
          </button>
          <div 
            className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full cursor-pointer hover:bg-slate-200 active:scale-90 transition-all flex items-center justify-center" 
            onClick={() => navigate('/marketplace/you/selling')}
            title="Seller Dashboard"
          >
             <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div 
            className="w-10 h-10 bg-slate-200 rounded-full cursor-pointer hover:bg-slate-300 active:scale-90 transition-all flex items-center justify-center overflow-hidden border border-slate-300" 
            onClick={() => navigate('/profile/edit')}
            title="Your Profile"
          >
            {user?.avatarUrl ? (
              <img src={user.avatarUrl} alt="Profile" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
            ) : (
              <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
              </svg>
            )}
          </div>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto pt-6 px-4 gap-8">
        {/* Sidebar Categories */}
        <aside className="w-64 hidden lg:block shrink-0 sticky top-24 self-start">
          <h2 className="font-bold text-lg mb-4 text-slate-900">Categories</h2>
          <ul className="space-y-1 text-slate-600 font-medium text-sm">
            <li 
              onClick={() => navigate('/marketplace')}
              className={`px-4 py-3 rounded-xl cursor-pointer transition-colors ${!category ? 'bg-slate-200/60 text-slate-900 font-bold' : 'hover:bg-slate-100'}`}>
              All Listings
            </li>
            {['TEXTBOOKS', 'ELECTRONICS', 'FURNITURE', 'TICKETS', 'CLOTHING', 'OTHER'].map(cat => (
              <li 
                key={cat}
                onClick={() => navigate(`/marketplace/category/${cat}`)}
                className={`px-4 py-3 rounded-xl cursor-pointer transition-colors capitalize ${category === cat ? 'bg-slate-200/60 text-slate-900 font-bold' : 'hover:bg-slate-100'}`}>
                {cat.toLowerCase()}
              </li>
            ))}
          </ul>
        </aside>

        {/* Feed */}
        <main className="flex-1 pb-20">
          <div className="flex flex-col xl:flex-row xl:items-center justify-between mb-6 gap-4">
            <h2 className="font-bold text-2xl text-slate-900">Today's Picks</h2>
            
            {/* Filters & Sort */}
            <div className="flex flex-wrap items-center gap-3">
               <select 
                 value={sortBy} 
                 onChange={(e) => setSortBy(e.target.value)}
                 className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2 cursor-pointer"
               >
                 <option value="newest">Newest First</option>
                 <option value="oldest">Oldest First</option>
                 <option value="price_asc">Price: Low to High</option>
                 <option value="price_desc">Price: High to Low</option>
               </select>

               <select 
                 value={condition} 
                 onChange={(e) => setCondition(e.target.value)}
                 className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2 cursor-pointer"
               >
                 <option value="">Any Condition</option>
                 <option value="NEW">New</option>
                 <option value="LIKE_NEW">Like New</option>
                 <option value="GOOD">Good</option>
                 <option value="FAIR">Fair</option>
                 <option value="POOR">Poor</option>
               </select>

               <select 
                 value={dateListed} 
                 onChange={(e) => setDateListed(e.target.value)}
                 className="bg-white border border-slate-200 text-sm rounded-lg focus:ring-slate-500 focus:border-slate-500 block p-2 cursor-pointer"
               >
                 <option value="">Any Time</option>
                 <option value="1">Last 24 Hours</option>
                 <option value="7">Last 7 Days</option>
                 <option value="30">Last 30 Days</option>
               </select>

               <div className="flex items-center gap-2 bg-white border border-slate-200 rounded-lg px-2 py-1">
                 <span className="text-slate-500 text-sm">₹</span>
                 <input 
                   type="number" 
                   placeholder="Min" 
                   value={minPrice}
                   onChange={(e) => setMinPrice(e.target.value)}
                   className="w-16 p-1 text-sm focus:outline-none"
                 />
                 <span className="text-slate-300">-</span>
                 <input 
                   type="number" 
                   placeholder="Max" 
                   value={maxPrice}
                   onChange={(e) => setMaxPrice(e.target.value)}
                   className="w-16 p-1 text-sm focus:outline-none"
                 />
               </div>
            </div>
          </div>
          
          {loading ? (
             <div className="flex justify-center items-center h-40">
               <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-slate-900"></div>
             </div>
          ) : listings.length === 0 ? (
             <div className="text-center py-20 bg-white rounded-2xl border border-slate-200 shadow-sm flex flex-col items-center justify-center">
                <svg className="w-16 h-16 text-slate-300 mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                <p className="text-slate-500 font-medium mb-4">No items listed on your campus yet.</p>
                <button onClick={() => navigate('/marketplace/create')} className="text-slate-900 font-bold hover:underline">Be the first to sell something!</button>
             </div>
          ) : (
            <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 xl:grid-cols-4 gap-6">
              {listings.map(item => (
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
                    
                    {/* Favorite Button */}
                    <button 
                      onClick={(e) => {
                        e.stopPropagation();
                        toggleWishlist.mutate({ listingId: item.id, isSaved: wishlistIds.includes(item.id) });
                      }}
                      className="absolute top-3 right-3 p-2 bg-white/80 backdrop-blur-sm rounded-full shadow-sm hover:bg-white active:scale-90 transition-all"
                    >
                      <svg className={`w-5 h-5 transition-all ${wishlistIds.includes(item.id) ? 'text-red-500 fill-red-500 animate-heart-pop' : 'text-slate-400 fill-transparent'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={wishlistIds.includes(item.id) ? 0 : 2}>
                        <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                      </svg>
                    </button>
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1">₹{item.price}</h3>
                  <p className="text-slate-700 font-medium truncate mb-1">{item.title}</p>
                  <p className="text-slate-400 text-xs font-medium">{item.seller?.preferredName || item.seller?.realName}</p>
                </div>
              ))}
            </div>
          )}
          
          {hasNextPage && (
            <div className="flex justify-center mt-8">
              <button 
                onClick={() => fetchNextPage()} 
                disabled={isFetchingNextPage}
                className="px-6 py-3 bg-white border border-slate-200 text-slate-700 font-bold rounded-full hover:bg-slate-50 active:scale-95 transition-all shadow-sm disabled:opacity-50 flex items-center gap-2"
              >
                {isFetchingNextPage && (
                  <svg className="animate-spin h-4 w-4 text-slate-700" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{isFetchingNextPage ? 'Loading more...' : 'Load More'}</span>
              </button>
            </div>
          )}
        </main>
      </div>
      
      {/* Floating Inbox Button */}
      <button 
        onClick={() => navigate('/marketplace/inbox')}
        className="fixed bottom-8 right-8 bg-indigo-600 text-white p-4 rounded-full shadow-lg hover:bg-indigo-700 hover:scale-105 active:scale-95 transition-all z-50 flex items-center justify-center group"
        title="Open Inbox"
      >
        <svg className="w-7 h-7" fill="none" viewBox="0 0 24 24" stroke="currentColor">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 10h.01M12 10h.01M16 10h.01M9 16H5a2 2 0 01-2-2V6a2 2 0 012-2h14a2 2 0 012 2v8a2 2 0 01-2 2h-5l-5 5v-5z" />
        </svg>
      </button>

    </div>
  );
}
