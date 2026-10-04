import React, { useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = React.useState<string | null>(null);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');
    
    if (errorParam) {
      setErrorMsg(decodeURIComponent(errorParam));
      // Remove error from URL without reloading
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
        if (!user.onboardingCompleted) {
          navigate('/onboarding');
        } else {
          navigate('/marketplace');
        }
      })
      .catch(err => console.error(err));
    } else {
      const existingToken = localStorage.getItem('jwt');
      if (existingToken) {
        navigate('/marketplace');
      }
    }
  }, [navigate, location]);

  const handleGoogleLogin = () => {
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-900 font-sans selection:bg-slate-200">
      {/* Navigation */}
      <nav className="fixed top-0 w-full bg-white/80 backdrop-blur-md border-b border-slate-200 z-50">
        <div className="flex justify-between items-center px-6 py-4 max-w-6xl mx-auto">
          <div className="flex items-center gap-2 cursor-pointer" onClick={() => {
            if (localStorage.getItem('jwt')) {
              navigate('/marketplace');
            }
          }}>
            <div className="w-8 h-8 bg-slate-900 rounded-md flex items-center justify-center shadow-sm">
              <span className="text-xl font-bold text-white">C</span>
            </div>
            <span className="text-xl font-bold tracking-tight text-slate-900">CampusCart</span>
          </div>
          <button 
            onClick={handleGoogleLogin}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100"
          >
            Sign In
          </button>
        </div>
      </nav>

      {/* Hero Section */}
      <main className="flex flex-col items-center justify-center min-h-[90vh] px-4 text-center max-w-4xl mx-auto pt-20">
        
        <div className="mb-6 inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white border border-slate-200 text-slate-600 text-sm font-semibold shadow-sm">
          <span className="relative flex h-2 w-2">
            <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75"></span>
            <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
          </span>
          Only for @anurag.edu.in students
        </div>

        <h1 className="text-6xl md:text-7xl font-extrabold tracking-tight mb-6 text-slate-900">
          Your Campus. <br/>
          Your Marketplace.
        </h1>
        
        <p className="text-lg md:text-xl text-slate-500 mb-10 max-w-2xl leading-relaxed font-medium">
          Buy, sell, and trade textbooks, electronics, and dorm essentials safely with verified peers. No fees. No middlemen.
        </p>

        {errorMsg && (
          <div className="mb-8 px-6 py-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 font-medium text-left max-w-md w-full mx-auto shadow-sm">
            <svg className="w-6 h-6 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <p className="font-bold">Authentication Failed</p>
              <p className="text-sm opacity-90">{errorMsg}</p>
            </div>
          </div>
        )}

        <button 
          onClick={handleGoogleLogin}
          className="flex items-center justify-center gap-3 bg-white border border-slate-200 text-slate-800 px-8 py-3.5 rounded-xl text-lg font-semibold shadow-sm hover:shadow-md hover:border-slate-300 hover:bg-slate-50 active:scale-95 transition-all duration-200"
        >
          <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
          Continue with Google
        </button>

      </main>
    </div>
  );
}
