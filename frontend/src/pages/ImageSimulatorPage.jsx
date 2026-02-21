import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import toast from 'react-hot-toast';
import Layout from '../components/Layout';
import useAppStore from '../store/useAppStore';

export default function ImageSimulatorPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [uploadedImages, setUploadedImages] = useState([]);
  const [results, setResults] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDragging, setIsDragging] = useState(false);

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const files = Array.from(e.dataTransfer.files).filter(f => f.type.startsWith('image/'));
    handleFiles(files);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const files = Array.from(e.target.files);
    handleFiles(files);
  };

  const handleFiles = (files) => {
    if (files.length === 0) return;
    
    const imageFiles = files.map(file => ({
      file,
      preview: URL.createObjectURL(file),
      name: file.name
    }));
    
    setUploadedImages(prev => [...prev, ...imageFiles]);
    toast.success(`${files.length} image(s) uploaded`);
  };

  const removeImage = (index) => {
    setUploadedImages(prev => prev.filter((_, i) => i !== index));
    toast.success('Image removed');
  };

  const analyzeImages = async () => {
    if (uploadedImages.length === 0) {
      toast.error('Please upload at least one image');
      return;
    }

    setLoading(true);
    try {
      const formData = new FormData();
      uploadedImages.forEach(img => {
        formData.append('files', img.file);
      });

      const response = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/image-simulator/match-images`, {
        method: 'POST',
        body: formData,
      });

      const data = await response.json();
      setResults(data);
      
      if (data.total_matched > 0) {
        toast.success(`Matched ${data.total_matched} image(s)!`);
      } else {
        toast.error('No matching images found');
      }
    } catch (error) {
      toast.error('Analysis failed');
      console.error(error);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setUploadedImages([]);
    setResults(null);
  };

  return (
    <Layout title="Image-Based Environmental Simulator" subtitle={city && location ? `${location}, ${city}` : 'Upload before images'}>
      {/* Upload Section */}
      {!results && (
        <>
          <div className="card mb-6">
            <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>
              Upload "Before" Images
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
              Upload environmental site images to see predicted "after" scenarios
            </p>

            <div
              onDrop={handleDrop}
              onDragOver={handleDragOver}
              onDragLeave={handleDragLeave}
              className="border-2 border-dashed rounded-xl p-12 text-center transition-all cursor-pointer"
              style={{
                borderColor: isDragging ? '#10b981' : '#e5e7eb',
                backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.05)' : '#f9fafb'
              }}
            >
              <input
                type="file"
                id="imageUpload"
                accept="image/*"
                multiple
                onChange={handleFileSelect}
                className="hidden"
              />
              <label htmlFor="imageUpload" className="cursor-pointer">
                <div className="text-6xl mb-4">🌍</div>
                <p className="text-xl font-bold mb-2" style={{ color: '#111827' }}>
                  {isDragging ? 'Drop images here' : 'Drag & drop images'}
                </p>
                <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                  or click to browse (supports multiple images)
                </p>
                <button
                  type="button"
                  onClick={() => document.getElementById('imageUpload').click()}
                  className="px-8 py-3 rounded-lg font-bold transition-all"
                  style={{
                    background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    border: 'none'
                  }}
                >
                  Browse Files
                </button>
              </label>
            </div>
          </div>

          {/* Uploaded Images Preview */}
          {uploadedImages.length > 0 && (
            <div className="card mb-6">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                Uploaded Images ({uploadedImages.length})
              </h3>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-6">
                {uploadedImages.map((img, idx) => (
                  <div key={idx} className="relative rounded-lg overflow-hidden" style={{ border: '2px solid #10b981' }}>
                    <img src={img.preview} alt={img.name} className="w-full h-32 object-cover" />
                    <button
                      onClick={() => removeImage(idx)}
                      className="absolute top-2 right-2 w-8 h-8 rounded-full flex items-center justify-center transition-all"
                      style={{ backgroundColor: 'rgba(220, 38, 38, 0.9)', color: '#ffffff' }}
                    >
                      <i className="fas fa-times"></i>
                    </button>
                  </div>
                ))}
              </div>

              <div className="flex gap-3">
                <button
                  onClick={analyzeImages}
                  disabled={loading}
                  className="flex-1 py-3 rounded-xl font-bold transition-all"
                  style={{
                    background: loading ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
                    color: '#ffffff',
                    cursor: loading ? 'not-allowed' : 'pointer'
                  }}
                >
                  {loading ? 'Analyzing...' : 'Analyze Images'}
                </button>
                <button
                  onClick={reset}
                  className="px-6 py-3 rounded-xl font-bold transition-all"
                  style={{ border: '1px solid #10b981', color: '#10b981', backgroundColor: 'transparent' }}
                >
                  Reset
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* Results Section */}
      {results && (
        <>
          <div className="card mb-6" style={{ borderLeft: '4px solid #10b981' }}>
            <h3 className="text-2xl font-bold mb-2" style={{ color: '#111827' }}>
              Analysis Results
            </h3>
            <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
              Matched {results.total_matched} out of {results.total_uploaded} uploaded image(s)
            </p>
          </div>

          {/* Before/After Comparisons */}
          {results.results.map((result, idx) => (
            result.status === 'matched' ? (
              <div key={idx} className="card mb-6">
                <h4 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                  Comparison {idx + 1}: {result.uploaded_filename}
                </h4>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Before Image */}
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#6b7280' }}>BEFORE</p>
                    <img
                      src={uploadedImages[idx]?.preview}
                      alt="Before"
                      className="w-full rounded-lg"
                      style={{ border: '2px solid #f59e0b' }}
                    />
                  </div>

                  {/* After Image */}
                  <div>
                    <p className="text-sm font-semibold mb-2" style={{ color: '#6b7280' }}>AFTER (Predicted Impact)</p>
                    <img
                      src={`${import.meta.env.VITE_API_BASE_URL}${result.after_image_url}`}
                      alt="After"
                      className="w-full rounded-lg"
                      style={{ border: '2px solid #10b981' }}
                    />
                  </div>
                </div>
              </div>
            ) : (
              <div key={idx} className="card mb-6" style={{ borderLeft: '4px solid #dc2626' }}>
                <p className="text-sm" style={{ color: '#dc2626' }}>
                  ❌ {result.uploaded_filename}: {result.error}
                </p>
              </div>
            )
          ))}

          <button
            onClick={reset}
            className="w-full py-3 rounded-xl font-bold transition-all"
            style={{
              background: 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
              color: '#ffffff'
            }}
          >
            Upload More Images
          </button>
        </>
      )}
    </Layout>
  );
}
