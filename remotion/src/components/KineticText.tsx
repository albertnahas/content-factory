import React from 'react';
import { useCurrentFrame, useVideoConfig, interpolate, spring } from 'remotion';

export type KineticTextProps = {
  text: string;
  startFrame?: number;
  style?: 'pop' | 'slide' | 'typewriter' | 'split';
  color?: string;
  highlightWords?: string[];
  highlightColor?: string;
  size?: 'small' | 'medium' | 'large' | 'hero';
  align?: 'left' | 'center' | 'right';
};

export const KineticText: React.FC<KineticTextProps> = ({
  text,
  startFrame = 0,
  style = 'pop',
  color = 'white',
  highlightWords = [],
  highlightColor = '#FFFF00',
  size = 'large',
  align = 'center',
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const localFrame = frame - startFrame;

  if (localFrame < 0) return null;

  const words = text.split(' ');

  const sizes = { small: 36, medium: 52, large: 72, hero: 96 };
  const fontSize = sizes[size];

  const renderWord = (word: string, index: number) => {
    const isHighlight = highlightWords.some((hw) => word.toLowerCase().includes(hw.toLowerCase()));
    const wordColor = isHighlight ? highlightColor : color;

    switch (style) {
      case 'pop': {
        const wordFrame = localFrame - index * 3;
        if (wordFrame < 0) return null;
        const scale = spring({ frame: wordFrame, fps, config: { damping: 10, stiffness: 150 } });
        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              transform: `scale(${scale})`,
              color: wordColor,
              textShadow: isHighlight
                ? `0 0 30px ${highlightColor}, 0 4px 12px rgba(0,0,0,0.8)`
                : '0 4px 12px rgba(0,0,0,0.8)',
              marginRight: '0.3em',
            }}
          >
            {word}
          </span>
        );
      }

      case 'slide': {
        const wordFrame = Math.max(0, localFrame - index * 5);
        const slideProgress = spring({
          frame: wordFrame,
          fps,
          config: { damping: 15, stiffness: 80, mass: 1.2 },
        });
        const slideY = interpolate(slideProgress, [0, 1], [80, 0]);
        const opacity = interpolate(slideProgress, [0, 0.5], [0, 1], { extrapolateRight: 'clamp' });
        const scale = interpolate(slideProgress, [0, 1], [0.9, 1]);
        const rotation = interpolate(slideProgress, [0, 1], [5, 0]);
        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              transform: `translateY(${slideY}px) scale(${scale}) rotate(${rotation}deg)`,
              opacity,
              color: wordColor,
              textShadow: isHighlight
                ? `0 0 40px ${highlightColor}80, 0 0 20px ${highlightColor}60, 0 6px 20px rgba(0,0,0,0.9)`
                : '0 6px 20px rgba(0,0,0,0.9), 0 2px 8px rgba(0,0,0,0.6)',
              marginRight: '0.3em',
            }}
          >
            {word}
          </span>
        );
      }

      case 'typewriter': {
        const charsPerFrame = 2;
        const totalCharsShown = Math.floor(localFrame * charsPerFrame);
        let charsBefore = 0;
        for (let i = 0; i < index; i++) charsBefore += words[i].length + 1;
        const wordCharsShown = Math.max(0, Math.min(word.length, totalCharsShown - charsBefore));
        if (wordCharsShown <= 0) return null;
        const displayWord = word.slice(0, wordCharsShown);
        const showCursor =
          wordCharsShown < word.length && totalCharsShown === charsBefore + wordCharsShown;
        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              color: wordColor,
              textShadow: '0 4px 12px rgba(0,0,0,0.8)',
              marginRight: '0.3em',
            }}
          >
            {displayWord}
            {showCursor && (
              <span style={{ opacity: Math.sin(localFrame * 0.5) > 0 ? 1 : 0 }}>|</span>
            )}
          </span>
        );
      }

      case 'split': {
        const wordFrame = localFrame - index * 5;
        if (wordFrame < 0) return null;
        const splitProgress = interpolate(wordFrame, [0, fps * 0.4], [50, 0], {
          extrapolateRight: 'clamp',
        });
        const opacity = interpolate(wordFrame, [0, fps * 0.2], [0, 1], {
          extrapolateRight: 'clamp',
        });
        return (
          <span
            key={index}
            style={{
              display: 'inline-block',
              letterSpacing: splitProgress,
              opacity,
              color: wordColor,
              textShadow: '0 4px 12px rgba(0,0,0,0.8)',
              marginRight: '0.3em',
            }}
          >
            {word}
          </span>
        );
      }

      default:
        return (
          <span key={index} style={{ color: wordColor, marginRight: '0.3em' }}>
            {word}
          </span>
        );
    }
  };

  return (
    <div
      style={{
        fontSize,
        fontWeight: 900,
        fontFamily: 'Arial Black, Impact, sans-serif',
        textTransform: 'uppercase',
        textAlign: align,
        lineHeight: 1.2,
        padding: '0 40px',
        display: 'flex',
        flexWrap: 'wrap',
        justifyContent:
          align === 'center' ? 'center' : align === 'right' ? 'flex-end' : 'flex-start',
        gap: '4px 0',
      }}
    >
      {words.map((word, index) => renderWord(word, index))}
    </div>
  );
};
