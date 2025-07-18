import { useEffect, useRef, useState } from 'react';
import { FaceMesh } from '@mediapipe/face_mesh';
import { Camera } from '@mediapipe/camera_utils';

/**
 * React hook – returns latest MediaPipe Face Mesh landmarks for the **first** face.
 * Manages its own MediaPipe instance and webcam lifecycle.
 *
 * @param {HTMLVideoElement|null} videoEl   ready <video> element (muted, autoplay)
 * @param {Object}     [opts]
 * @param {boolean}    [opts.selfie=true]   mirror horizontally (front camera)
 * @param {number}     [opts.skip=1]        process every N‑th frame
 * @returns {Array|null} 468‑length landmark array or null until detected
 */
export default function useFaceMesh(
  videoEl,
  { selfie = true, skip = 1 } = {},
) {
  const [landmarks, setLandmarks] = useState(null);
  const frameIdx = useRef(0);

  useEffect(() => {
    if (!videoEl) return;

    let cameraObj = null;
    let cancelled = false;

    (async () => {
      const faceMesh = new FaceMesh({
        locateFile: (f) =>
          `https://cdn.jsdelivr.net/npm/@mediapipe/face_mesh/${f}`,
      });

      faceMesh.setOptions({
        maxNumFaces: 1,
        refineLandmarks: true,
        selfieMode: selfie,
        minDetectionConfidence: 0.5,
        minTrackingConfidence: 0.5,
      });

      faceMesh.onResults((res) => {
        if (cancelled) return;
        if (!res.multiFaceLandmarks?.length) return;
        if (frameIdx.current++ % skip) return;
        setLandmarks(res.multiFaceLandmarks[0]);
      });

      // Start webcam & pump frames into MediaPipe
      cameraObj = new Camera(videoEl, {
        onFrame: async () => {
          if (videoEl.videoWidth) {
            await faceMesh.send({ image: videoEl });
          }
        },
        width: 1280,
        height: 720,
      });

      cameraObj.start();
    })();

    return () => {
      cancelled = true;
      if (cameraObj && cameraObj.stop) cameraObj.stop();
      if (videoEl.srcObject) {
        videoEl.srcObject.getTracks().forEach((t) => t.stop());
        videoEl.srcObject = null;
      }
    };
  }, [videoEl, selfie, skip]);

  return landmarks;
}
