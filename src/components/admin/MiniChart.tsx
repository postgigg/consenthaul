'use client';

interface MiniChartProps {
  data: number[];
  width?: number;
  height?: number;
  color?: string;
  className?: string;
}

/**
 * Simple SVG sparkline — no external chart library needed.
 */
export function MiniChart({
  data,
  width = 80,
  height = 32,
  color = '#C8A75E',
  className,
}: MiniChartProps) {
  if (data.length < 2) return null;

  const max = Math.max(...data);
  const min = Math.min(...data);
  const range = max - min || 1;
  const padding = 2;
  const innerW = width - padding * 2;
  const innerH = height - padding * 2;

  const points = data
    .map((val, i) => {
      const x = padding + (i / (data.length - 1)) * innerW;
      const y = padding + innerH - ((val - min) / range) * innerH;
      return `${x},${y}`;
    })
    .join(' ');

  // Fill area under the line
  const firstX = padding;
  const lastX = padding + innerW;
  const fillPoints = `${firstX},${height} ${points} ${lastX},${height}`;

  return (
    <svg
      width={width}
      height={height}
      viewBox={`0 0 ${width} ${height}`}
      className={className}
    >
      <polygon points={fillPoints} fill={color} opacity="0.1" />
      <polyline
        points={points}
        fill="none"
        stroke={color}
        strokeWidth="1.5"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}
