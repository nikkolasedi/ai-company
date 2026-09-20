"use client";

import { Bloom, Vignette, BrightnessContrast, HueSaturation } from "@react-three/postprocessing";
import { BlendFunction } from "postprocessing";

interface PostEffectsProps {
  bloomIntensity: number;
  bloomThreshold: number;
  toyWorld?: boolean;
}

export function PostEffects({
  bloomIntensity,
  bloomThreshold,
  toyWorld = true,
}: PostEffectsProps) {
  return (
    <>
      <Bloom
        intensity={bloomIntensity * (toyWorld ? 1.15 : 1)}
        luminanceThreshold={bloomThreshold}
        luminanceSmoothing={0.35}
        mipmapBlur
      />
      {toyWorld && (
        <>
          <Vignette
            offset={0.25}
            darkness={0.55}
            blendFunction={BlendFunction.NORMAL}
          />
          <BrightnessContrast brightness={0.02} contrast={0.08} />
          <HueSaturation saturation={0.12} hue={0.02} />
        </>
      )}
    </>
  );
}
