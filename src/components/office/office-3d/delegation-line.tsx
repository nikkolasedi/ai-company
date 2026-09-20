"use client";

import { Line } from "@react-three/drei";

export function DelegationLine({
  from,
  to,
  color = "#06b6d4",
}: {
  from: [number, number, number];
  to: [number, number, number];
  color?: string;
}) {
  return (
    <Line
      points={[
        [from[0], 0.5, from[2]],
        [to[0], 0.5, to[2]],
      ]}
      color={color}
      lineWidth={1.5}
      dashed
      dashScale={2}
      dashSize={0.3}
      gapSize={0.2}
      transparent
      opacity={0.65}
    />
  );
}
