"use client";

import { useMemo } from "react";
import * as THREE from "three";
import type { FaceExpression } from "@/lib/office/agent-behavior";

const EXPRESSIONS: Record<FaceExpression, { eyes: string; mouth: string }> = {
  neutral: { eyes: "oo", mouth: "—" },
  happy: { eyes: "^^", mouth: "◡" },
  think: { eyes: "..", mouth: "~" },
  alert: { eyes: "OO", mouth: "?" },
  sleep: { eyes: "--", mouth: "z" },
  sad: { eyes: "xx", mouth: "∩" },
  celebrate: { eyes: "★★", mouth: "D" },
};

function createFaceTexture(expression: FaceExpression): THREE.CanvasTexture {
  const size = 64;
  const canvas = document.createElement("canvas");
  canvas.width = size;
  canvas.height = size;
  const ctx = canvas.getContext("2d")!;

  ctx.fillStyle = "#1a2030";
  ctx.fillRect(0, 0, size, size);
  ctx.strokeStyle = "#3a4a60";
  ctx.lineWidth = 2;
  ctx.strokeRect(2, 2, size - 4, size - 4);

  const { eyes, mouth } = EXPRESSIONS[expression];
  ctx.fillStyle = "#7dd3fc";
  ctx.font = "bold 14px monospace";
  ctx.textAlign = "center";
  ctx.fillText(eyes.slice(0, 2), size * 0.35, size * 0.42);
  ctx.fillText(eyes.slice(2) || eyes.slice(0, 2), size * 0.65, size * 0.42);

  ctx.fillStyle = expression === "celebrate" ? "#fbbf24" : "#94a3b8";
  ctx.font = "bold 16px monospace";
  ctx.fillText(mouth, size * 0.5, size * 0.72);

  const tex = new THREE.CanvasTexture(canvas);
  tex.needsUpdate = true;
  return tex;
}

export function FaceScreen({
  expression,
  position = [0, 0.38, 0.09],
  scale = 0.14,
}: {
  expression: FaceExpression;
  position?: [number, number, number];
  scale?: number;
}) {
  const texture = useMemo(() => createFaceTexture(expression), [expression]);

  return (
    <mesh position={position} scale={[scale, scale, scale]}>
      <planeGeometry args={[1, 1]} />
      <meshStandardMaterial
        map={texture}
        emissive="#7dd3fc"
        emissiveIntensity={0.35}
        roughness={0.2}
        metalness={0.1}
        transparent
        opacity={0.95}
      />
    </mesh>
  );
}
