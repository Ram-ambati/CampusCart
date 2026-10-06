import { useEffect, useRef, useState } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';

// ─── Floating Item Icons (SVG - Minimal Monochrome) ───
const BookIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
    <rect x="12" y="8" width="40" height="48" rx="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5"/>
    <rect x="16" y="14" width="28" height="3" rx="1.5" fill="#475569"/>
    <rect x="16" y="22" width="20" height="2" rx="1" fill="#94a3b8"/>
    <rect x="16" y="28" width="24" height="2" rx="1" fill="#94a3b8"/>
    <path d="M12 12 Q10 12 10 14 L10 52 Q10 54 12 54" stroke="#0f172a" strokeWidth="2" fill="none"/>
  </svg>
);
const LaptopIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
    <rect x="10" y="14" width="44" height="28" rx="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5"/>
    <rect x="14" y="18" width="36" height="20" rx="2" fill="#e2e8f0"/>
    <path d="M6 42 L58 42 L54 48 L10 48 Z" fill="#0f172a" stroke="#0f172a" strokeWidth="2"/>
    <circle cx="32" cy="45" r="1.5" fill="#f8fafc"/>
  </svg>
);
const CoffeeIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
    <path d="M16 22 L16 48 Q16 52 20 52 L36 52 Q40 52 40 48 L40 22 Z" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5"/>
    <path d="M40 28 L48 28 Q52 28 52 32 L52 36 Q52 40 48 40 L40 40" stroke="#0f172a" strokeWidth="2.5" fill="none"/>
    <path d="M22 18 Q24 12 26 18" stroke="#475569" strokeWidth="1.5" fill="none"/>
    <path d="M28 16 Q30 10 32 16" stroke="#475569" strokeWidth="1.5" fill="none"/>
    <path d="M34 18 Q36 12 38 18" stroke="#475569" strokeWidth="1.5" fill="none"/>
  </svg>
);
const HeadphoneIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
    <path d="M16 36 Q16 20 32 20 Q48 20 48 36" stroke="#0f172a" strokeWidth="3" fill="none"/>
    <rect x="12" y="34" width="8" height="16" rx="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5"/>
    <rect x="44" y="34" width="8" height="16" rx="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5"/>
  </svg>
);
const CalculatorIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
    <rect x="16" y="8" width="32" height="48" rx="4" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5"/>
    <rect x="20" y="14" width="24" height="12" rx="2" fill="#e2e8f0"/>
    <circle cx="24" cy="34" r="3" fill="#0f172a"/>
    <circle cx="32" cy="34" r="3" fill="#0f172a"/>
    <circle cx="40" cy="34" r="3" fill="#0f172a"/>
    <circle cx="24" cy="44" r="3" fill="#475569"/>
    <circle cx="32" cy="44" r="3" fill="#475569"/>
    <circle cx="40" cy="44" r="3" fill="#475569"/>
  </svg>
);
const BackpackIcon = () => (
  <svg viewBox="0 0 64 64" className="w-full h-full" fill="none">
    <path d="M20 20 Q20 12 32 12 Q44 12 44 20" stroke="#0f172a" strokeWidth="2.5" fill="none"/>
    <rect x="16" y="20" width="32" height="36" rx="6" fill="#f8fafc" stroke="#0f172a" strokeWidth="2.5"/>
    <rect x="22" y="28" width="20" height="12" rx="3" fill="#e2e8f0"/>
    <path d="M30 34 L34 34" stroke="#475569" strokeWidth="2" strokeLinecap="round"/>
  </svg>
);


// ─── Feature Cards Data ───
const features = [
  {
    icon: "\u{1F6E1}\uFE0F",
    title: "Exclusivity Shield",
    description: "Only verified @anurag.edu.in students. Your marketplace is locked to your campus community."
  },
  {
    icon: "\u26A1",
    title: "Real-Time Chat",
    description: "Negotiate instantly via WebSocket-powered messaging. No emails, no delays."
  },
  {
    icon: "\u{1F4CD}",
    title: "Safe Meetup Zones",
    description: "Pre-selected campus landmarks like Block A Cafe and Library Steps for safe handoffs."
  },
  {
    icon: "\u2764\uFE0F",
    title: "Wishlist & Saves",
    description: "Heart your favorite listings and find them all on your profile. Never lose a deal."
  },
  {
    icon: "\u{1F3AF}",
    title: "Smart Filtering",
    description: "Filter by category, condition, price, and date. Find exactly what you need in seconds."
  },
];


