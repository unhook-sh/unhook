"use client";

import type { COBEOptions } from "cobe";
import { useCallback, useEffect, useRef } from "react";
import createGlobe from "cobe";
import { useTheme } from "next-themes";
import { useSpring } from "react-spring";

import { cn } from "@acme/ui/lib/utils";

const GLOBE_CONFIG: COBEOptions = {
  baseColor: [1, 1, 1],
  dark: 1,
  devicePixelRatio: 2,
  diffuse: 3,
  glowColor: [1.2, 1.2, 1.2],
  height: 800,
  mapBrightness: 1.2,
  mapSamples: 16_000,
  markerColor: [117 / 255, 169 / 255, 156 / 255],
  markers: [
    { location: [37.7749, -122.4194], size: 0.5 }, // San Francisco, USA
    { location: [34.0522, -118.2437], size: 0.4 }, // Los Angeles, USA
    { location: [40.7128, -74.006], size: 0.5 }, // New York City, USA
    { location: [51.5074, -0.1278], size: 0.3 }, // London, UK
    { location: [48.8566, 2.3522], size: 0.2 }, // Paris, France
    { location: [52.52, 13.405], size: 0.2 }, // Berlin, Germany
    { location: [55.7558, 37.6173], size: 0.2 }, // Moscow, Russia
    { location: [35.6895, 139.6917], size: 0.3 }, // Tokyo, Japan
    { location: [19.076, 72.8777], size: 0.3 }, // Mumbai, India
    { location: [31.2304, 121.4737], size: 0.3 }, // Shanghai, China
    { location: [39.9042, 116.4074], size: 0.3 }, // Beijing, China
    { location: [-33.8688, 151.2093], size: 0.2 }, // Sydney, Australia
    { location: [1.3521, 103.8198], size: 0.3 }, // Singapore
    { location: [22.3964, 114.1095], size: 0.3 }, // Hong Kong
    { location: [37.5665, 126.978], size: 0.2 }, // Seoul, South Korea
  ],
  onRender: () => {},
  phi: 0,
  theta: 0.3,
  width: 800,
};

export function Globe({
  className,
  config = GLOBE_CONFIG,
}: {
  className?: string;
  config?: COBEOptions;
}) {
  let phi = 0;
  let width = 0;
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const pointerInteracting = useRef(null);
  const pointerInteractionMovement = useRef(0);
  const theme = useTheme();
  const [{ r }, api] = useSpring(() => ({
    config: {
      friction: 40,
      mass: 1,
      precision: 0.001,
      tension: 280,
    },
    r: 0,
  }));

  const updatePointerInteraction = (value: any) => {
    pointerInteracting.current = value;
    canvasRef.current!.style.cursor = value ? "grabbing" : "grab";
  };

  const updateMovement = (clientX: any) => {
    if (pointerInteracting.current !== null) {
      const delta = clientX - pointerInteracting.current;
      pointerInteractionMovement.current = delta;
      api.start({ r: delta / 200 });
    }
  };

  const onRender = useCallback(
    (state: Record<string, any>) => {
      if (!pointerInteracting.current) phi += 0.005;
      state.phi = phi + r.get();
      state.width = width * 2;
      state.height = width * 2;
    },
    [pointerInteracting, phi, r],
  );

  const onResize = () => {
    if (canvasRef.current) {
      width = canvasRef.current.offsetWidth;
    }
  };

  useEffect(() => {
    window.addEventListener("resize", onResize);
    onResize();

    const globe = createGlobe(canvasRef.current!, {
      ...config,
      dark: theme.theme === "dark" ? 1 : 0,
      height: width * 2,
      onRender,
      opacity: 0.5,
      width: width * 2,
    });

    setTimeout(() => (canvasRef.current!.style.opacity = "1"));
    return () => globe.destroy();
  }, [theme.theme]);

  return (
    <div
      className={cn(
        "inset-0 mx-auto aspect-1/1 w-full max-w-[600px]",
        className,
      )}
    >
      <canvas
        className={cn(
          "h-full w-full opacity-0 transition-opacity duration-500 [contain:layout_paint_size]",
        )}
        ref={canvasRef}
        onPointerDown={(e) =>
          updatePointerInteraction(
            e.clientX - pointerInteractionMovement.current,
          )
        }
        onPointerUp={() => updatePointerInteraction(null)}
        onPointerOut={() => updatePointerInteraction(null)}
        onMouseMove={(e) => updateMovement(e.clientX)}
        onTouchMove={(e) =>
          e.touches[0] && updateMovement(e.touches[0].clientX)
        }
      />
    </div>
  );
}
