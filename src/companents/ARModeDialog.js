import React, { useState, useRef, useEffect } from 'react';
import * as THREE from 'three';

// Mock function to simulate MediaPipe face detection
const generateMockLandmarks = (width, height) => {
  const centerX = width / 2;
  const centerY = height / 2;
  const faceSize = Math.min(width, height) * 0.3;
  
  const mockLandmarks = new Array(468).fill().map(() => ({ x: 0, y: 0, z: 0 }));
  
  // Set key landmarks for glasses positioning
  mockLandmarks[168] = { x: centerX / width, y: (centerY - faceSize * 0.2) / height, z: 0 }; // NOSE_BRIDGE
  mockLandmarks[152] = { x: centerX / width, y: (centerY + faceSize * 0.6) / height, z: 0 }; // CHIN_CENTER
  mockLandmarks[468] = { x: (centerX - faceSize * 0.25) / width, y: (centerY - faceSize * 0.1) / height, z: 0 }; // PUPIL_L
  mockLandmarks[473] = { x: (centerX + faceSize * 0.25) / width, y: (centerY - faceSize * 0.1) / height, z: 0 }; // PUPIL_R
  mockLandmarks[172] = { x: (centerX - faceSize * 0.4) / width, y: (centerY - faceSize * 0.15) / height, z: 0 }; // TEMPLE_L
  mockLandmarks[397] = { x: (centerX + faceSize * 0.4) / width, y: (centerY - faceSize * 0.15) / height, z: 0 }; // TEMPLE_R
  
  return mockLandmarks;
};