export default function Landing() {
  const navigate = useNavigate();
  const location = useLocation();
  const [errorMsg, setErrorMsg] = useState<string | null>(null);
  const [isAuthLoading, setIsAuthLoading] = useState(false);
  const revealRefs = useRef<(HTMLDivElement | null)[]>([]);

  useEffect(() => {
    const urlParams = new URLSearchParams(location.search);
    const token = urlParams.get('token');
    const errorParam = urlParams.get('error');

    if (errorParam) {
      if (errorParam === 'suspended') {
        setErrorMsg("Your account has been suspended by an administrator.");
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

  useEffect(() => {
    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (entry.isIntersecting) {
            entry.target.classList.add('visible');
          }
        });
      },
      { threshold: 0.1, rootMargin: '0px 0px -50px 0px' }
    );

    revealRefs.current.forEach((ref) => {
      if (ref) observer.observe(ref);
    });

    return () => observer.disconnect();
  }, []);

  const handleGoogleLogin = () => {
    if (isAuthLoading) return;
    setIsAuthLoading(true);
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    window.location.href = `${API_URL}/oauth2/authorization/google`;
  };

  const addRevealRef = (el: HTMLDivElement | null, index: number) => {
    revealRefs.current[index] = el;
  };

  return (
    <div className="min-h-screen bg-white text-slate-900 font-['Inter',sans-serif] selection:bg-slate-200 overflow-x-hidden">
      {/* Subtle Dot Pattern Overlay */}
      <div className="fixed inset-0 dot-pattern pointer-events-none z-0 opacity-40" />

      {/* ====== NAVIGATION ====== */}
      <nav className="fixed top-0 w-full z-50 border-b border-slate-200/50 bg-white/80 backdrop-blur-xl">
        <div className="flex justify-between items-center px-6 py-4 max-w-7xl mx-auto">
          <div className="flex items-center gap-3 cursor-pointer" onClick={() => {
            if (localStorage.getItem('jwt')) navigate('/marketplace');
          }}>
            <div className="w-9 h-9 bg-slate-900 rounded-xl flex items-center justify-center shadow-md">
              <span className="text-lg font-black text-white">C</span>
            </div>
            <span className="text-lg font-bold tracking-tight text-slate-900">CampusCart</span>
          </div>
          <button 
            onClick={handleGoogleLogin}
            disabled={isAuthLoading}
            className="text-sm font-semibold text-slate-600 hover:text-slate-900 transition-colors px-4 py-2 rounded-lg hover:bg-slate-100 active:scale-95 disabled:opacity-60 flex items-center gap-2"
          >
            {isAuthLoading ? (
              <>
                <svg className="animate-spin h-4 w-4 text-slate-600" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Connecting...</span>
              </>
            ) : (
              <span>Sign In &rarr;</span>
            )}
          </button>
        </div>
      </nav>

      {/* ====== HERO SECTION ====== */}
      <section className="relative min-h-screen flex items-center pt-20">
        <div className="max-w-7xl mx-auto px-6 w-full grid grid-cols-1 lg:grid-cols-2 gap-12 lg:gap-8 items-center relative z-10">
          
          {/* Left: Text Content */}
          <div className="stagger-children">
            {/* Exclusivity Badge */}
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-full bg-slate-100 border border-slate-200 mb-8">
              <span className="relative flex h-2 w-2">
                <span className="absolute inline-flex h-full w-full rounded-full bg-slate-400 opacity-75 animate-ping"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-slate-500"></span>
              </span>
              <span className="text-sm font-semibold text-slate-600">Exclusive to @anurag.edu.in</span>
            </div>

            {/* Headline */}
            <h1 className="text-5xl md:text-6xl lg:text-7xl font-black tracking-tight leading-[1.05] mb-6">
              <span className="text-slate-900">Your Campus.</span><br/>
              <span className="text-slate-500">Your Marketplace.</span>
            </h1>

            {/* Subheadline */}
            <p className="text-lg md:text-xl text-slate-500 max-w-lg leading-relaxed font-medium mb-10">
              Buy, sell, and trade textbooks, electronics, and dorm essentials safely with verified peers. <span className="text-slate-900 font-semibold">No fees. No middlemen.</span>
            </p>

            {/* Error Message */}
            {errorMsg && (
              <div className="mb-8 px-5 py-4 bg-red-50 border border-red-200 text-red-600 rounded-2xl flex items-center gap-3 font-medium text-left max-w-md">
                <svg className="w-5 h-5 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <div>
                  <p className="font-bold">Authentication Failed</p>
                  <p className="text-sm opacity-90">{errorMsg}</p>
                </div>
              </div>
            )}

            {/* CTA Button */}
            <div className="flex flex-col items-start gap-4">
              <button 
                onClick={handleGoogleLogin}
                disabled={isAuthLoading}
                className="flex items-center justify-center gap-3 bg-slate-900 text-white px-8 py-4 rounded-2xl text-lg font-bold shadow-lg shadow-slate-900/10 border border-slate-800 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-85 disabled:cursor-wait"
              >
                {isAuthLoading ? (
                  <>
                    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                      <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                      <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span className="animate-pulse">Connecting to Google...</span>
                  </>
                ) : (
                  <>
                    <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                    <span>Continue with Google</span>
                  </>
                )}
              </button>
              <p className="text-slate-400 text-sm font-medium flex items-center gap-2">
                <svg className="w-4 h-4 text-emerald-500" fill="currentColor" viewBox="0 0 20 20">
                  <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                </svg>
                Join verified Anurag University students
              </p>
            </div>
          </div>

          {/* Right: Floating Items Visual (Minimal) */}
          <div className="relative h-[480px] lg:h-[560px] hidden lg:block">
            {/* Floating items */}
            <div className="float-1 absolute top-[8%] left-[15%] w-16 h-16"><BookIcon /></div>
            <div className="float-2 absolute top-[5%] right-[20%] w-20 h-20"><LaptopIcon /></div>
            <div className="float-3 absolute top-[40%] left-[5%] w-14 h-14"><CoffeeIcon /></div>
            <div className="float-4 absolute top-[35%] right-[10%] w-16 h-16"><HeadphoneIcon /></div>
            <div className="float-5 absolute bottom-[20%] left-[20%] w-14 h-14"><CalculatorIcon /></div>
            <div className="float-6 absolute bottom-[15%] right-[25%] w-18 h-18"><BackpackIcon /></div>

            {/* Connecting lines */}
            <svg className="absolute inset-0 w-full h-full opacity-10" viewBox="0 0 500 560">
              <line x1="100" y1="80" x2="350" y2="80" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="100" y1="240" x2="350" y2="240" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="100" y1="400" x2="350" y2="400" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="120" y1="60" x2="120" y2="420" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="250" y1="60" x2="250" y2="420" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
              <line x1="380" y1="60" x2="380" y2="420" stroke="#0f172a" strokeWidth="1" strokeDasharray="4 4" />
            </svg>

            {/* Little popups */}
            <div className="float-2 absolute top-[22%] left-[30%] bg-white rounded-2xl px-4 py-3 flex items-center gap-3 border border-slate-200 shadow-lg">
              <div className="w-8 h-8 bg-slate-100 rounded-lg flex items-center justify-center text-slate-900 text-sm font-bold">{"\u2713"}</div>
              <div>
                <p className="text-xs font-bold text-slate-900">Trade Complete</p>
                <p className="text-[10px] text-slate-500">CS304 Textbook</p>
              </div>
            </div>

            <div className="float-4 absolute bottom-[35%] left-[10%] bg-white rounded-2xl px-4 py-3 border border-slate-200 shadow-lg">
              <div className="flex items-center gap-2 mb-1">
                <div className="w-4 h-4 rounded-full bg-slate-900" />
                <p className="text-[11px] font-bold text-slate-900">New listing</p>
              </div>
              <p className="text-[10px] text-slate-500">MacBook Air M2 &mdash; {"\u20B9"}45,000</p>
            </div>
          </div>
        </div>
      </section>

      {/* ====== FEATURES GRID ====== */}
      <section className="relative z-10 py-16 md:py-24 bg-slate-50 border-t border-slate-200">
        <div className="max-w-6xl mx-auto px-6">
          <div 
            ref={(el) => addRevealRef(el, 1)} 
            className="reveal text-center mb-16"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">Built Different</p>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900 mb-4">Not Just Another Marketplace</h2>
            <p className="text-slate-500 text-lg max-w-xl mx-auto font-medium">
              Engineered from the ground up for the campus experience.
            </p>
          </div>

          <div 
            ref={(el) => addRevealRef(el, 2)} 
            className="reveal grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
          >
            {features.map((feature, i) => (
              <div 
                key={i} 
                className="feature-card bg-white rounded-2xl p-7 border border-slate-200 cursor-default"
              >
                <div className="w-12 h-12 rounded-xl bg-slate-100 border border-slate-200 flex items-center justify-center text-2xl mb-5">
                  {feature.icon}
                </div>
                <h3 className="text-lg font-bold text-slate-900 mb-2">{feature.title}</h3>
                <p className="text-slate-500 text-sm leading-relaxed font-medium">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== HOW IT WORKS ====== */}
      <section className="relative z-10 py-16 md:py-24 bg-white border-t border-slate-200">
        <div className="max-w-5xl mx-auto px-6">
          <div 
            ref={(el) => addRevealRef(el, 3)} 
            className="reveal text-center mb-16"
          >
            <p className="text-sm font-bold uppercase tracking-[0.2em] text-slate-500 mb-4">How It Works</p>
            <h2 className="text-3xl md:text-5xl font-black text-slate-900">Three Steps. Zero Friction.</h2>
          </div>

          <div 
            ref={(el) => addRevealRef(el, 4)} 
            className="reveal grid grid-cols-1 md:grid-cols-3 gap-8"
          >
            {[
              { step: "01", title: "Verify", desc: "Sign in with your @anurag.edu.in Google account. Instant access, no forms.", icon: "\u{1F510}" },
              { step: "02", title: "Browse or List", desc: "Post items with photos in seconds, or browse the infinite feed with smart filters.", icon: "\u{1F4CB}" },
              { step: "03", title: "Chat & Trade", desc: "Message sellers in real-time, agree on a price, and meet at a campus Safe Zone.", icon: "\u{1F91D}" },
            ].map((item, i) => (
              <div key={i} className="relative text-center group">
                <div className="text-6xl font-black text-slate-100 absolute -top-4 left-1/2 -translate-x-1/2 select-none">{item.step}</div>
                <div className="relative z-10">
                  <div className="text-4xl mb-5">{item.icon}</div>
                  <h3 className="text-xl font-bold text-slate-900 mb-3">{item.title}</h3>
                  <p className="text-slate-500 text-sm leading-relaxed font-medium max-w-xs mx-auto">{item.desc}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ====== FINAL CTA ====== */}
      <section className="relative z-10 py-24 md:py-32 bg-slate-50 border-t border-slate-200">
        <div 
          ref={(el) => addRevealRef(el, 5)} 
          className="reveal max-w-3xl mx-auto px-6 text-center relative z-10"
        >
          <h2 className="text-4xl md:text-6xl font-black text-slate-900 mb-6 leading-tight">
            Ready to trade<br/>smarter?
          </h2>
          <p className="text-slate-500 text-lg mb-10 max-w-lg mx-auto font-medium">
            Join your campus marketplace. Exclusive access for verified Anurag University students only.
          </p>
          <button 
            onClick={handleGoogleLogin}
            disabled={isAuthLoading}
            className="inline-flex items-center justify-center gap-3 bg-slate-900 text-white px-10 py-5 rounded-2xl text-lg font-bold shadow-lg shadow-slate-900/10 border border-slate-800 hover:bg-slate-800 hover:scale-[1.02] active:scale-95 transition-all disabled:opacity-85 disabled:cursor-wait"
          >
            {isAuthLoading ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span className="animate-pulse">Connecting to Google...</span>
              </>
            ) : (
              <>
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" className="w-5 h-5" alt="Google" />
                <span>Get Started Now</span>
              </>
            )}
          </button>
        </div>
      </section>

      {/* ====== FOOTER ====== */}
      <footer className="relative z-10 border-t border-slate-200 py-10 bg-white">
        <div className="max-w-7xl mx-auto px-6 flex flex-col md:flex-row justify-between items-center gap-4">
          <div className="flex items-center gap-2">
            <div className="w-7 h-7 bg-slate-900 rounded-lg flex items-center justify-center">
              <span className="text-xs font-black text-white">C</span>
            </div>
            <span className="text-sm font-semibold text-slate-600">CampusCart</span>
          </div>
          <p className="text-slate-400 text-sm font-medium">
            &copy; {new Date().getFullYear()} CampusCart &mdash; Built for students, by students.
          </p>
        </div>
      </footer>
    </div>
  );
}
