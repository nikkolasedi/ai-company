"use client";

import { useFrame } from "@react-three/fiber";
import { useMemo, useRef } from "react";
import * as THREE from "three";

const POOL = 24;

export function WorkParticles({
  active,
  position,
}: {
  active: boolean;
  position: [number, number, number];
}) {
  const pointsRef = useRef<THREE.Points>(null);
  const life = useRef(new Float32Array(POOL));
  const vel = useMemo(() => {
    const v = new Float32Array(POOL * 3);
    for (let i = 0; i < POOL; i++) {
      v[i * 3] = (Math.random() - 0.5) * 0.04;
      v[i * 3 + 1] = Math.random() * 0.06 + 0.02;
      v[i * 3 + 2] = (Math.random() - 0.5) * 0.04;
    }
    return v;
  }, []);

  const positions = useMemo(() => new Float32Array(POOL * 3), []);

  useFrame((_, delta) => {
    if (!pointsRef.current || !active) return;
    const geo = pointsRef.current.geometry as THREE.BufferGeometry;
    const attr = geo.getAttribute("position") as THREE.BufferAttribute;

    for (let i = 0; i < POOL; i++) {
      life.current[i] -= delta;
      if (life.current[i] <= 0) {
        life.current[i] = 0.3 + Math.random() * 0.4;
        positions[i * 3] = position[0] + (Math.random() - 0.5) * 0.3;
        positions[i * 3 + 1] = position[1] + 0.35 + Math.random() * 0.1;
        positions[i * 3 + 2] = position[2] + (Math.random() - 0.5) * 0.2;
      } else {
        positions[i * 3] += vel[i * 3];
        positions[i * 3 + 1] += vel[i * 3 + 1] * delta;
        positions[i * 3 + 2] += vel[i * 3 + 2];
      }
      attr.setXYZ(i, positions[i * 3], positions[i * 3 + 1], positions[i * 3 + 2]);
    }
    attr.needsUpdate = true;
  });

  if (!active) return null;

  return (
    <points ref={pointsRef} position={[0, 0, 0]}>
      <bufferGeometry>
        <bufferAttribute
          attach="attributes-position"
          args={[positions, 3]}
          count={POOL}
        />
      </bufferGeometry>
      <pointsMaterial
        size={0.06}
        color="#fbbf24"
        transparent
        opacity={0.85}
        depthWrite={false}
        blending={THREE.AdditiveBlending}
      />
    </points>
  );
}