export default function ARModeDialog({ isOpen, onClose, onSelectMode }) {
  const [currentView, setCurrentView] = useState('selection'); // 'selection' or 'photo'
  const [uploadedImage, setUploadedImage] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [previewCanvas, setPreviewCanvas] = useState(null);
  const fileInputRef = useRef(null);

  // Reset state when dialog closes
  useEffect(() => {
    if (!isOpen) {
      setCurrentView('selection');
      setUploadedImage(null);
      setIsProcessing(false);
      setPreviewCanvas(null);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleModeSelect = (mode) => {
    if (mode === 'live') {
      onSelectMode(mode);
      onClose();
    } else if (mode === 'photo') {
      setCurrentView('photo');
    }
  };

  const processImage = async (imageFile) => {
    setIsProcessing(true);
    
    try {
      const img = new Image();
      const imageUrl = URL.createObjectURL(imageFile);
      
      img.onload = async () => {
        const canvas = document.createElement('canvas');
        const ctx = canvas.getContext('2d');
        
        // Set canvas size for preview (smaller for dialog)
        const maxSize = 300;
        const imgAspect = img.width / img.height;
        
        if (imgAspect > 1) {
          canvas.width = maxSize;
          canvas.height = maxSize / imgAspect;
        } else {
          canvas.width = maxSize * imgAspect;
          canvas.height = maxSize;
        }
        
        ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
        
        // Simulate face detection processing
        setTimeout(() => {
          const mockLandmarks = generateMockLandmarks(canvas.width, canvas.height);
          setPreviewCanvas(canvas);
          setUploadedImage(imageUrl);
          setIsProcessing(false);
        }, 1000);
        
        URL.revokeObjectURL(imageUrl);
      };
      
      img.src = imageUrl;
    } catch (error) {
      console.error('Error processing image:', error);
      setIsProcessing(false);
    }
  };

  const handleFileSelect = (event) => {
    const file = event.target.files[0];
    if (file && file.type.startsWith('image/')) {
      processImage(file);
    }
  };

  const handleUsePhoto = () => {
    if (previewCanvas) {
      // Pass the processed image data to the parent
      onSelectMode('photo', {
        imageData: previewCanvas.toDataURL(),
        canvas: previewCanvas
      });
      onClose();
    }
  };

  const commonButtonStyle = {
    padding: '1rem',
    border: 'none',
    borderRadius: '12px',
    cursor: 'pointer',
    fontSize: '1rem',
    fontWeight: '500',
    transition: 'all 0.2s ease',
    display: 'flex',
    alignItems: 'center',
    gap: '0.5rem',
    width: '100%'
  };

  const primaryButtonStyle = {
    ...commonButtonStyle,
    backgroundColor: '#007bff',
    color: 'white',
    border: '2px solid #007bff'
  };

  const secondaryButtonStyle = {
    ...commonButtonStyle,
    backgroundColor: 'white',
    color: '#6c757d',
    border: '2px solid #6c757d'
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0, 0, 0, 0.7)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000,
      padding: '1rem'
    }}>
      <style>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
      
      <div style={{
        backgroundColor: 'white',
        borderRadius: '16px',
        padding: '2rem',
        maxWidth: currentView === 'photo' ? '500px' : '400px',
        width: '100%',
        boxShadow: '0 20px 40px rgba(0, 0, 0, 0.3)',
        fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        {/* Header */}
        <div style={{
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          marginBottom: '1.5rem'
        }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            {currentView === 'photo' && (
              <button
                onClick={() => setCurrentView('selection')}
                style={{
                  background: 'none',
                  border: 'none',
                  cursor: 'pointer',
                  color: '#666',
                  fontSize: '1.2rem',
                  padding: '0.25rem',
                  borderRadius: '4px'
                }}
              >
                ←
              </button>
            )}
            <h2 style={{
              margin: 0,
              fontSize: '1.5rem',
              fontWeight: '600',
              color: '#333'
            }}>
              {currentView === 'selection' ? 'Try On Glasses' : 'Upload Photo'}
            </h2>
          </div>
          <button
            onClick={onClose}
            style={{
              background: 'none',
              border: 'none',
              fontSize: '1.5rem',
              cursor: 'pointer',
              color: '#666',
              padding: '0',
              width: '30px',
              height: '30px',
              borderRadius: '50%',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}
          >
            ×
          </button>
        </div>

        {currentView === 'selection' && (
          <>
            {/* Disclaimer */}
            <div style={{
              backgroundColor: '#f8f9fa',
              padding: '1rem',
              borderRadius: '8px',
              marginBottom: '1.5rem',
              border: '1px solid #e9ecef'
            }}>
              <p style={{
                margin: 0,
                fontSize: '0.9rem',
                color: '#666',
                lineHeight: '1.5'
              }}>
                📷 This feature uses your camera to enable virtual try-on. Your image data is processed locally and not stored or transmitted.
              </p>
            </div>

            {/* Mode Selection */}
            <div style={{ marginBottom: '1.5rem' }}>
              <p style={{
                margin: '0 0 1rem 0',
                fontSize: '1rem',
                color: '#333',
                fontWeight: '500'
              }}>
                Choose your try-on mode:
              </p>
              
              <div style={{
                display: 'flex',
                flexDirection: 'column',
                gap: '0.75rem'
              }}>
                {/* Live Mode Button */}
                <button
                  onClick={() => handleModeSelect('live')}
                  style={primaryButtonStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#0056b3';
                    e.currentTarget.style.borderColor = '#0056b3';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = '#007bff';
                    e.currentTarget.style.borderColor = '#007bff';
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>🎥</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Live Camera</div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.9,
                      fontWeight: '400'
                    }}>
                      Real-time try-on with your camera
                    </div>
                  </div>
                </button>

                {/* Photo Mode Button */}
                <button
                  onClick={() => handleModeSelect('photo')}
                  style={secondaryButtonStyle}
                  onMouseOver={(e) => {
                    e.currentTarget.style.backgroundColor = '#6c757d';
                    e.currentTarget.style.color = 'white';
                  }}
                  onMouseOut={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.color = '#6c757d';
                  }}
                >
                  <span style={{ fontSize: '1.2rem' }}>📸</span>
                  <div style={{ textAlign: 'left' }}>
                    <div>Upload Photo</div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      opacity: 0.9,
                      fontWeight: '400'
                    }}>
                      Try on using your own photo
                    </div>
                  </div>
                </button>
              </div>
            </div>

            {/* Cancel Button */}
            <button
              onClick={onClose}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #dee2e6',
                borderRadius: '8px',
                backgroundColor: 'white',
                color: '#6c757d',
                cursor: 'pointer',
                fontSize: '0.9rem',
                fontWeight: '500',
                transition: 'all 0.2s ease'
              }}
              onMouseOver={(e) => {
                e.currentTarget.style.backgroundColor = '#f8f9fa';
              }}
              onMouseOut={(e) => {
                e.currentTarget.style.backgroundColor = 'white';
              }}
            >
              Cancel
            </button>
          </>
        )}

        {currentView === 'photo' && (
          <div style={{ textAlign: 'center' }}>
            {!uploadedImage && (
              <>
                <div style={{
                  backgroundColor: '#f8f9fa',
                  border: '2px dashed #dee2e6',
                  borderRadius: '12px',
                  padding: '3rem 2rem',
                  marginBottom: '1.5rem',
                  cursor: 'pointer',
                  transition: 'all 0.2s ease'
                }}
                onClick={() => fileInputRef.current?.click()}
                onMouseOver={(e) => {
                  e.currentTarget.style.backgroundColor = '#e9ecef';
                  e.currentTarget.style.borderColor = '#adb5bd';
                }}
                onMouseOut={(e) => {
                  e.currentTarget.style.backgroundColor = '#f8f9fa';
                  e.currentTarget.style.borderColor = '#dee2e6';
                }}
                >
                  <div style={{ fontSize: '3rem', marginBottom: '1rem' }}>📸</div>
                  <p style={{ margin: '0 0 0.5rem 0', fontSize: '1.1rem', fontWeight: '500', color: '#333' }}>
                    {isProcessing ? 'Processing...' : 'Click to upload photo'}
                  </p>
                  <p style={{ margin: '0', fontSize: '0.9rem', color: '#666' }}>
                    {isProcessing ? 'Detecting face landmarks...' : 'Supports JPG, PNG, and other image formats'}
                  </p>
                  {isProcessing && (
                    <div style={{
                      width: '20px',
                      height: '20px',
                      border: '2px solid #dee2e6',
                      borderTop: '2px solid #007bff',
                      borderRadius: '50%',
                      animation: 'spin 1s linear infinite',
                      margin: '1rem auto 0'
                    }} />
                  )}
                </div>

                <input
                  ref={fileInputRef}
                  type="file"
                  accept="image/*"
                  onChange={handleFileSelect}
                  style={{ display: 'none' }}
                />

                <button
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isProcessing}
                  style={{
                    ...primaryButtonStyle,
                    backgroundColor: isProcessing ? '#6c757d' : '#007bff',
                    borderColor: isProcessing ? '#6c757d' : '#007bff',
                    cursor: isProcessing ? 'not-allowed' : 'pointer',
                    justifyContent: 'center'
                  }}
                >
                  {isProcessing ? 'Processing...' : 'Choose Photo'}
                </button>
              </>
            )}

            {uploadedImage && previewCanvas && (
              <>
                <div style={{
                  marginBottom: '1.5rem',
                  border: '1px solid #dee2e6',
                  borderRadius: '12px',
                  padding: '1rem',
                  backgroundColor: '#f8f9fa'
                }}>
                  <div style={{
                    backgroundImage: `url(${previewCanvas.toDataURL()})`,
                    backgroundSize: 'contain',
                    backgroundRepeat: 'no-repeat',
                    backgroundPosition: 'center',
                    width: '100%',
                    height: '200px',
                    borderRadius: '8px',
                    border: '1px solid #dee2e6',
                    backgroundColor: 'white'
                  }} />
                  <p style={{
                    margin: '1rem 0 0 0',
                    fontSize: '0.9rem',
                    color: '#666'
                  }}>
                    ✅ Face detected! Ready for glasses try-on
                  </p>
                </div>

                <div style={{
                  display: 'flex',
                  gap: '0.75rem',
                  marginBottom: '1rem'
                }}>
                  <button
                    onClick={handleUsePhoto}
                    style={{
                      ...primaryButtonStyle,
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    Use This Photo
                  </button>
                  <button
                    onClick={() => {
                      setUploadedImage(null);
                      setPreviewCanvas(null);
                      fileInputRef.current.value = '';
                    }}
                    style={{
                      ...secondaryButtonStyle,
                      flex: 1,
                      justifyContent: 'center'
                    }}
                  >
                    Choose Different
                  </button>
                </div>
              </>
            )}
          </div>
        )}
      </div>
    </div>
  );
}