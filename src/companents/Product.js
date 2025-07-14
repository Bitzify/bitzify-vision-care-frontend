import React, { useState, useRef, useEffect } from "react";
import "./style.css";

const product = {
  name: "Sleek Vision GX01",
  description:
    "Elegant and durable unisex eyeglasses designed for everyday wear. Crafted with precision frames and lightweight comfort for long hours of use.",
  price: "100",
  children: [
    { color: "#2c3e50", frameSize: "S", price: 100 },
    { color: "#2c3e50", frameSize: "M", price: 120 },
    { color: "#2c3e50", frameSize: "L", price: 140 },
    { color: "#7f8c8d", frameSize: "S", price: 110 },
    { color: "#7f8c8d", frameSize: "M", price: 130 },
    { color: "#7f8c8d", frameSize: "L", price: 150 },
  ],
};

const Product = () => {
  const [option, setOption] = useState({ color: null, frameSize: null });
  const [showModal, setShowModal] = useState(false);
  const [cameraStream, setCameraStream] = useState(null);
  const videoRef = useRef(null);

  const getPrice = () => {
    const { color, frameSize } = option;
    if (!color || !frameSize) return product.price;
    const match = product.children.find(
      (item) => item.color === color && item.frameSize === frameSize
    );
    return match ? match.price : product.price;
  };

  const handleCamera = async () => {
    if (showModal) {
      setShowModal(false);
      if (cameraStream) {
        cameraStream.getTracks().forEach((track) => track.stop());
        setCameraStream(null);
      }
      return;
    }

    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true });
      setCameraStream(stream);
      setShowModal(true);
    } catch (err) {
      console.error("Camera access denied or not available:", err);
      alert("Camera access denied or not available.");
    }
  };

  useEffect(() => {
    if (showModal && videoRef.current && cameraStream) {
      videoRef.current.srcObject = cameraStream;
    }
  }, [showModal, cameraStream]);

  const closeModal = () => {
    if (cameraStream) {
      cameraStream.getTracks().forEach((track) => track.stop());
    }
    if (videoRef.current) {
      videoRef.current.srcObject = null;
    }
    setCameraStream(null);
    setShowModal(false);
  };

  const colors = [...new Set(product.children.map((p) => p.color))];
  const sizes = [...new Set(product.children.map((p) => p.frameSize))];

  return (
    <div className="product-wrapper">
      <div className="detail">
        <div>
          <img src="/image.png" alt="product" />
          {/* <div style={{ marginTop: '20px' }}>
            <button onClick={handleCamera}>Open Camera</button>
          </div> */}
        </div>

        <div className="content">
          <h2>{product.name}</h2>
          <p className="des">{product.description}</p>

          <p>
            <b>Colors</b>
          </p>
          <ul id="colors">
            {colors.map((color) => (
              <li
                key={color}
                style={{ backgroundColor: color }}
                className={option.color === color ? "active" : ""}
                onClick={() =>
                  setOption((prev) => ({
                    ...prev,
                    color: prev.color === color ? null : color,
                  }))
                }
              />
            ))}
          </ul>

          <p>
            <b>Sizes</b>
          </p>
          <ul id="sizes">
            {sizes.map((size) => (
              <li
                key={size}
                className={option.frameSize === size ? "active" : ""}
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
            <button onClick={handleCamera}>Camera</button>
          </div>
        </div>
      </div>

      {showModal && (
        //   <div className="modal-overlay">
        <div className="modal-content">
          <video
            ref={videoRef}
            autoPlay
            playsInline
            muted
            className="camera-video"
          />
          <div className="modal-buttons">
            {/* <button className="snap-btn">SNAP</button> */}
            {/* <button className="close-btn" onClick={closeModal}>CLOSE</button> */}
          </div>
        </div>
        // </div>
      )}
    </div>
  );
};

export default Product;
