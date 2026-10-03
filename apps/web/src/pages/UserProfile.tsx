import React, { useEffect, useState } from 'react';
import { useParams, useNavigate } from 'react-router-dom';

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

  // Check if we are viewing our own profile based on URL
  const isOwnProfile = !userId || userId === 'me' || window.location.pathname.includes('edit');

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) return;

    if (isOwnProfile) {
      // Fetch our own profile
      fetch('http://localhost:8080/api/auth/me', {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(data => {
        setUser(data);
        setEditAbout(data.about || "");
      })
      .catch(console.error);
    } else {
      // Fetch another user's profile
      fetch(`http://localhost:8080/api/users/${userId}`, {
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
      const res = await fetch('http://localhost:8080/api/users/me/about', {
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
             <button onClick={() => setIsEditing(true)} className="px-5 py-2 bg-slate-200 text-slate-900 font-bold rounded-full hover:bg-slate-300 transition-colors">
               Edit Profile
             </button>
           )}
        </div>
        
        <div className="bg-white rounded-3xl p-8 md:p-12 border border-slate-200 shadow-sm flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 md:w-40 md:h-40 rounded-full bg-slate-100 overflow-hidden shrink-0 border-4 border-white shadow-md flex items-center justify-center">
            {user.avatarUrl ? (
              <img src={user.avatarUrl} alt="Avatar" className="w-full h-full object-cover" />
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

        <h2 className="text-2xl font-bold text-slate-900 mt-12 mb-6">Active Listings</h2>
        <div className="text-center py-16 bg-white rounded-3xl border border-slate-200 shadow-sm">
           <svg className="w-12 h-12 text-slate-300 mx-auto mb-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
           </svg>
           <p className="text-slate-500 font-medium">{isOwnProfile ? "You have no active listings." : "This user has no active listings."}</p>
        </div>
      </div>
    </div>
  );
}
