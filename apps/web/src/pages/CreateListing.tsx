import { useState } from 'react';
import { useNavigate } from 'react-router-dom';

export default function CreateListing() {
  const navigate = useNavigate();
  const [formData, setFormData] = useState({
    title: '',
    price: '',
    category: 'OTHER',
    itemCondition: 'GOOD',
    description: ''
  });
  const [files, setFiles] = useState<File[]>([]);
  const [isDragging, setIsDragging] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleAddFiles = (newFiles: FileList | null) => {
    if (!newFiles) return;
    const fileArray = Array.from(newFiles);
    setFiles(prev => {
      const combined = [...prev, ...fileArray];
      return combined.slice(0, 5); // limit to 5
    });
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    setIsDragging(false);
    handleAddFiles(e.dataTransfer.files);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (files.length < 3) {
      alert("Please upload at least 3 photos for your listing.");
      return;
    }

    setIsSubmitting(true);
    const token = localStorage.getItem('jwt');

    const data = new FormData();
    const listingBlob = new Blob([JSON.stringify(formData)], { type: 'application/json' });
    data.append('listing', listingBlob);

    if (files.length > 0) {
      for (let i = 0; i < files.length; i++) {
        data.append('images', files[i]);
      }
    }

    try {
      const API_URL = import.meta.env.VITE_API_URL || 'http://localhost:8080';
      const res = await fetch(`${API_URL}/api/listings`, {
        method: 'POST',
        headers: {
          'Authorization': `Bearer ${token}`
        },
        body: data
      });

      if (res.ok) {
        alert("Success! Your listing is pending admin approval. It will appear on the marketplace once approved.");
        navigate('/marketplace/you/selling');
      } else {
        alert("Failed to create listing.");
      }
    } catch (err) {
      console.error(err);
      alert("An error occurred. Make sure the backend is running!");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex justify-center py-12 px-4 selection:bg-slate-200">
      <div className="max-w-2xl w-full bg-white rounded-3xl shadow-sm border border-slate-200 p-8 md:p-10">
        <div className="flex items-center gap-4 mb-10">
          <button type="button" onClick={() => navigate(-1)} className="w-10 h-10 bg-slate-100 rounded-full flex items-center justify-center hover:bg-slate-200 transition-colors">
            <svg className="w-5 h-5 text-slate-700" fill="none" viewBox="0 0 24 24" stroke="currentColor"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
          </button>
          <h1 className="text-3xl font-extrabold text-slate-900">List an Item</h1>
        </div>

        <form onSubmit={handleSubmit} className="space-y-8">
          <div>
            <label className="block text-sm font-bold text-slate-900 mb-3">Photos</label>
            <div 
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              onDrop={handleDrop}
              className={`border-2 border-dashed rounded-2xl p-8 text-center transition-colors ${isDragging ? 'border-slate-900 bg-slate-100' : 'border-slate-200 hover:bg-slate-50'}`}
            >
              <input 
                type="file" 
                multiple 
                accept="image/*"
                onChange={(e) => handleAddFiles(e.target.files)}
                className="w-full text-sm text-slate-500 file:mr-4 file:py-2.5 file:px-6 file:rounded-full file:border-0 file:text-sm file:font-bold file:bg-slate-100 file:text-slate-900 hover:file:bg-slate-200 cursor-pointer"
              />
              <p className="text-xs text-slate-400 mt-4 font-medium">
                Drag and drop your images here, or click to select. <br/>
                Upload 3 to 5 photos. <strong className="text-slate-600">Note: The 1st image selected will be the thumbnail.</strong>
              </p>
              
              {files.length > 0 && (
                <div className="flex gap-4 mt-6 overflow-x-auto pb-2 justify-center">
                  {files.map((file, idx) => (
                    <div key={idx} className="w-20 h-20 shrink-0 rounded-xl overflow-hidden border-2 border-slate-200 relative group">
                      <img src={URL.createObjectURL(file)} alt="preview" className="w-full h-full object-cover" />
                      <button 
                        type="button"
                        onClick={(e) => { 
                          e.preventDefault(); 
                          e.stopPropagation(); 
                          setFiles(files.filter((_, i) => i !== idx)); 
                        }}
                        className="absolute top-1 right-1 bg-red-500 text-white rounded-full w-5 h-5 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity text-xs"
                      >
                        &times;
                      </button>
                      {idx === 0 && <span className="absolute bottom-0 left-0 right-0 bg-slate-900/70 text-white text-[10px] text-center font-bold py-0.5">COVER</span>}
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-3">Title</label>
            <input 
              required
              type="text" 
              placeholder="e.g., iPhone 13 Pro Max - 256GB"
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
              value={formData.title}
              onChange={e => setFormData({...formData, title: e.target.value})}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">Price (₹)</label>
              <div className="relative">
                <span className="absolute left-4 top-4 text-slate-400 font-bold">₹</span>
                <input 
                  required
                  type="number" 
                  min="0"
                  step="0.01"
                  placeholder="0.00"
                  className="w-full pl-8 p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors"
                  value={formData.price}
                  onChange={e => setFormData({...formData, price: e.target.value})}
                />
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-900 mb-3">Condition</label>
              <select 
                className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors appearance-none font-medium text-slate-700"
                value={formData.itemCondition}
                onChange={e => setFormData({...formData, itemCondition: e.target.value})}
              >
                <option value="NEW">New</option>
                <option value="LIKE_NEW">Like New</option>
                <option value="GOOD">Good</option>
                <option value="FAIR">Fair</option>
              </select>
            </div>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-3">Category</label>
            <select 
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors appearance-none font-medium text-slate-700"
              value={formData.category}
              onChange={e => setFormData({...formData, category: e.target.value})}
            >
              <option value="TEXTBOOKS">Textbooks</option>
              <option value="ELECTRONICS">Electronics</option>
              <option value="FURNITURE">Furniture</option>
              <option value="TICKETS">Tickets</option>
              <option value="CLOTHING">Clothing</option>
              <option value="OTHER">Other</option>
            </select>
          </div>

          <div>
            <label className="block text-sm font-bold text-slate-900 mb-3">Description</label>
            <textarea 
              required
              rows={5}
              placeholder="Describe the item, any defects, and why you are selling it."
              className="w-full p-4 bg-slate-50 border border-slate-200 rounded-xl focus:outline-none focus:ring-2 focus:ring-slate-900 focus:bg-white transition-colors resize-none"
              value={formData.description}
              onChange={e => setFormData({...formData, description: e.target.value})}
            />
          </div>

          <div className="pt-4">
            <p className="text-xs text-slate-500 mb-4 text-center font-medium">By publishing, you agree to our community guidelines. All listings are subject to admin approval.</p>
            <button 
              type="submit" 
              disabled={isSubmitting}
              className="w-full py-4 bg-slate-900 text-white rounded-xl font-bold text-lg hover:bg-slate-800 transition-colors disabled:opacity-50 shadow-md hover:shadow-lg active:scale-[0.98]"
            >
              {isSubmitting ? 'Publishing...' : 'Publish Listing'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
