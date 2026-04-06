import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export type ListItem = {
  icon?: string;
  text: string;
  highlight?: boolean;
};

export type ListRevealProps = {
  items: ListItem[];
  startFrame?: number;
  staggerMs?: number;
  iconColor?: string;
  highlightColor?: string;
};

export const ListReveal: React.FC<ListRevealProps> = ({
  items,
  startFrame = 0,
  staggerMs = 600,
  iconColor = '#10B981',
  highlightColor = '#FFFF00',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const staggerFrames = (staggerMs / 1000) * fps;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 32, padding: '0 60px', width: '100%' }}>
      {items.map((item, index) => {
        const itemLocalFrame = localFrame - index * staggerFrames;
        if (itemLocalFrame < 0) return null;

        const scale = spring({ frame: itemLocalFrame, fps, config: { damping: 12, stiffness: 120 } });
        const slideX = interpolate(itemLocalFrame, [0, fps * 0.3], [-100, 0], { extrapolateRight: 'clamp' });
        const opacity = interpolate(itemLocalFrame, [0, fps * 0.2], [0, 1], { extrapolateRight: 'clamp' });
        const iconScale = item.highlight ? 1 + 0.1 * Math.sin((localFrame / fps) * Math.PI * 3) : 1;

        return (
          <div
            key={index}
            style={{ display: 'flex', alignItems: 'center', gap: 24, opacity, transform: `translateX(${slideX}px) scale(${scale})` }}
          >
            <div
              style={{
                width: 64,
                height: 64,
                borderRadius: '50%',
                backgroundColor: item.highlight ? highlightColor : iconColor,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: 32,
                fontWeight: 900,
                color: item.highlight ? '#000' : '#fff',
                flexShrink: 0,
                transform: `scale(${iconScale})`,
                boxShadow: item.highlight ? `0 0 30px ${highlightColor}` : `0 0 20px ${iconColor}66`,
              }}
            >
              {item.icon ?? index + 1}
            </div>
            <div
              style={{
                fontSize: 44,
                fontWeight: 800,
                color: item.highlight ? highlightColor : 'white',
                textShadow: item.highlight
                  ? `0 0 20px ${highlightColor}, 0 2px 10px rgba(0,0,0,0.8)`
                  : '0 2px 10px rgba(0,0,0,0.8)',
                lineHeight: 1.2,
              }}
            >
              {item.text}
            </div>
          </div>
        );
      })}
    </div>
  );
};
