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

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
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
        navigate('/home');
      } else {
        alert("Failed to save details");
      }
    })
    .catch(err => console.error(err));
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
          <button type="submit" className="w-full bg-blue-600 text-white rounded-lg px-4 py-3 font-medium hover:bg-blue-700 transition-colors mt-6">
            Complete Setup
          </button>
        </form>
      </div>
    </div>
  );
}
