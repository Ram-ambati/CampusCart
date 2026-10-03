import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';

interface Listing {
  id: number;
  title: string;
  price: number;
  itemCondition: string;
  category: string;
  images: { imageUrl: string }[];
  seller: { preferredName: string; realName: string };
  createdAt: string;
}

export default function Marketplace() {
  const [listings, setListings] = useState<Listing[]>([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  const { id: category } = useParams();

  useEffect(() => {
    setLoading(true);
    const token = localStorage.getItem('jwt');
    const endpoint = category 
      ? `http://localhost:8080/api/listings/category/${category}`
      : 'http://localhost:8080/api/listings';

    fetch(endpoint, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(data => {
      if (Array.isArray(data)) setListings(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [category]);

  return (
    <div className="min-h-screen bg-slate-50">
      {/* Top Navbar */}
      <nav className="sticky top-0 w-full bg-white border-b border-slate-200 z-50 px-6 py-3 flex items-center justify-between shadow-sm">
        <div className="flex items-center gap-4">
          <div 
            onClick={() => navigate('/')} 
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
              className="pl-10 pr-4 py-2 bg-slate-100 border-none rounded-full w-64 focus:ring-2 focus:ring-slate-300 focus:outline-none"
            />
          </div>
        </div>
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/marketplace/create')}
            className="px-5 py-2 bg-slate-900 text-white text-sm font-semibold rounded-full hover:bg-slate-800 transition-colors shadow-sm"
          >
            Sell Item
          </button>
          <div 
            className="w-10 h-10 bg-slate-100 border border-slate-200 rounded-full cursor-pointer hover:bg-slate-200 transition-colors flex items-center justify-center" 
            onClick={() => navigate('/marketplace/you/selling')}
            title="Seller Dashboard"
          >
             <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /></svg>
          </div>
          <div 
            className="w-10 h-10 bg-slate-200 rounded-full cursor-pointer hover:bg-slate-300 transition-colors flex items-center justify-center" 
            onClick={() => navigate('/profile/edit')}
            title="Your Profile"
          >
            <svg className="w-5 h-5 text-slate-600" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
            </svg>
          </div>
        </div>
      </nav>

      <div className="flex max-w-7xl mx-auto pt-6 px-4 gap-8">
        {/* Sidebar Categories */}
        <aside className="w-64 hidden lg:block shrink-0">
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
          <h2 className="font-bold text-2xl mb-6 text-slate-900">Today's Picks</h2>
          
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
                  <div className="aspect-square bg-slate-100 rounded-2xl mb-3 overflow-hidden border border-slate-200/50">
                    {item.images && item.images.length > 0 ? (
                      <img src={item.images[0].imageUrl} alt={item.title} className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300" />
                    ) : (
                      <div className="w-full h-full flex flex-col items-center justify-center text-slate-400 bg-slate-100">
                        <svg className="w-8 h-8 mb-2 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                        <span className="text-xs font-medium">No Image</span>
                      </div>
                    )}
                  </div>
                  <h3 className="font-extrabold text-lg text-slate-900 leading-tight mb-1">${item.price}</h3>
                  <p className="text-slate-700 font-medium truncate mb-1">{item.title}</p>
                  <p className="text-slate-400 text-xs font-medium">{item.seller?.preferredName || item.seller?.realName}</p>
                </div>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  );
}
