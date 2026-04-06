import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export type ProgressBarItem = {
  label: string;
  value: number; // 0-100
  color?: string;
};

export type ProgressBarProps = {
  items: ProgressBarItem[];
  startFrame?: number;
  staggerMs?: number;
  showValues?: boolean;
  maxValue?: number;
  layout?: 'horizontal' | 'vertical';
};

const DEFAULT_COLORS = ['#10B981', '#3B82F6', '#F59E0B', '#EF4444', '#8B5CF6'];

export const ProgressBar: React.FC<ProgressBarProps> = ({
  items,
  startFrame = 0,
  staggerMs = 400,
  showValues = true,
  maxValue = 100,
  layout = 'horizontal',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const staggerFrames = (staggerMs / 1000) * fps;

  if (layout === 'vertical') {
    return (
      <div
        style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 40, height: 500, padding: '0 60px' }}
      >
        {items.map((item, index) => {
          const itemLocalFrame = localFrame - index * staggerFrames;
          if (itemLocalFrame < 0) return null;

          const barHeight = interpolate(itemLocalFrame, [0, fps * 0.8], [0, (item.value / maxValue) * 400], { extrapolateRight: 'clamp' });
          const labelOpacity = interpolate(itemLocalFrame, [fps * 0.5, fps * 0.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const color = item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

          return (
            <div key={index} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16 }}>
              {showValues && (
                <div style={{ fontSize: 36, fontWeight: 900, color, opacity: labelOpacity, textShadow: `0 0 20px ${color}` }}>
                  {item.value}%
                </div>
              )}
              <div style={{ width: 80, height: barHeight, backgroundColor: color, borderRadius: 12, boxShadow: `0 0 30px ${color}66` }} />
              <div style={{ fontSize: 28, fontWeight: 700, color: 'white', textAlign: 'center', opacity: labelOpacity, textShadow: '0 2px 8px rgba(0,0,0,0.8)', maxWidth: 120 }}>
                {item.label}
              </div>
            </div>
          );
        })}
      </div>
    );
  }

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 40, padding: '0 60px', width: '100%' }}>
      {items.map((item, index) => {
        const itemLocalFrame = localFrame - index * staggerFrames;
        if (itemLocalFrame < 0) return null;

        const barWidth = interpolate(itemLocalFrame, [0, fps * 0.8], [0, item.value], { extrapolateRight: 'clamp' });
        const labelOpacity = interpolate(itemLocalFrame, [0, fps * 0.3], [0, 1], { extrapolateRight: 'clamp' });
        const displayValue = Math.round(interpolate(itemLocalFrame, [0, fps * 0.8], [0, item.value], { extrapolateRight: 'clamp' }));
        const color = item.color ?? DEFAULT_COLORS[index % DEFAULT_COLORS.length];

        return (
          <div key={index} style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', opacity: labelOpacity }}>
              <span style={{ fontSize: 36, fontWeight: 800, color: 'white', textShadow: '0 2px 8px rgba(0,0,0,0.8)' }}>
                {item.label}
              </span>
              {showValues && (
                <span style={{ fontSize: 36, fontWeight: 900, color, textShadow: `0 0 15px ${color}` }}>
                  {displayValue}%
                </span>
              )}
            </div>
            <div style={{ width: '100%', height: 32, backgroundColor: 'rgba(255,255,255,0.2)', borderRadius: 16, overflow: 'hidden' }}>
              <div style={{ width: `${barWidth}%`, height: '100%', backgroundColor: color, borderRadius: 16, boxShadow: `0 0 20px ${color}` }} />
            </div>
          </div>
        );
      })}
    </div>
  );
};
