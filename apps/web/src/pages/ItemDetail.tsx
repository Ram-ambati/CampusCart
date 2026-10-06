import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import type { Listing } from '../types';

export default function ItemDetail() {
  const { id } = useParams();
  const navigate = useNavigate();
  const [listing, setListing] = useState<Listing | null>(null);
  const [loading, setLoading] = useState(true);
  const [message, setMessage] = useState("Hi! Is this still available?");
  const [isSendingMessage, setIsSendingMessage] = useState(false);
  const [selectedImageIndex, setSelectedImageIndex] = useState(0);
  const [showReportModal, setShowReportModal] = useState(false);
  const [reportReason, setReportReason] = useState("");
  const queryClient = useQueryClient();

  const { data: user } = useQuery({
    queryKey: ['me'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to fetch user');
      return res.json();
    }
  });

  const { data: wishlistIds = [] } = useQuery<number[]>({
    queryKey: ['wishlistIds'],
    queryFn: async () => {
      const token = localStorage.getItem('jwt');
      if (!token) return [];
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/wishlist/ids`, {
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) return [];
      return res.json();
    }
  });

  const toggleWishlist = useMutation({
    mutationFn: async ({ listingId, isSaved }: { listingId: number, isSaved: boolean }) => {
      const token = localStorage.getItem('jwt');
      const method = isSaved ? 'DELETE' : 'POST';
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/wishlist/${listingId}`, {
        method,
        headers: { 'Authorization': `Bearer ${token}` }
      });
      if (!res.ok) throw new Error('Failed to toggle wishlist');
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['wishlistIds'] });
    }
  });

  const submitReport = useMutation({
    mutationFn: async () => {
      if (!listing) return;
      const token = localStorage.getItem('jwt');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/reports`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({
          targetType: 'LISTING',
          targetId: listing.id,
          reason: reportReason
        })
      });
      if (!res.ok) throw new Error('Failed to submit report');
    },
    onSuccess: () => {
      alert("Report submitted successfully. Our team will review it.");
      setShowReportModal(false);
      setReportReason("");
    },
    onError: () => {
      alert("Failed to submit report. Please try again.");
    }
  });

  const handleSendMessage = async (msgToSend?: string) => {
    if (isSendingMessage || !listing) return;
    const text = (msgToSend !== undefined ? msgToSend : message).trim();
    if (!text && msgToSend === undefined) return;
    
    setIsSendingMessage(true);
    try {
      const token = localStorage.getItem('jwt');
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/chat/session`, {
        method: 'POST',
        headers: { 
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}` 
        },
        body: JSON.stringify({ listingId: listing.id })
      });
      if (!res.ok) throw new Error("Failed to start chat session");
      const session = await res.json();
      
      setTimeout(() => {
        if (text) {
          navigate(`/marketplace/inbox?session=${session.id}&send=${encodeURIComponent(text)}`);
        } else {
          navigate(`/marketplace/inbox?session=${session.id}`);
        }
      }, 400);
    } catch (err) {
      alert("Error starting chat: " + (err as Error).message);
      setIsSendingMessage(false);
    }
  };

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    fetch(`${API_URL}/api/listings/${id}`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => {
      if (!res.ok) throw new Error("Listing not found");
      return res.json();
    })
    .then(data => {
      setListing(data);
      setLoading(false);
    })
    .catch(err => {
      console.error(err);
      setLoading(false);
    });
  }, [id]);

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-50 flex justify-center items-center">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-slate-900"></div>
      </div>
    );
  }

  if (!listing) {
    return (
      <div className="min-h-screen bg-slate-50 flex flex-col justify-center items-center px-4 text-center">
        <h2 className="text-2xl font-bold text-slate-900 mb-2">Item Not Found</h2>
        <p className="text-slate-500 mb-6">This listing may have been removed or sold.</p>
        <button onClick={() => navigate('/marketplace')} className="px-6 py-3 bg-slate-900 text-white rounded-full font-bold hover:bg-slate-800 transition-colors">Back to Marketplace</button>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-50 pb-20">
      {/* Top Navbar */}
      <nav className="sticky top-0 w-full bg-white border-b border-slate-200 z-50 px-6 py-3 flex items-center shadow-sm">
        <button onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors mr-4">
          <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
        </button>
        <div onClick={() => navigate('/')} className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center cursor-pointer">
           <span className="text-white font-bold text-xl">C</span>
        </div>
      </nav>

      <div className="max-w-6xl mx-auto pt-8 px-4 sm:px-6 flex flex-col lg:flex-row gap-10">
        
        {/* Left: Images */}
        <div className="w-full lg:w-3/5">
          <div className="bg-slate-100 rounded-3xl overflow-hidden border border-slate-200/60 flex items-center justify-center aspect-[4/3] relative">
             {listing.images && listing.images.length > 0 ? (
                <img 
                  src={listing.images[selectedImageIndex]?.imageUrl || listing.images[0].imageUrl} 
                  alt={listing.title} 
                  className="w-full h-full object-cover transition-opacity duration-300" 
                  onError={(e) => { e.currentTarget.src = 'https://placehold.co/800x600/e2e8f0/475569?text=No+Image'; }}
                />
             ) : (
                <div className="text-slate-400 flex flex-col items-center">
                  <svg className="w-12 h-12 mb-3 opacity-50" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></svg>
                  <span className="font-medium">No images provided</span>
                </div>
             )}
             
             {/* Favorite Button */}
             {listing && (
               <button 
                 onClick={() => toggleWishlist.mutate({ listingId: listing.id, isSaved: wishlistIds.includes(listing.id) })}
                 className="absolute top-4 right-4 p-3 bg-white/80 backdrop-blur-sm rounded-full shadow-md hover:bg-white active:scale-90 transition-all z-10"
               >
                 <svg className={`w-6 h-6 transition-colors ${wishlistIds.includes(listing.id) ? 'text-red-500 fill-red-500 animate-heart-pop' : 'text-slate-400 fill-transparent hover:text-slate-600'}`} viewBox="0 0 24 24" stroke="currentColor" strokeWidth={wishlistIds.includes(listing.id) ? 0 : 2}>
                   <path strokeLinecap="round" strokeLinejoin="round" d="M4.318 6.318a4.5 4.5 0 000 6.364L12 20.364l7.682-7.682a4.5 4.5 0 00-6.364-6.364L12 7.636l-1.318-1.318a4.5 4.5 0 00-6.364 0z" />
                 </svg>
               </button>
             )}
          </div>
          {/* Thumbnails (If any) */}
          {listing.images && listing.images.length > 1 && (
            <div className="flex gap-4 mt-4 overflow-x-auto pb-2">
              {listing.images.map((img, idx) => (
                <div 
                  key={idx} 
                  onClick={() => setSelectedImageIndex(idx)}
                  className={`w-24 h-24 shrink-0 rounded-xl overflow-hidden cursor-pointer transition-all ${selectedImageIndex === idx ? 'border-4 border-slate-900 shadow-md scale-[1.02]' : 'border-2 border-slate-200 hover:opacity-80'}`}
                >
                  <img 
                    src={img.imageUrl} 
                    alt={`Thumbnail ${idx}`} 
                    className="w-full h-full object-cover" 
                    onError={(e) => { e.currentTarget.src = 'https://placehold.co/200x200/e2e8f0/475569?text=No+Image'; }}
                  />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Right: Info */}
        <div className="w-full lg:w-2/5 flex flex-col">
          <div className="mb-6">
            <h1 className="text-3xl font-extrabold text-slate-900 mb-2">{listing.title}</h1>
            <p className="text-4xl font-black text-slate-900 mb-6">₹{listing.price.toFixed(2)}</p>
            
            <div className="flex gap-3 mb-8">
              <span className="px-4 py-1.5 bg-slate-200 text-slate-800 text-sm font-bold rounded-full capitalize">{listing.itemCondition.toLowerCase().replace('_', ' ')}</span>
              <span className="px-4 py-1.5 bg-slate-100 text-slate-600 text-sm font-bold rounded-full capitalize">{listing.category.toLowerCase()}</span>
            </div>
            
            <h3 className="text-lg font-bold text-slate-900 mb-2">Description</h3>
            <p className="text-slate-600 leading-relaxed whitespace-pre-wrap">{listing.description}</p>
            
            <div className="mt-6 flex justify-end">
              {(!user || listing.seller?.id !== user.id) && (
                <button 
                  onClick={() => setShowReportModal(true)}
                  className="text-red-500 text-sm font-bold flex items-center gap-1 hover:underline"
                >
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 21v-4m0 0V5a2 2 0 012-2h6.5l1 1H21l-3 6 3 6h-8.5l-1-1H5a2 2 0 00-2 2zm9-13.5V9" /></svg>
                  Report this Listing
                </button>
              )}
            </div>
          </div>

          {(!user || listing.seller?.id !== user.id) && (
            <div className="mt-auto border-t border-slate-200 pt-8">
              <h3 className="text-lg font-bold text-slate-900 mb-4">About the Seller</h3>
              <div className="flex items-center gap-4 mb-6">
                <div className="w-14 h-14 bg-slate-200 rounded-full flex items-center justify-center overflow-hidden shrink-0 border border-slate-300">
                 {listing.seller?.avatarUrl ? (
                     <img src={listing.seller.avatarUrl} alt="Seller Avatar" className="w-full h-full object-cover" referrerPolicy="no-referrer" />
                   ) : (
                     <span className="text-slate-500 font-bold text-xl">{(listing.seller?.preferredName || listing.seller?.realName || "U")[0]}</span>
                   )}
                </div>
                <div>
                  <p className="font-bold text-slate-900 text-lg">{listing.seller?.preferredName || listing.seller?.realName}</p>
                  <p className="text-slate-500 text-sm">Verified Student • {listing.seller?.email?.split('@')[1]}</p>
                </div>
              </div>

              {/* Messaging Box */}
              <div>
                <p className="text-xs font-bold text-slate-500 mb-2 uppercase tracking-wider">Quick Inquiries</p>
                <div className="flex flex-wrap gap-2 mb-3">
                  {[
                    "👋 Hi! Is this still available?",
                    "💰 Is the price negotiable?",
                    "📍 Can we meet at the library?"
                  ].map((chip) => (
                    <button
                      key={chip}
                      type="button"
                      disabled={isSendingMessage}
                      onClick={() => setMessage(chip)}
                      className={`text-xs font-semibold px-3 py-1.5 rounded-full border transition-all active:scale-95 disabled:opacity-50 ${
                        message === chip
                          ? 'bg-slate-900 text-white border-slate-900 shadow-xs'
                          : 'bg-slate-50 hover:bg-slate-100 text-slate-700 border-slate-200'
                      }`}
                    >
                      {chip}
                    </button>
                  ))}
                </div>

                <div className="bg-white border border-slate-200 rounded-2xl p-2 shadow-sm focus-within:ring-2 focus-within:ring-slate-900 focus-within:border-transparent transition-all">
                  <div className="flex items-end">
                    <textarea 
                      rows={2}
                      disabled={isSendingMessage}
                      className="w-full bg-transparent resize-none focus:outline-none text-slate-700 px-3 py-2 text-sm font-medium placeholder-slate-400 disabled:opacity-60"
                      value={message}
                      onChange={e => setMessage(e.target.value)}
                      placeholder="Type a message to the seller..."
                    />
                    <button 
                       type="button"
                       onClick={() => handleSendMessage()}
                       disabled={isSendingMessage || !message.trim()}
                       className={`w-12 h-12 bg-slate-900 text-white rounded-xl flex items-center justify-center shrink-0 hover:bg-slate-800 active:scale-95 transition-all shadow-md ml-2 disabled:opacity-50 disabled:cursor-not-allowed ${
                         isSendingMessage ? 'bg-indigo-600' : ''
                       }`}
                       title="Send message"
                    >
                       <svg 
                         className={`w-5 h-5 transform ${isSendingMessage ? 'animate-plane-takeoff' : 'rotate-90'}`} 
                         fill="currentColor" 
                         viewBox="0 0 20 20"
                       >
                          <path d="M10.894 2.553a1 1 0 00-1.788 0l-7 14a1 1 0 001.169 1.409l5-1.429A1 1 0 009 15.571V11a1 1 0 112 0v4.571a1 1 0 00.725.962l5 1.428a1 1 0 001.17-1.408l-7-14z" />
                       </svg>
                    </button>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Report Modal */}
      {showReportModal && (
        <div className="fixed inset-0 bg-slate-900/50 flex items-center justify-center p-4 z-[100] backdrop-blur-sm">
          <div className="bg-white rounded-3xl p-8 max-w-md w-full shadow-2xl">
            <h3 className="text-2xl font-bold text-slate-900 mb-4">Report Listing</h3>
            <p className="text-slate-500 mb-6 font-medium">Please let us know why you are reporting this listing. False reports may lead to account suspension.</p>
            <textarea 
              autoFocus
              rows={4}
              value={reportReason}
              onChange={e => setReportReason(e.target.value)}
              placeholder="e.g. Inappropriate content, scam, misleading..."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white mb-6 resize-none"
            />
            <div className="flex gap-4">
              <button 
                type="button"
                onClick={() => setShowReportModal(false)}
                className="flex-1 py-3 bg-slate-100 text-slate-700 font-bold rounded-xl hover:bg-slate-200 active:scale-95 transition-all"
              >
                Cancel
              </button>
              <button 
                type="button"
                onClick={() => submitReport.mutate()}
                disabled={submitReport.isPending || !reportReason.trim()}
                className="flex-1 py-3 bg-red-500 text-white font-bold rounded-xl hover:bg-red-600 active:scale-95 transition-all disabled:opacity-50 flex items-center justify-center gap-2"
              >
                {submitReport.isPending && (
                  <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                )}
                <span>{submitReport.isPending ? 'Submitting...' : 'Submit'}</span>
              </button>
            </div>
          </div>
        </div>
      )}

    </div>
  );
}
