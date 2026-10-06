import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function Onboarding() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    preferredName: '',
    phoneNumber: '',
    branch: '',
    academicYear: ''
  });
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (isSubmitting) return;
    setIsSubmitting(true);
    const token = localStorage.getItem('jwt');
    
    const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
    fetch(`${API_URL}/api/auth/onboard`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Authorization': `Bearer ${token}`
      },
      body: JSON.stringify(formData)
    })
    .then(res => {
      if (res.ok) {
        navigate('/marketplace');
      } else {
        alert("Failed to save details");
        setIsSubmitting(false);
      }
    })
    .catch(err => {
      console.error(err);
      setIsSubmitting(false);
    });
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-50">
      <div className="p-8 bg-white rounded-xl shadow-lg max-w-md w-full">
        <h2 className="text-2xl font-bold mb-6 text-center text-gray-800">Welcome! Let's get set up.</h2>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">Preferred Name</label>
            <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 outline-none transition" 
                   value={formData.preferredName} onChange={e => setFormData({...formData, preferredName: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Phone Number</label>
            <input required type="tel" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 outline-none transition" 
                   value={formData.phoneNumber} onChange={e => setFormData({...formData, phoneNumber: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Branch (e.g. CSE, IT)</label>
            <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 outline-none transition" 
                   value={formData.branch} onChange={e => setFormData({...formData, branch: e.target.value})} />
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-700">Academic Year (e.g. 1st, 2nd)</label>
            <input required type="text" className="mt-1 block w-full rounded-md border-gray-300 shadow-sm p-2 border focus:border-blue-500 focus:ring-blue-500 outline-none transition" 
                   value={formData.academicYear} onChange={e => setFormData({...formData, academicYear: e.target.value})} />
          </div>
          <button 
            type="submit" 
            disabled={isSubmitting}
            className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 active:scale-95 transition-all disabled:opacity-70 disabled:cursor-wait mt-6 flex items-center justify-center gap-2"
          >
            {isSubmitting && (
              <svg className="animate-spin h-4 w-4 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
              </svg>
            )}
            <span>{isSubmitting ? 'Setting up account...' : 'Complete Setup'}</span>
          </button>
        </form>
      </div>
    </div>
  );
}
