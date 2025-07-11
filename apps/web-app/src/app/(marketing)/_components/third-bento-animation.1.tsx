'use client';

import NumberFlow from '@number-flow/react';
import { colorWithOpacity, getRGBA } from '@unhook/ui/magicui/utils';
import { motion, useInView } from 'motion/react';
import {
  type CSSProperties,
  useCallback,
  useEffect,
  useRef,
  useState,
} from 'react';

interface LineChartProps {
  data: number[];
  height?: number;
  width?: number;
  color: string;
  shouldAnimate: boolean;
  startAnimationDelay?: number;
}

export function LineChart({
  data,
  height = 200,
  width = 600,
  color,
  shouldAnimate,
  startAnimationDelay,
}: LineChartProps) {
  const svgRef = useRef<SVGSVGElement>(null);

  // Create smooth curve points using bezier curves
  const createSmoothPath = (points: { x: number; y: number }[]) => {
    if (points.length < 2) return '';

    const path = points.reduce((acc, point, i, arr) => {
      if (i === 0) {
        // Move to the first point
        return `M ${point.x} ${point.y}`;
      }

      // Calculate control points for smooth curve
      const prev = arr[i - 1];
      const next = arr[i + 1];
      const smoothing = 0.2;

      // If it's the last point, we don't need a curve
      if (i === arr.length - 1) {
        return `${acc} L ${point.x} ${point.y}`;
      }

      // Calculate control points
      const cp1x = (prev?.x ?? 0) + (point.x - (prev?.x ?? 0)) * smoothing;
      const cp1y = (prev?.y ?? 0) + (point.y - (prev?.y ?? 0)) * smoothing;
      const cp2x = (next?.x ?? 0) + (point.x - (next?.x ?? 0)) * smoothing;
      const cp2y = (next?.y ?? 0) + (point.y - (next?.y ?? 0)) * smoothing;

      return `${acc} C ${cp1x},${cp1y} ${cp2x},${cp2y} ${point.x},${point.y}`;
    }, '');

    return path;
  };

  // Convert data points to coordinates
  const coordinates = data.map((value, index) => ({
    x: (index / (data.length - 1)) * width,
    y: height - (value / Math.max(...data)) * height * 0.8, // Add some padding at top
  }));

  // Create smooth path
  const smoothPath = createSmoothPath(coordinates);

  // Find the middle point coordinates
  const middleIndex = Math.floor(data.length / 2);
  const middlePoint = coordinates[middleIndex];

  const [showPulse, setShowPulse] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) {
      setShowPulse(false);
      return;
    }

    const timeoutId = setTimeout(
      () => {
        setShowPulse(true);
      },
      (startAnimationDelay || 0) * 1000,
    );

    return () => clearTimeout(timeoutId);
  }, [shouldAnimate, startAnimationDelay]);

  const [computedColor, setComputedColor] = useState(color);

  useEffect(() => {
    setComputedColor(getRGBA(color));
  }, [color]);

  const getColorWithOpacity = useCallback(
    (opacity: number) => colorWithOpacity(computedColor, opacity),
    [computedColor],
  );

  return (
    <svg
      fill="none"
      height={height}
      ref={svgRef}
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      xmlns="http://www.w3.org/2000/svg"
    >
      <title>Webhook Line Chart</title>
      {/* Gradient Definition */}
      <defs>
        <linearGradient id="lineGradient" x1="0" x2="0" y1="0" y2="1">
          <stop offset="0%" stopColor={getColorWithOpacity(0.3)} />
          <stop offset="100%" stopColor={getColorWithOpacity(0)} />
        </linearGradient>
      </defs>

      {/* Animated Area Fill */}
      <motion.path
        animate={{
          opacity: shouldAnimate ? 1 : 0,
          scale: shouldAnimate ? 1 : 0.95,
        }}
        d={`${smoothPath} L ${width},${height} L 0,${height} Z`}
        fill="url(#lineGradient)"
        initial={{ opacity: 0, scale: 0.95 }}
        transition={{
          delay: startAnimationDelay,
          duration: 0.8,
          ease: 'easeOut',
        }}
      />

      {/* Animated Line */}
      <motion.path
        animate={{ pathLength: shouldAnimate ? 1 : 0 }}
        d={smoothPath}
        fill="none"
        initial={{ pathLength: 0 }}
        stroke={color}
        strokeLinecap="round"
        strokeWidth="2"
        transition={{
          delay: startAnimationDelay,
          duration: 1.5,
          ease: 'easeInOut',
        }}
      />

      {/* Center dot with scale animation */}
      <motion.circle
        animate={{
          opacity: shouldAnimate ? 1 : 0,
          scale: shouldAnimate ? 1 : 0,
        }}
        cx={middlePoint?.x ?? 0}
        cy={middlePoint?.y ?? 0}
        fill={color}
        initial={{ opacity: 0, scale: 0 }}
        r="4"
        transition={{
          delay: startAnimationDelay ? startAnimationDelay + 0.3 : 0.3,
          duration: 0.4,
          ease: 'backOut',
        }}
      />

      {/* Multiple pulsing waves */}
      {showPulse &&
        [0, 1, 2].map((index) => (
          <motion.circle
            animate={{
              opacity: [0.8, 0],
              scale: [0.5, 2],
            }}
            cx={middlePoint?.x ?? 0}
            cy={middlePoint?.y ?? 0}
            fill="none"
            initial={{ opacity: 0, scale: 0.5 }}
            key={index}
            r="10"
            stroke={color}
            strokeWidth="2"
            transition={{
              delay: index * 0.67,
              duration: 2,
              ease: 'easeOut',
              repeat: Number.POSITIVE_INFINITY,
              repeatDelay: 0,
              times: [0, 1],
            }}
          />
        ))}
    </svg>
  );
}

