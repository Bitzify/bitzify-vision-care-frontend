import React, { useEffect, useRef, useState } from 'react';
import * as THREE from 'three';
import { GLTFLoader } from 'three/examples/jsm/loaders/GLTFLoader.js';
import useFaceMesh from '../hooks/useFaceMesh';

import {
  landmarkToWorldPoint,
  solveTransform,
  smoothApply,
} from '../utils/arMath';

const IDS = {
  NOSE_BRIDGE: 168,
  CHIN_CENTER: 152,
  PUPIL_L: 468,
  PUPIL_R: 473,
  TEMPLE_L: 172,
  TEMPLE_R: 397,
};

export default function ARGlasses({
  modelPath = '/models/ray-ban_glasses.glb',
  widthMult = 2,
  debug = false,
  onClose,
}) {
  const containerRef = useRef(null);
  const videoRef = useRef(null);
  const rendererRef = useRef(null);
  const [isVideoReady, setIsVideoReady] = useState(false);
  const [threeCtx, setThreeCtx] = useState(null);
  const [pdMmDisplay, setPdMmDisplay] = useState(null);


  // Setup video
  useEffect(() => {
    const video = document.createElement('video');
    video.muted = true;
    video.autoplay = true;
    video.playsInline = true;
    video.style.position = 'absolute';
    video.style.inset = '0';
    video.style.width = '100%';
    video.style.height = '100%';
    video.style.objectFit = 'cover';
    video.style.transform = 'scaleX(-1)';
    video.style.zIndex = '0';

    videoRef.current = video;

    const handleLoadedData = () => setIsVideoReady(true);
    video.addEventListener('loadeddata', handleLoadedData);

    return () => {
      video.removeEventListener('loadeddata', handleLoadedData);
      if (video.srcObject) {
        video.srcObject.getTracks().forEach((track) => track.stop());
      }
      video.remove();
    };
  }, []);

  useEffect(() => {
    if (!isVideoReady || !containerRef.current || !videoRef.current) return;
    containerRef.current.appendChild(videoRef.current);
    return () => {
      if (containerRef.current && videoRef.current && containerRef.current.contains(videoRef.current)) {
        containerRef.current.removeChild(videoRef.current);
         }
      };  
  }, [isVideoReady]);

  const landmarks = useFaceMesh(videoRef.current, { selfie: true, skip: 1 });

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;

    const scene = new THREE.Scene();
    const camera = new THREE.PerspectiveCamera(60, el.clientWidth / el.clientHeight, 0.01, 10);
    const renderer = new THREE.WebGLRenderer({ alpha: true, antialias: true });

    renderer.setSize(el.clientWidth, el.clientHeight);
    renderer.setPixelRatio(window.devicePixelRatio || 1);
    renderer.domElement.style.position = 'absolute';
    renderer.domElement.style.inset = '0';
    renderer.domElement.style.width = '100%';
    renderer.domElement.style.height = '100%';
    renderer.domElement.style.transform = 'scaleX(-1)';
    renderer.domElement.style.pointerEvents = 'none';
    renderer.domElement.style.zIndex = '1';

    rendererRef.current = renderer.domElement;
    el.appendChild(renderer.domElement);

    scene.add(new THREE.AmbientLight(0xffffff, 0.6));
    const dir = new THREE.DirectionalLight(0xffffff, 0.8);
    dir.position.set(0, 1, 0.8);
    scene.add(dir);

    const raycaster = new THREE.Raycaster();
    const loader = new GLTFLoader();

    loader.load(modelPath, (gltf) => {
      const glasses = gltf.scene;
      const bbox = new THREE.Box3().setFromObject(glasses);
      const size = new THREE.Vector3();
      bbox.getSize(size);
      const scaleFactor = 1 / size.x;
      glasses.scale.setScalar(scaleFactor);
      glasses.position.sub(bbox.getCenter(new THREE.Vector3()));
      glasses.rotation.y = Math.PI;
      scene.add(glasses);

      const dbg = [];
      if (debug) {
        const mat = new THREE.MeshBasicMaterial({ color: 0xff0000 });
        for (let i = 0; i < 6; i++) {
          const s = new THREE.Mesh(new THREE.SphereGeometry(0.008, 8, 8), mat);
          scene.add(s);
          dbg.push(s);
        }
      }

      setThreeCtx({ scene, camera, renderer, raycaster, glasses, dbg });
    }, undefined, (err) => console.error('GLB load error', err));

    const resize = () => {
      camera.aspect = el.clientWidth / el.clientHeight;
      camera.updateProjectionMatrix();
      renderer.setSize(el.clientWidth, el.clientHeight);
    };
    window.addEventListener('resize', resize);

    return () => {
      window.removeEventListener('resize', resize);
      renderer.dispose();
      try {
        if (rendererRef.current?.parentNode) {
          rendererRef.current.parentNode.removeChild(rendererRef.current);
        }
      } catch (error) {
        console.warn('Renderer element cleanup failed:', error);
      }
      rendererRef.current = null;
    };
  }, [modelPath, debug]);

  useEffect(() => {
    if (!threeCtx) return;
    const { scene, camera, renderer } = threeCtx;
    let frameId;
    const renderLoop = () => {
      frameId = requestAnimationFrame(renderLoop);
      renderer.render(scene, camera);
    };
    renderLoop();
    return () => cancelAnimationFrame(frameId);
  }, [threeCtx]);

  useEffect(() => {
    if (!landmarks || !threeCtx) return;
    const { camera, raycaster, glasses, dbg } = threeCtx;

    const wp = (idx) => landmarkToWorldPoint(landmarks[idx], camera, raycaster);
    const nose = wp(IDS.NOSE_BRIDGE);
    const chin = wp(IDS.CHIN_CENTER);
    const tL = wp(IDS.TEMPLE_L);
    const tR = wp(IDS.TEMPLE_R);
    const pL = wp(IDS.PUPIL_L);
    const pR = wp(IDS.PUPIL_R);

    const pdScene = pL.distanceTo(pR); // PD in scene units
    const averagePDmm = 63.0;
    const scaleFactor = averagePDmm / pdScene; // mm per scene unit
    const pdMm = pdScene * scaleFactor; // Final PD in mm
    setPdMmDisplay(Math.round(pdMm));


    if (debug && dbg.length) {
      [pL, pR, tL, tR, nose, chin].forEach((pt, i) => dbg[i].position.copy(pt));
    }

    const target = solveTransform({ nose, chin, tL, tR, pL, pR }, widthMult);
    smoothApply(glasses, target, 0.6);

    const inward = new THREE.Vector3(0, 0, -0.2);

    inward.applyQuaternion(glasses.quaternion);
    glasses.position.add(inward);
  }, [landmarks, threeCtx, widthMult, debug]);

  useEffect(() => {
    if (!onClose) return;
    const h = (e) => {
      if (e.key === 'Escape') onClose();
    };
    window.addEventListener('keydown', h);
    return () => window.removeEventListener('keydown', h);
  }, [onClose]);

  return (
    <div
      ref={containerRef}
      style={{
        width: '100%',
        height: '100%',
        position: 'relative',
        backgroundColor: '#000',
      }}
    >
{!isVideoReady && (
  <div style={{
    position: 'absolute',
    inset: '0',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    color: '#fff',
    fontFamily: '-apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif',
    zIndex: '2'
  }}>
    Starting camera...
  </div>
)}
{pdMmDisplay && (
  <div style={{
    position: 'absolute',
    top: '1rem',
    right: '1rem',
    backgroundColor: 'rgba(0,0,0,0.7)',
    color: 'white',
    padding: '0.5rem 1rem',
    borderRadius: '8px',
    fontSize: '1rem',
    zIndex: 100
  }}>
    PD: {pdMmDisplay} mm
  </div>
)}
    </div>
    
  );
}
