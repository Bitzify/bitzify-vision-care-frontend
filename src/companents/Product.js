import React, { useState, Suspense } from 'react';
import './style.css';
import ARModeDialog from './ARModeDialog';

const ARGlasses = React.lazy(() => import('../companents/ARGlasses'));

// --- mock product data (unchanged) ---
const product = {
  name: 'Sleek Vision GX01',
  description:
    'Elegant and durable unisex eyeglasses designed for everyday wear. Crafted with precision frames and lightweight comfort for long hours of use.',
  price: 100,
  children: [
    { color: '#2c3e50', frameSize: 'S', price: 100 },
    { color: '#2c3e50', frameSize: 'M', price: 120 },
    { color: '#2c3e50', frameSize: 'L', price: 140 },
    { color: '#7f8c8d', frameSize: 'S', price: 110 },
    { color: '#7f8c8d', frameSize: 'M', price: 130 },
    { color: '#7f8c8d', frameSize: 'L', price: 150 },
  ],
};

export default function Product() {
  const [option, setOption] = useState({ color: null, frameSize: null });

  const [showModeDialog, setShowModeDialog] = useState(false);
  const [showARGlasses, setShowARGlasses] = useState(false);
  const [selectedMode, setSelectedMode] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const handleCameraClick = () => {
    setSelectedProduct(product); // Assuming current product
    setShowModeDialog(true);
  };

  const handleModeSelect = (mode) => {
    setSelectedMode(mode);
    setShowModeDialog(false);
    setShowARGlasses(true);
  };

  const handleCloseAR = () => {
    setShowARGlasses(false);
    setSelectedMode(null);
    setSelectedProduct(null);
  };

  const getPrice = () => {
    const { color, frameSize } = option;
    if (!color || !frameSize) return product.price;
    const match = product.children.find(
      (item) => item.color === color && item.frameSize === frameSize
    );
    return match ? match.price : product.price;
  };

  const colors = [...new Set(product.children.map((p) => p.color))];
  const sizes = [...new Set(product.children.map((p) => p.frameSize))];

  return (
    <div className="product-wrapper">
      {/* ------------- product detail ------------- */}
      <div className="detail">
        <div>
          <img src="/image.png" alt="product" />
        </div>

        <div className="content">
          <h2>{product.name}</h2>
          <p className="des">{product.description}</p>

          <p><b>Colors</b></p>
          <ul id="colors">
            {colors.map((color) => (
              <li
                key={color}
                style={{ backgroundColor: color }}
                className={option.color === color ? 'active' : ''}
                onClick={() =>
                  setOption((prev) => ({
                    ...prev,
                    color: prev.color === color ? null : color,
                  }))
                }
              />
            ))}
          </ul>

          <p><b>Sizes</b></p>
          <ul id="sizes">
            {sizes.map((size) => (
              <li
                key={size}
                className={option.frameSize === size ? 'active' : ''}
                onClick={() =>
                  setOption((prev) => ({
                    ...prev,
                    frameSize: prev.frameSize === size ? null : size,
                  }))
                }
              >
                {size}
              </li>
            ))}
          </ul>

          <div className="price">
            <img src="/coins.png" alt="coin icon" />
            <span>{getPrice()}</span>
          </div>

          <div className="buttons">
            <button onClick={handleCameraClick}>Try On</button>
          </div>
        </div>
      </div>

      {/* ------------- AR Mode Dialog ------------- */}
      <ARModeDialog
        isOpen={showModeDialog}
        onClose={() => setShowModeDialog(false)}
        onSelectMode={handleModeSelect}
      />

      {/* ------------- AR Glasses Component ------------- */}
      {showARGlasses && (
        <div
          style={{
            position: 'fixed',
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            zIndex: 1000,
            backgroundColor: 'rgba(0,0,0,0.85)',
          }}
        >
          <Suspense fallback={<div className="loading">Loading&nbsp;AR…</div>}>
            <ARGlasses
              modelPath={selectedProduct?.modelPath}
              initialMode={selectedMode}
              onClose={handleCloseAR}
            />
          </Suspense>
          <button className="ar-close" onClick={handleCloseAR}>×</button>
        </div>
      )}
    </div>
  );
}
