import * as THREE from 'three';

const DEPTH_BASE = 0.5;
const DEPTH_SCALE = 0.7;

/**
 * Convert MediaPipe landmark → world‑space point via ray‑casting heuristic.
 */
export function landmarkToWorldPoint(landmark, camera, raycaster) {
  const ndc = new THREE.Vector2(
    (1 - landmark.x) * 2 - 1,
    -(landmark.y * 2 - 1),
  );
  raycaster.setFromCamera(ndc, camera);
  const depth = DEPTH_BASE + landmark.z * DEPTH_SCALE;
  return raycaster.ray.origin
    .clone()
    .add(raycaster.ray.direction.clone().multiplyScalar(depth));
}

/**
 * Solve target transform (pos, quat, scale) for glasses frame.
 */
export function solveTransform(pts, widthMult = 2, scaleFactor = null) {
  const { nose, chin, tL, tR, pL, pR } = pts;

  const xAxis = tL.clone().sub(tR).normalize();
  const yAxis = chin.clone().sub(nose).normalize();
  const zAxis = new THREE.Vector3().crossVectors(xAxis, yAxis).normalize().multiplyScalar(-1);
  yAxis.crossVectors(zAxis, xAxis).normalize();

  const rotMat = new THREE.Matrix4().makeBasis(xAxis, yAxis, zAxis);
  const quat = new THREE.Quaternion().setFromRotationMatrix(rotMat);

  const PD = pL.distanceTo(pR); // scene units
  const desiredWidth = scaleFactor ? scaleFactor * PD : PD * widthMult;
  const scale = new THREE.Vector3(desiredWidth, desiredWidth, desiredWidth);

  const pos = nose.clone();
  return { pos, quat, scale };
}

/**
 * Smoothly lerp/slerp current transform toward target.
 */
export function smoothApply(obj, target, alpha = 0.6) {
  obj.position.lerp(target.pos, alpha);
  obj.scale.lerp(target.scale, alpha);
  obj.quaternion.slerp(target.quat, alpha);
}
