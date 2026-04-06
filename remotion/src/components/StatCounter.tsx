import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export type StatCounterProps = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  startFrame?: number;
  color?: string;
  size?: 'small' | 'medium' | 'large';
};

export const StatCounter: React.FC<StatCounterProps> = ({
  value,
  suffix = '',
  prefix = '',
  label,
  startFrame = 0,
  color = '#10B981',
  size = 'large',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const counterDuration = fps * 1.5;
  const counterProgress = interpolate(localFrame, [0, counterDuration], [0, 1], {
    extrapolateRight: 'clamp',
  });
  const easedProgress = 1 - Math.pow(1 - counterProgress, 3);
  const currentValue = Math.round(value * easedProgress);

  const scale = spring({ frame: localFrame, fps, config: { damping: 12, stiffness: 150 } });

  const labelOpacity = interpolate(localFrame, [fps * 0.5, fps * 1], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const labelY = interpolate(localFrame, [fps * 0.5, fps * 1], [20, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const glowIntensity = interpolate(
    Math.sin((localFrame / fps) * Math.PI * 2),
    [-1, 1],
    [0.3, 0.6]
  );

  const sizes = {
    small: { number: 80, label: 24 },
    medium: { number: 120, label: 32 },
    large: { number: 160, label: 40 },
  };
  const { number: numberSize, label: labelSize } = sizes[size];

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16, transform: `scale(${scale})` }}>
      <div
        style={{
          fontSize: numberSize,
          fontWeight: 900,
          fontFamily: 'Arial Black, Impact, sans-serif',
          color,
          textShadow: `0 0 ${40 * glowIntensity}px ${color}, 0 4px 20px rgba(0,0,0,0.5)`,
          letterSpacing: -2,
        }}
      >
        {prefix}{currentValue.toLocaleString()}{suffix}
      </div>
      <div
        style={{
          fontSize: labelSize,
          fontWeight: 700,
          color: 'white',
          textTransform: 'uppercase',
          letterSpacing: 4,
          opacity: labelOpacity,
          transform: `translateY(${labelY}px)`,
          textShadow: '0 2px 10px rgba(0,0,0,0.5)',
        }}
      >
        {label}
      </div>
    </div>
  );
};
