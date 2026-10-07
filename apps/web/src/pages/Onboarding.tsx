import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';

const PRESET_BRANCHES = [
  'AI - Artificial Intelligence',
  'AIML - Artificial Intelligence & Machine Learning',
  'CIVIL - Civil Engineering',
  'CSE - Computer Science & Engineering',
  'CS - Cyber Security',
  'DS - Data Science',
  'ECE - Electronics & Communication Engineering',
  'ECM - Electronics & Computer Engineering',
  'EEE - Electrical & Electronics Engineering',
  'IT - Information Technology',
  'MBA - Master of Business Administration',
  'MECH - Mechanical Engineering',
  'PHARM - Pharmacy (B.Pharm / M.Pharm)',
  'Other'
];

const ACADEMIC_YEARS = [
  '1st Year',
  '2nd Year',
  '3rd Year',
  '4th Year'
];

export default function Onboarding() {
  const navigate = useNavigate();
  const [preferredName, setPreferredName] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedBranch, setSelectedBranch] = useState('CSE - Computer Science & Engineering');
  const [customBranch, setCustomBranch] = useState('');
  const [academicYear, setAcademicYear] = useState(ACADEMIC_YEARS[0]);
  
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isLoadingUser, setIsLoadingUser] = useState(true);

  // Check login status & pre-fill name on mount
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
        if (user.onboardingCompleted) {
          navigate('/marketplace');
        } else {
          if (user.realName) {
            setPreferredName(user.realName);
          }
        }
      })
      .catch(err => console.error("Error loading user profile:", err))
      .finally(() => setIsLoadingUser(false));
  }, [navigate]);

  // Clean phone input (digits only, max 10)
  const handlePhoneChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    let val = e.target.value.replace(/\D/g, '');
    // If user pastes with 91 prefix and 12 digits, trim 91
    if (val.length === 12 && val.startsWith('91')) {
      val = val.substring(2);
    }
    setPhoneNumber(val.slice(0, 10));
    setErrorMessage(null);
  };

  const isPhoneValid = /^[6-9]\d{9}$/.test(phoneNumber);
  const effectiveBranch = selectedBranch === 'Other' ? customBranch.trim() : selectedBranch;

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;

    // Frontend validations
    if (!preferredName.trim() || preferredName.trim().length < 2) {
      setErrorMessage("Please enter a preferred name (at least 2 characters).");
      return;
    }

    if (!isPhoneValid) {
      setErrorMessage("Please enter a valid 10-digit mobile number starting with 6, 7, 8, or 9.");
      return;
    }

    if (!effectiveBranch) {
      setErrorMessage("Please select or enter your branch/department.");
      return;
    }

    setIsSubmitting(true);
    setErrorMessage(null);

    const token = localStorage.getItem('jwt');
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';

    try {
      const res = await fetch(`${API_URL}/api/auth/onboard`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({
          preferredName: preferredName.trim(),
          phoneNumber: phoneNumber.trim(),
          branch: effectiveBranch,
          academicYear
        })
      });

      if (res.ok) {
        navigate('/marketplace');
      } else {
        const errorData = await res.json().catch(() => null);
        const msg = errorData?.errors?.phoneNumber 
          || errorData?.errors?.preferredName 
          || errorData?.errors?.branch 
          || errorData?.errors?.academicYear 
          || errorData?.error 
          || "Failed to save profile. Please verify your details.";
        setErrorMessage(msg);
        setIsSubmitting(false);
      }
    } catch (err) {
      console.error(err);
      setErrorMessage("Network error. Could not connect to server.");
      setIsSubmitting(false);
    }
  };

  if (isLoadingUser) {
    return (
      <div className="flex items-center justify-center min-h-screen bg-slate-50">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-indigo-600"></div>
      </div>
    );
  }

  return (
    <div className="flex items-center justify-center min-h-screen bg-slate-50 p-4">
      {/* Background ambient pattern */}
      <div className="fixed inset-0 bg-[radial-gradient(#cbd5e1_1px,transparent_1px)] [background-size:24px_24px] pointer-events-none z-0 opacity-50" />

      <div className="p-8 bg-white rounded-3xl shadow-xl max-w-lg w-full relative z-10 border border-slate-100">
        <div className="text-center mb-8">
          <div className="w-14 h-14 bg-indigo-600 text-white rounded-2xl mx-auto flex items-center justify-center font-black text-2xl shadow-lg shadow-indigo-100 mb-4">
            C
          </div>
          <h2 className="text-2xl font-black text-slate-900 tracking-tight">Complete Your Profile</h2>
          <p className="text-sm text-slate-500 mt-1">Tell your fellow campus peers a bit about you.</p>
        </div>

        {errorMessage && (
          <div className="mb-6 p-4 bg-red-50 border border-red-200 text-red-700 text-sm font-semibold rounded-2xl flex items-center gap-3">
            <svg className="w-5 h-5 flex-shrink-0 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} className="space-y-5">
          {/* Preferred Name */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Preferred Name
            </label>
            <input 
              required 
              type="text" 
              maxLength={50}
              placeholder="e.g. Rahul Sharma"
              className="block w-full rounded-xl border border-slate-200 p-3 text-slate-900 font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition" 
              value={preferredName} 
              onChange={e => {
                setPreferredName(e.target.value);
                setErrorMessage(null);
              }} 
            />
            <p className="text-xs text-slate-400 mt-1">This name will appear on your listings and chat.</p>
          </div>

          {/* Phone Number with +91 Prefix */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Mobile Number
            </label>
            <div className="relative flex rounded-xl border border-slate-200 focus-within:border-indigo-600 focus-within:ring-2 focus-within:ring-indigo-100 transition overflow-hidden">
              <span className="inline-flex items-center px-3.5 bg-slate-100 text-slate-600 font-bold text-sm border-r border-slate-200 select-none">
                +91
              </span>
              <input 
                required 
                type="tel" 
                inputMode="numeric"
                maxLength={10}
                placeholder="98765 43210"
                className="block w-full p-3 text-slate-900 font-medium outline-none" 
                value={phoneNumber} 
                onChange={handlePhoneChange} 
              />
              {phoneNumber.length === 10 && (
                <span className="inline-flex items-center pr-3">
                  {isPhoneValid ? (
                    <span className="text-emerald-500 font-bold text-lg">✓</span>
                  ) : (
                    <span className="text-rose-500 font-bold text-lg">✕</span>
                  )}
                </span>
              )}
            </div>

            {/* Live helper message */}
            <div className="mt-1.5 text-xs">
              {phoneNumber.length > 0 && !isPhoneValid && phoneNumber.length === 10 ? (
                <span className="text-rose-600 font-medium">Must start with 6, 7, 8, or 9.</span>
              ) : phoneNumber.length > 0 && phoneNumber.length < 10 ? (
                <span className="text-slate-400">{10 - phoneNumber.length} more digits needed.</span>
              ) : isPhoneValid ? (
                <span className="text-emerald-600 font-medium">Valid 10-digit number.</span>
              ) : (
                <span className="text-slate-400">Enter a 10-digit Indian mobile number.</span>
              )}
            </div>
          </div>

          {/* Branch Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Branch / Department
            </label>
            <select 
              className="block w-full rounded-xl border border-slate-200 p-3 text-slate-900 font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
              value={selectedBranch}
              onChange={e => {
                setSelectedBranch(e.target.value);
                setErrorMessage(null);
              }}
            >
              {PRESET_BRANCHES.map(branch => (
                <option key={branch} value={branch}>{branch}</option>
              ))}
            </select>

            {/* Custom Branch input when 'Other' selected */}
            {selectedBranch === 'Other' && (
              <div className="mt-2.5">
                <input 
                  required
                  type="text"
                  maxLength={50}
                  placeholder="Type your branch / program (e.g. Biotechnology)"
                  className="block w-full rounded-xl border border-slate-200 p-3 text-slate-900 font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition"
                  value={customBranch}
                  onChange={e => {
                    setCustomBranch(e.target.value);
                    setErrorMessage(null);
                  }}
                />
              </div>
            )}
          </div>

          {/* Academic Year Dropdown */}
          <div>
            <label className="block text-xs font-bold uppercase tracking-wider text-slate-600 mb-1.5">
              Academic Year
            </label>
            <select 
              className="block w-full rounded-xl border border-slate-200 p-3 text-slate-900 font-medium focus:border-indigo-600 focus:ring-2 focus:ring-indigo-100 outline-none transition bg-white"
              value={academicYear}
              onChange={e => setAcademicYear(e.target.value)}
            >
              {ACADEMIC_YEARS.map(year => (
                <option key={year} value={year}>{year}</option>
              ))}
            </select>
          </div>

          {/* Submit Button */}
          <button 
            type="submit" 
            disabled={isSubmitting || !isPhoneValid || (selectedBranch === 'Other' && !customBranch.trim())}
            className="w-full bg-indigo-600 hover:bg-indigo-700 active:scale-[0.99] text-white rounded-xl py-3.5 font-bold shadow-md shadow-indigo-100 transition-all disabled:opacity-50 disabled:cursor-not-allowed mt-4 flex items-center justify-center gap-2"
          >
            {isSubmitting ? (
              <>
                <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                <span>Saving details...</span>
              </>
            ) : (
              <span>Complete Setup & Explore</span>
            )}
          </button>
        </form>
      </div>
    </div>
  );
}
