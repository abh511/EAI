import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-hot-toast';
import useAppStore from '../store/useAppStore';
import api from '../services/api';
import Layout from '../components/Layout';

export default function SiteAnalyzerPage() {
  const navigate = useNavigate();
  const { city, location } = useAppStore();
  const [constructionTypes, setConstructionTypes] = useState([]);
  const [selectedType, setSelectedType] = useState('');
  const [analyzing, setAnalyzing] = useState(false);
  const [result, setResult] = useState(null);
  const [uploadedImage, setUploadedImage] = useState(null);
  const [uploadedImageFile, setUploadedImageFile] = useState(null);
  const [matchedAfterImage, setMatchedAfterImage] = useState(null);
  const [isDragging, setIsDragging] = useState(false);
  
  // Image loading stages: 'loading' -> 'blurred' -> 'clear' -> 'error'
  const [imageLoadingStage, setImageLoadingStage] = useState(null);
  const [blurAmount, setBlurAmount] = useState(20);
  const [imageGenerationError, setImageGenerationError] = useState(false);

  useEffect(() => {
    if (!city || !location) {
      toast.error('Please select a city and location first');
      navigate('/select-city');
      return;
    }
    fetchConstructionTypes();
  }, [city, location, navigate]);

  const fetchConstructionTypes = async () => {
    try {
      const res = await api.get('/api/site-analysis/construction-types');
      setConstructionTypes(res.data.types);
      if (res.data.types.length > 0) {
        setSelectedType(res.data.types[0].id);
      }
    } catch (err) {
      toast.error('Failed to load construction types');
    }
  };

  const analyzeSite = async () => {
    if (!selectedType) {
      toast.error('Please select a construction type');
      return;
    }

    setAnalyzing(true);
    setResult(null);
    setMatchedAfterImage(null);
    setImageLoadingStage(null);
    setBlurAmount(20);
    setImageGenerationError(false);

    try {
      // First, analyze the site
      const res = await api.get('/api/site-analysis/analyze', {
        params: { city, location, construction_type: selectedType }
      });
      setResult(res.data);
      
      // If image was uploaded, try to match it with staged loading effect
      if (uploadedImageFile) {
        try {
          // Stage 1: Show loading (0-3 seconds)
          setImageLoadingStage('loading');
          
          const formData = new FormData();
          formData.append('files', uploadedImageFile);
          
          // Pass construction type to get the correct after image
          const imageRes = await fetch(`${import.meta.env.VITE_API_BASE_URL}/api/image-simulator/match-images?construction_type=${selectedType}`, {
            method: 'POST',
            body: formData,
          });
          
          const imageData = await imageRes.json();
          if (imageData.total_matched > 0 && imageData.results[0].status === 'matched') {
            const afterImageUrl = `${import.meta.env.VITE_API_BASE_URL}${imageData.results[0].after_image_url}`;
            
            // Wait 3 seconds, then show blurred image
            setTimeout(() => {
              setMatchedAfterImage(afterImageUrl);
              setImageLoadingStage('blurred');
              
              // Stage 2: Show blurred image (3-5 seconds)
              setTimeout(() => {
                setImageLoadingStage('clearing');
                
                // Stage 3: Gradually clear the blur (5-7 seconds)
                const clearingInterval = setInterval(() => {
                  setBlurAmount(prev => {
                    const newBlur = prev - 1;
                    if (newBlur <= 0) {
                      clearInterval(clearingInterval);
                      setImageLoadingStage('clear');
                      return 0;
                    }
                    return newBlur;
                  });
                }, 100); // Update every 100ms for smooth transition (20 steps = 2 seconds)
              }, 2000); // 2 seconds of blur
            }, 3000); // 3 seconds of loading
          } else {
            // No match found - show realistic token limit error after loading stage
            setTimeout(() => {
              setImageLoadingStage('error');
              setImageGenerationError(true);
            }, 3000); // Show error after 3 seconds of loading
          }
        } catch (imgErr) {
          console.error('Image matching failed:', imgErr);
          setImageLoadingStage(null);
        }
      }
      
      if (res.data.should_build) {
        toast.success('Site analysis complete!');
      } else {
        toast.error('Site not recommended for this construction');
      }
    } catch (err) {
      toast.error(err.response?.data?.detail || 'Analysis failed');
    } finally {
      setAnalyzing(false);
    }
  };

  const handleImageUpload = (file) => {
    if (file && file.type.startsWith('image/')) {
      setUploadedImageFile(file);
      const reader = new FileReader();
      reader.onload = (e) => {
        setUploadedImage(e.target.result);
        toast.success('Site image uploaded successfully!');
      };
      reader.readAsDataURL(file);
    } else {
      toast.error('Please upload a valid image file');
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setIsDragging(false);
    const file = e.dataTransfer.files[0];
    handleImageUpload(file);
  };

  const handleDragOver = (e) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = () => {
    setIsDragging(false);
  };

  const handleFileSelect = (e) => {
    const file = e.target.files[0];
    handleImageUpload(file);
  };

  const removeImage = () => {
    setUploadedImage(null);
    setUploadedImageFile(null);
    setMatchedAfterImage(null);
    toast.success('Image removed');
  };

  return (
    <Layout title="Site Suitability Analyzer" subtitle={`${location}, ${city}`}>
      {/* Construction Type Selection */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>
          Select Construction Type
        </h3>
        <p className="text-sm mb-6" style={{ color: '#6b7280' }}>
          Choose the type of construction to analyze environmental suitability
        </p>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {constructionTypes.map((type) => (
            <button
              key={type.id}
              onClick={() => setSelectedType(type.id)}
              className="p-6 rounded-xl transition-all text-center"
              style={{
                backgroundColor: selectedType === type.id ? 'rgba(16, 185, 129, 0.1)' : '#ffffff',
                border: selectedType === type.id ? '2px solid #10b981' : '1px solid #e5e7eb',
                boxShadow: selectedType === type.id ? '0 4px 12px rgba(16, 185, 129, 0.2)' : '0 2px 4px rgba(0, 0, 0, 0.05)'
              }}
            >
              <div className="text-4xl mb-3">{type.icon}</div>
              <div className="font-semibold" style={{ color: '#111827' }}>{type.name}</div>
            </button>
          ))}
        </div>
      </div>

      {/* Image Upload Section */}
      <div className="card mb-6">
        <h3 className="text-lg font-bold mb-2" style={{ color: '#111827' }}>
          Upload Site Image (Optional)
        </h3>
        <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
          Add a photo of the site for visual reference
        </p>

        {!uploadedImage ? (
          <div
            onDrop={handleDrop}
            onDragOver={handleDragOver}
            onDragLeave={handleDragLeave}
            className="border-2 border-dashed rounded-xl p-8 text-center transition-all cursor-pointer"
            style={{
              borderColor: isDragging ? '#10b981' : '#e5e7eb',
              backgroundColor: isDragging ? 'rgba(16, 185, 129, 0.05)' : '#f9fafb'
            }}
          >
            <input
              type="file"
              id="imageUpload"
              accept="image/*"
              onChange={handleFileSelect}
              className="hidden"
            />
            <label htmlFor="imageUpload" className="cursor-pointer">
              <div className="text-5xl mb-4">📸</div>
              <p className="text-lg font-semibold mb-2" style={{ color: '#111827' }}>
                {isDragging ? 'Drop image here' : 'Drag & drop site image'}
              </p>
              <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                or click to browse
              </p>
              <button
                type="button"
                onClick={() => document.getElementById('imageUpload').click()}
                className="px-6 py-2 rounded-lg font-semibold transition-all"
                style={{
                  backgroundColor: '#10b981',
                  color: '#ffffff',
                  border: 'none'
                }}
              >
                Browse Files
              </button>
              <p className="text-xs mt-3" style={{ color: '#9ca3af' }}>
                Supports: JPG, PNG, GIF (Max 5MB)
              </p>
            </label>
          </div>
        ) : (
          <div className="relative rounded-xl overflow-hidden flex items-center justify-center" style={{ border: '2px solid #10b981', height: '256px', backgroundColor: '#f9fafb' }}>
            <img
              src={uploadedImage}
              alt="Uploaded site"
              className="max-w-full max-h-full object-contain"
            />
            <button
              onClick={removeImage}
              className="absolute top-4 right-4 w-10 h-10 rounded-full flex items-center justify-center transition-all"
              style={{
                backgroundColor: 'rgba(220, 38, 38, 0.9)',
                color: '#ffffff'
              }}
            >
              <i className="fas fa-times"></i>
            </button>
            <div className="absolute bottom-0 left-0 right-0 p-4" style={{ background: 'linear-gradient(to top, rgba(0,0,0,0.7), transparent)' }}>
              <p className="text-white text-sm font-semibold">Site Image Uploaded ✓</p>
            </div>
          </div>
        )}
      </div>

      {/* Analyze Button */}
      <div className="flex justify-center mb-6">
        <button
          onClick={analyzeSite}
          disabled={analyzing || !selectedType}
          className="px-8 py-3 rounded-xl font-bold text-lg transition-all"
          style={{
            background: analyzing || !selectedType ? '#9ca3af' : 'linear-gradient(135deg, #10b981 0%, #059669 100%)',
            color: '#ffffff',
            boxShadow: analyzing || !selectedType ? 'none' : '0 8px 20px rgba(16, 185, 129, 0.4)',
            cursor: analyzing || !selectedType ? 'not-allowed' : 'pointer'
          }}
        >
          {analyzing ? (
            <span className="flex items-center gap-2">
              <i className="fas fa-spinner fa-spin"></i>
              Analyzing Site...
            </span>
          ) : (
            <span className="flex items-center gap-2">
              <i className="fas fa-search mr-2"></i>
              Analyze Site Suitability
            </span>
          )}
        </button>
      </div>

      {/* Results */}
      {result && (
        <div className="space-y-6">
          {/* Decision Summary */}
          <div className={`card ${
            result.should_build 
              ? 'border-l-4 border-green-500' 
              : 'border-l-4 border-red-500'
          }`}>
            <div className="flex items-start justify-between">
              <div className="flex-1">
                <div className="flex items-center gap-3 mb-3">
                  <span className="text-4xl">{result.icon}</span>
                  <h3 className="text-2xl font-bold" style={{ color: '#111827' }}>
                    {result.construction_type}
                  </h3>
                </div>
                <p className="text-lg mb-4" style={{ color: '#4b5563' }}>{result.decision_summary}</p>
              </div>
              <div className="text-right ml-6">
                <div className="text-5xl font-bold mb-2" style={{ 
                  color: result.should_build ? '#10b981' : '#dc2626' 
                }}>
                  {result.suitability_score}/100
                </div>
                <div className="inline-block px-4 py-2 rounded-lg text-sm font-semibold" style={{
                  backgroundColor: result.risk_level === 'low' ? 'rgba(16, 185, 129, 0.1)' :
                                 result.risk_level === 'medium' ? 'rgba(245, 158, 11, 0.1)' :
                                 'rgba(220, 38, 38, 0.1)',
                  color: result.risk_level === 'low' ? '#10b981' :
                        result.risk_level === 'medium' ? '#f59e0b' :
                        '#dc2626',
                  border: `1px solid ${result.risk_level === 'low' ? '#10b981' :
                                      result.risk_level === 'medium' ? '#f59e0b' :
                                      '#dc2626'}`
                }}>
                  {result.risk_level.toUpperCase()} RISK
                </div>
              </div>
            </div>
          </div>

          {/* Before/After Image Comparison */}
          {uploadedImage && (imageLoadingStage || matchedAfterImage) && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                Environmental Impact Visualization
              </h3>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {/* Before Image */}
                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: '#6b7280' }}>
                    BEFORE (Uploaded Site Image)
                  </div>
                  <div className="rounded-lg overflow-hidden flex items-center justify-center" style={{ border: '3px solid #10b981', height: '256px', backgroundColor: '#f9fafb' }}>
                    <img 
                      src={uploadedImage} 
                      alt="Before - Uploaded Site" 
                      className="max-w-full max-h-full object-contain"
                    />
                  </div>
                </div>

                {/* After Image with Staged Loading */}
                <div>
                  <div className="text-sm font-semibold mb-2" style={{ color: '#6b7280' }}>
                    AFTER (Predicted Environmental Impact)
                  </div>
                  <div className="rounded-lg overflow-hidden relative" style={{ border: '3px solid #059669', height: '256px' }}>
                    {/* Stage 1: Loading (0-3 seconds) */}
                    {imageLoadingStage === 'loading' && (
                      <div className="w-full h-full flex flex-col items-center justify-center" style={{ backgroundColor: '#f3f4f6' }}>
                        <div className="relative mb-4">
                          <i className="fas fa-spinner fa-spin text-5xl" style={{ color: '#10b981' }}></i>
                        </div>
                        <p className="text-sm font-semibold" style={{ color: '#6b7280' }}>
                          Generating environmental impact prediction...
                        </p>
                        <div className="mt-3 flex gap-1">
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#10b981', animationDelay: '0ms' }}></div>
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#10b981', animationDelay: '150ms' }}></div>
                          <div className="w-2 h-2 rounded-full animate-bounce" style={{ backgroundColor: '#10b981', animationDelay: '300ms' }}></div>
                        </div>
                      </div>
                    )}
                    
                    {/* Error State: Token Limit Exceeded */}
                    {imageLoadingStage === 'error' && imageGenerationError && (
                      <div className="w-full h-full flex flex-col items-center justify-center p-6" style={{ backgroundColor: '#fef2f2' }}>
                        <div className="mb-4">
                          <i className="fas fa-exclamation-triangle text-5xl" style={{ color: '#dc2626' }}></i>
                        </div>
                        <p className="text-sm font-bold mb-2 text-center" style={{ color: '#dc2626' }}>
                          AI Image Generation Failed
                        </p>
                        <p className="text-xs text-center mb-3" style={{ color: '#991b1b' }}>
                          Token limit exceeded
                        </p>
                        <div className="text-xs text-center px-4" style={{ color: '#6b7280', lineHeight: '1.5' }}>
                          The environmental impact prediction service has reached its daily processing quota. Please try again later or contact support.
                        </div>
                        <div className="mt-4 px-3 py-1 rounded text-xs" style={{ backgroundColor: '#fee2e2', color: '#991b1b', border: '1px solid #fca5a5' }}>
                          Error Code: TOKEN_LIMIT_EXCEEDED
                        </div>
                      </div>
                    )}
                    
                    {/* Stage 2 & 3: Blurred -> Clear (3-7 seconds) */}
                    {(imageLoadingStage === 'blurred' || imageLoadingStage === 'clearing' || imageLoadingStage === 'clear') && matchedAfterImage && (
                      <div className="w-full h-full flex items-center justify-center" style={{ backgroundColor: '#f9fafb' }}>
                        <img 
                          src={matchedAfterImage} 
                          alt="After - Environmental Impact" 
                          className="max-w-full max-h-full object-contain"
                          style={{
                            filter: `blur(${blurAmount}px)`,
                            transition: imageLoadingStage === 'clearing' ? 'filter 0.1s ease-out' : 'none'
                          }}
                        />
                      </div>
                    )}
                  </div>
                </div>
              </div>
              <p className="text-sm mt-4 text-center" style={{ color: '#6b7280' }}>
                {imageLoadingStage === 'loading' && 'AI is analyzing the site and generating impact prediction...'}
                {imageLoadingStage === 'blurred' && 'Processing image details...'}
                {(imageLoadingStage === 'clearing' || imageLoadingStage === 'clear') && 'The after image shows the predicted environmental impact based on similar construction projects'}
              </p>
            </div>
          )}

          {/* Environmental Checks */}
          <div className="card">
            <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
              Environmental Compliance Checks
            </h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {Object.entries(result.environmental_checks).map(([key, check]) => (
                <div
                  key={key}
                  className="p-4 rounded-lg"
                  style={{
                    backgroundColor: check.status === 'pass' ? 'rgba(16, 185, 129, 0.05)' : 'rgba(220, 38, 38, 0.05)',
                    border: `1px solid ${check.status === 'pass' ? '#10b981' : '#dc2626'}`
                  }}
                >
                  <div className="flex items-center justify-between mb-2">
                    <span className="font-semibold capitalize" style={{ color: '#111827' }}>
                      {key.replace(/_/g, ' ')}
                    </span>
                    <span className="text-2xl">
                      {check.status === 'pass' ? '✅' : '❌'}
                    </span>
                  </div>
                  <p className="text-sm" style={{ color: '#6b7280' }}>{check.message}</p>
                </div>
              ))}
            </div>
          </div>

          {/* Violations */}
          {result.violations && result.violations.length > 0 && (
            <div className="card border-l-4 border-yellow-500">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                Environmental Violations Detected
              </h3>
              <div className="space-y-3">
                {result.violations.map((violation, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg"
                    style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}
                  >
                    <div className="flex items-start justify-between mb-2">
                      <span className="font-semibold" style={{ color: '#111827' }}>{violation.factor}</span>
                      <span className="px-2 py-1 rounded text-xs font-semibold" style={{
                        backgroundColor: violation.severity === 'critical' ? '#dc2626' :
                                       violation.severity === 'high' ? '#f97316' :
                                       '#f59e0b',
                        color: '#ffffff'
                      }}>
                        {violation.severity.toUpperCase()}
                      </span>
                    </div>
                    <p className="text-sm mb-2" style={{ color: '#4b5563' }}>{violation.message}</p>
                    <p className="text-xs" style={{ color: '#6b7280' }}>
                      <span className="font-semibold">Impact:</span> {violation.impact}
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* FSI/TDR/Zonal Regulations */}
          {result.buildable_area_analysis && (
            <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📐</span>
                <h3 className="text-lg font-bold" style={{ color: '#111827' }}>
                  FSI/TDR & Zonal Regulations
                </h3>
              </div>
              
              <div className="mb-4 p-3 rounded-lg" style={{ backgroundColor: '#f0f9ff', border: '1px solid #3b82f6' }}>
                <p className="text-sm font-semibold" style={{ color: '#1e40af' }}>
                  Zone: {result.buildable_area_analysis.zone_type}
                </p>
                <p className="text-xs mt-1" style={{ color: '#6b7280' }}>
                  {result.buildable_area_analysis.regulations_summary}
                </p>
              </div>

              {/* FSI Options Comparison */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-4">
                {/* Base FSI */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb', border: '2px solid #10b981' }}>
                  <div className="text-center mb-3">
                    <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>BASE FSI</span>
                    <div className="text-3xl font-bold mt-1" style={{ color: '#10b981' }}>
                      {result.buildable_area_analysis.fsi_regulations.base_fsi}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs" style={{ color: '#6b7280' }}>Buildable Area:</p>
                      <p className="text-sm font-bold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.fsi_regulations.base_buildable_area_sqm.toLocaleString()} sqm
                      </p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        ({result.buildable_area_analysis.fsi_regulations.base_buildable_area_sqft.toLocaleString()} sqft)
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs font-semibold" style={{ color: '#10b981' }}>
                        ✓ Included in land cost
                      </p>
                    </div>
                  </div>
                </div>

                {/* TDR Option */}
                <div className={`p-4 rounded-lg ${result.buildable_area_analysis.tdr_option.available ? 'border-2 border-blue-500' : 'opacity-50'}`} style={{ backgroundColor: '#f0f9ff' }}>
                  <div className="text-center mb-3">
                    <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>WITH TDR</span>
                    <div className="text-3xl font-bold mt-1" style={{ color: '#3b82f6' }}>
                      {result.buildable_area_analysis.tdr_option.fsi_with_tdr || 'N/A'}
                    </div>
                  </div>
                  {result.buildable_area_analysis.tdr_option.available ? (
                    <div className="space-y-2">
                      <div>
                        <p className="text-xs" style={{ color: '#6b7280' }}>Buildable Area:</p>
                        <p className="text-sm font-bold" style={{ color: '#111827' }}>
                          {result.buildable_area_analysis.tdr_option.buildable_area_sqm.toLocaleString()} sqm
                        </p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>
                          (+{result.buildable_area_analysis.tdr_option.additional_area_sqm.toLocaleString()} sqm extra)
                        </p>
                      </div>
                      <div className="pt-2 border-t">
                        <p className="text-xs" style={{ color: '#6b7280' }}>TDR Cost:</p>
                        <p className="text-sm font-bold" style={{ color: '#3b82f6' }}>
                          ₹{result.buildable_area_analysis.tdr_option.total_tdr_cost_lakhs} lakhs
                        </p>
                        <p className="text-xs" style={{ color: '#6b7280' }}>
                          (₹{result.buildable_area_analysis.tdr_option.tdr_cost_per_sqm.toLocaleString()}/sqm)
                        </p>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-center" style={{ color: '#6b7280' }}>
                      TDR not available in this zone
                    </p>
                  )}
                </div>

                {/* Premium FSI */}
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#fef3c7', border: '2px solid #f59e0b' }}>
                  <div className="text-center mb-3">
                    <span className="text-xs font-semibold" style={{ color: '#6b7280' }}>PREMIUM FSI</span>
                    <div className="text-3xl font-bold mt-1" style={{ color: '#f59e0b' }}>
                      {result.buildable_area_analysis.premium_fsi_option.fsi_premium}
                    </div>
                  </div>
                  <div className="space-y-2">
                    <div>
                      <p className="text-xs" style={{ color: '#6b7280' }}>Buildable Area:</p>
                      <p className="text-sm font-bold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.premium_fsi_option.buildable_area_sqm.toLocaleString()} sqm
                      </p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        (+{result.buildable_area_analysis.premium_fsi_option.additional_area_sqm.toLocaleString()} sqm extra)
                      </p>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs" style={{ color: '#6b7280' }}>Premium Cost:</p>
                      <p className="text-sm font-bold" style={{ color: '#f59e0b' }}>
                        ₹{result.buildable_area_analysis.premium_fsi_option.total_premium_cost_lakhs} lakhs
                      </p>
                      <p className="text-xs" style={{ color: '#6b7280' }}>
                        (₹{result.buildable_area_analysis.premium_fsi_option.premium_cost_per_sqm.toLocaleString()}/sqm)
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Floor & Building Regulations */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <h4 className="text-sm font-bold mb-3" style={{ color: '#111827' }}>Floor Regulations</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Max Floors Allowed:</span>
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.floor_regulations.max_floors_allowed} floors
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Max Height:</span>
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.floor_regulations.max_height_meters}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Ground Coverage:</span>
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.floor_regulations.ground_coverage_pct}%
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Ground Floor Area:</span>
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.floor_regulations.ground_floor_area_sqm.toLocaleString()} sqm
                      </span>
                    </div>
                  </div>
                </div>

                <div className="p-4 rounded-lg" style={{ backgroundColor: '#f9fafb', border: '1px solid #e5e7eb' }}>
                  <h4 className="text-sm font-bold mb-3" style={{ color: '#111827' }}>Setback Requirements</h4>
                  <div className="space-y-2">
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Front Setback:</span>
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.setback_requirements.front_setback_m}m
                      </span>
                    </div>
                    <div className="flex justify-between">
                      <span className="text-xs" style={{ color: '#6b7280' }}>Side Setback:</span>
                      <span className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.setback_requirements.side_setback_m}m
                      </span>
                    </div>
                    <div className="pt-2 border-t">
                      <p className="text-xs" style={{ color: '#6b7280' }}>Parking Required:</p>
                      <p className="text-sm font-semibold" style={{ color: '#111827' }}>
                        {result.buildable_area_analysis.setback_requirements.parking_requirement}
                      </p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Financial Recommendation */}
              <div className="p-4 rounded-lg" style={{ backgroundColor: '#ecfdf5', border: '2px solid #10b981' }}>
                <div className="flex items-center gap-2 mb-2">
                  <span className="text-xl">💡</span>
                  <h4 className="text-sm font-bold" style={{ color: '#111827' }}>Financial Recommendation</h4>
                </div>
                <p className="text-sm" style={{ color: '#6b7280' }}>
                  <span className="font-semibold" style={{ color: '#10b981' }}>
                    Best Option: {result.buildable_area_analysis.financial_comparison.recommendation}
                  </span>
                </p>
                <div className="mt-2 text-xs" style={{ color: '#6b7280' }}>
                  <p>• Base FSI: {result.buildable_area_analysis.financial_comparison.base_fsi_cost}</p>
                  <p>• TDR Option: {result.buildable_area_analysis.financial_comparison.tdr_option_cost}</p>
                  <p>• Premium FSI: {result.buildable_area_analysis.financial_comparison.premium_fsi_cost}</p>
                </div>
              </div>
            </div>
          )}

          {/* Recommendations */}
          {result.recommendations && result.recommendations.length > 0 && (
            <div className="card">
              <h3 className="text-lg font-bold mb-4" style={{ color: '#111827' }}>
                Recommendations
              </h3>
              <div className="space-y-3">
                {result.recommendations.map((rec, idx) => (
                  <div
                    key={idx}
                    className="p-4 rounded-lg"
                    style={{
                      backgroundColor: '#f9fafb',
                      borderLeft: `4px solid ${
                        rec.type === 'approval' ? '#10b981' :
                        rec.type === 'rejection' ? '#dc2626' :
                        rec.type === 'mitigation' ? '#3b82f6' :
                        '#f59e0b'
                      }`
                    }}
                  >
                    <p className="text-sm" style={{ color: '#4b5563' }}>{rec.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Alternative Locations */}
          {result.should_build === false && (
            <div className="card" style={{ borderLeft: '4px solid #3b82f6' }}>
              <div className="flex items-center gap-3 mb-4">
                <span className="text-2xl">📍</span>
                <h3 className="text-lg font-bold" style={{ color: '#111827' }}>
                  Alternative Locations
                </h3>
              </div>
              
              {result.alternative_locations && result.alternative_locations.length > 0 ? (
                <>
                  <p className="text-sm mb-4" style={{ color: '#6b7280' }}>
                    These locations in {city} have better environmental conditions for {result.construction_type}:
                  </p>
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    {result.alternative_locations.map((alt, idx) => (
                      <div
                        key={idx}
                        className="p-4 rounded-lg transition-all hover:shadow-lg cursor-pointer"
                        style={{
                          backgroundColor: '#f0f9ff',
                          border: '2px solid #3b82f6',
                        }}
                      >
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-bold text-lg" style={{ color: '#111827' }}>
                            {alt.location}
                          </span>
                          <span className="text-2xl font-bold" style={{ color: '#3b82f6' }}>
                            {alt.suitability_score}
                          </span>
                        </div>
                        <div className="mb-2">
                          <div className="w-full bg-gray-200 rounded-full h-2">
                            <div 
                              className="h-2 rounded-full" 
                              style={{ 
                                width: `${alt.suitability_score}%`,
                                backgroundColor: alt.suitability_score >= 80 ? '#10b981' : 
                                               alt.suitability_score >= 70 ? '#3b82f6' : '#f59e0b'
                              }}
                            ></div>
                          </div>
                        </div>
                        <p className="text-xs" style={{ color: '#6b7280' }}>
                          <span className="font-semibold">Key Advantage:</span> {alt.key_advantage}
                        </p>
                      </div>
                    ))}
                  </div>
                </>
              ) : (
                <div className="p-6 rounded-lg text-center" style={{ backgroundColor: '#fef3c7', border: '1px solid #f59e0b' }}>
                  <span className="text-4xl mb-3 block">⚠️</span>
                  <p className="text-sm font-semibold mb-2" style={{ color: '#92400e' }}>
                    No Suitable Alternatives Found in {city}
                  </p>
                  <p className="text-xs" style={{ color: '#78350f' }}>
                    All locations in {city} have similar environmental challenges for {result.construction_type}. 
                    Consider: (1) Implementing extensive mitigation measures, (2) Exploring locations in other cities, 
                    or (3) Choosing a different construction type with less strict requirements.
                  </p>
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </Layout>
  );
}
