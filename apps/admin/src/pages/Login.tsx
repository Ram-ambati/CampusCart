import { useEffect, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Login() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      if (errorParam === 'suspended') {
        setErrorMsg("Your account has been suspended.");
      } else {
        setErrorMsg(decodeURIComponent(errorParam));
      }
      window.history.replaceState({}, document.title, "/login");
    }

    if (token) {
      localStorage.setItem('jwt', token);
      window.history.replaceState({}, document.title, "/");
      
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      fetch(`${API_URL}/api/auth/me`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      .then(res => res.json())
      .then(user => {
        if (user.role !== 'ADMIN') {
          setErrorMsg("Access Denied: You are not an administrator.");
          localStorage.removeItem('jwt');
        } else {
          navigate('/');
        }
      })
      .catch(err => {
        console.error(err);
        setErrorMsg("Failed to verify admin status.");
      });
    } else {
      const existingToken = localStorage.getItem('jwt');
      if (existingToken) {
        navigate('/');
      }
    }
  }, [navigate, location]);

  const handleGoogleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    // set cookie for redirect
    document.cookie = `mobile_redirect_uri=${encodeURIComponent('http://localhost:5174/login')}; path=/`;
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen bg-slate-50 flex items-center justify-center p-4">
      {/* Subtle Dot Pattern Overlay */}
      <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:32px_32px] pointer-events-none z-0 opacity-40" />

      <div className="bg-white rounded-3xl p-10 max-w-md w-full text-center shadow-2xl border border-slate-200 relative z-10">
        <div className="w-16 h-16 bg-slate-900 rounded-2xl mx-auto flex items-center justify-center mb-6 shadow-md">
          <span className="text-3xl font-black text-white">A</span>
        </div>
        <h1 className="text-3xl font-black text-slate-900 mb-2">Admin Console</h1>
        <p className="text-slate-500 font-medium mb-8">Sign in with your Google account</p>
        
        {errorMsg && (
          <div className="mb-6 p-4 bg-red-50 text-red-600 rounded-xl font-bold text-sm text-left border border-red-100">
            {errorMsg}
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 w-full bg-slate-100 text-slate-700 px-6 py-4 rounded-xl text-lg font-bold hover:bg-slate-200 transition-colors border border-slate-200"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-6 h-6" alt="Google" />
          Sign in with Google
        </button>
      </div>
    </div>
  );
}
