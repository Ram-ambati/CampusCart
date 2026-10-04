import React, { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Home() {
  const [userName, setUserName] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    const token = localStorage.getItem('jwt');
    if (!token) {
      navigate('/login');
      return;
    }

    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    fetch(`${API_URL}/api/auth/me`, {
      headers: { 'Authorization': `Bearer ${token}` }
    })
    .then(res => res.json())
    .then(user => {
      setUserName(user.preferredName || user.realName);
    })
    .catch(err => {
      console.error(err);
      navigate('/login');
    });
  }, [navigate]);

  return (
    <div className="min-h-screen bg-gray-50 flex flex-col">
      <header className="bg-white shadow-sm p-4 flex justify-between items-center px-8">
        <h1 className="text-xl font-bold text-blue-600">CampusCart</h1>
        <button 
          onClick={() => {
            localStorage.removeItem('jwt');
            navigate('/login');
          }}
          className="text-sm font-medium text-gray-600 hover:text-gray-900 transition-colors"
        >
          Sign Out
        </button>
      </header>
      <main className="flex-1 p-8">
        <div className="bg-white rounded-xl shadow-sm p-10 max-w-4xl mx-auto mt-8 border border-gray-100">
          <h2 className="text-3xl font-bold text-gray-800 mb-3">Welcome back, {userName}! 👋</h2>
          <p className="text-gray-600 text-lg">Your CampusCart dashboard is ready. Let's start buying and selling on campus.</p>
        </div>
      </main>
    </div>
  );
}