export function NumberFlowCounter({
  toolTipValues,
  shouldAnimate,
  startAnimationDelay,
}: {
  toolTipValues: number[];
  shouldAnimate: boolean;
  startAnimationDelay?: number;
}) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const currentValue = toolTipValues[currentIndex];
  const [showCounter, setShowCounter] = useState(false);

  useEffect(() => {
    if (!shouldAnimate) {
      setShowCounter(false);
      return;
    }

    const timeoutId = setTimeout(
      () => {
        setShowCounter(true);
      },
      (startAnimationDelay || 0) * 1000,
    );

    return () => clearTimeout(timeoutId);
  }, [shouldAnimate, startAnimationDelay]);

  useEffect(() => {
    if (!showCounter) return;

    const intervalId = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % toolTipValues.length);
    }, 2000);

    return () => {
      if (intervalId) clearInterval(intervalId);
    };
  }, [showCounter, toolTipValues.length]);

  return (
    <div
      className={`${
        showCounter ? 'opacity-100' : 'opacity-0'
      } transition-opacity duration-300 ease-in-out absolute top-32 left-[42%] -translate-x-1/2 text-sm bg-[#1A1B25] border border-white/[0.07] text-white px-4 py-1 rounded-full h-8 flex items-center justify-center font-mono shadow-[0px_1.1px_0px_0px_rgba(255,255,255,0.20)_inset,0px_4.4px_6.6px_0px_rgba(255,255,255,0.01)_inset,0px_2.2px_6.6px_0px_rgba(18,43,105,0.04),0px_1.1px_2.2px_0px_rgba(18,43,105,0.08),0px_0px_0px_1.1px_rgba(18,43,105,0.08)]`}
    >
      <NumberFlow
        className="font-mono"
        format={{
          minimumIntegerDigits: 1,
          useGrouping: true,
        }}
        transformTiming={{
          duration: 700,
          easing: 'ease-out',
        }}
        value={currentValue ?? 0}
      />
    </div>
  );
}

export function ThirdBentoAnimation({
  data,
  toolTipValues,
  color = 'var(--secondary)',
  startAnimationDelay = 0,
  once = false,
}: {
  data: number[];
  toolTipValues: number[];
  color?: string;
  startAnimationDelay?: number;
  once?: boolean;
}) {
  const ref = useRef(null);
  const isInView = useInView(ref, { once });
  const [shouldAnimate, setShouldAnimate] = useState(false);
  const [computedColor, setComputedColor] = useState(color);

  useEffect(() => {
    setComputedColor(getRGBA(color));
  }, [color]);

  useEffect(() => {
    if (isInView) {
      setShouldAnimate(true);
    } else {
      setShouldAnimate(false);
    }
  }, [isInView]);

  return (
    <div
      className="relative flex size-full items-center justify-center h-[300px] pt-10 overflow-hidden"
      ref={ref}
      style={
        {
          '--color': computedColor,
        } as CSSProperties
      }
    >
      <motion.div
        animate={{ opacity: shouldAnimate ? 1 : 0 }}
        className="absolute top-[60%] left-1/2 -translate-x-1/2 w-[2px] h-32 bg-gradient-to-b from-[var(--color)] to-[var(--color-transparent)]"
        initial={{ opacity: 0 }}
        transition={{
          delay: startAnimationDelay ? startAnimationDelay + 0.3 : 0.3,
          duration: 0.5,
          ease: 'easeOut',
        }}
      />
      <NumberFlowCounter
        shouldAnimate={shouldAnimate}
        startAnimationDelay={startAnimationDelay}
        toolTipValues={toolTipValues}
      />
      <LineChart
        color={computedColor}
        data={data}
        height={200}
        shouldAnimate={shouldAnimate}
        startAnimationDelay={startAnimationDelay}
        width={600}
      />
    </div>
  );
}
