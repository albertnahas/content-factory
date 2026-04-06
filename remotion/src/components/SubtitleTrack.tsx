import React, { useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame, useVideoConfig, interpolate } from 'remotion';

export type SubtitleWord = {
  text: string;
  startMs: number;
  endMs: number;
  confidence?: number | null;
  timestampLink?: string | null;
};

type WordToken = {
  text: string;
  startMs: number;
  endMs: number;
};

type Phrase = {
  words: WordToken[];
  startMs: number;
  endMs: number;
};

export type SubtitleTrackProps = {
  captions: SubtitleWord[];
  /** Highlight color for the active word */
  highlightColor?: string;
  /** Base text color */
  textColor?: string;
  /** Font size in px */
  fontSize?: number;
  /** Max words per phrase chunk */
  maxWordsPerPhrase?: number;
  /** Vertical position: 'center' or 'bottom' */
  position?: 'center' | 'bottom';
  /** Bottom padding when position is 'bottom' */
  bottomPadding?: number;
  /** Style variant */
  variant?: 'kinetic' | 'pill';
  /**
   * Override current time in milliseconds.
   * When omitted the component derives time from useCurrentFrame().
   * Pass this when the composition has already consumed frame 0 for a
   * different timeline offset (e.g. UGCReel passes scene-relative time).
   */
  currentTimeMs?: number;
};

function createPhrases(captions: SubtitleWord[], maxWords: number): Phrase[] {
  const phrases: Phrase[] = [];
  let currentWords: WordToken[] = [];

  for (let i = 0; i < captions.length; i++) {
    const caption = captions[i];
    const word: WordToken = {
      text: caption.text.trim(),
      startMs: caption.startMs,
      endMs: caption.endMs,
    };

    const prevCaption = captions[i - 1];
    const hasGap = prevCaption != null && caption.startMs - prevCaption.endMs > 400;

    if (currentWords.length > 0 && (hasGap || currentWords.length >= maxWords)) {
      phrases.push({
        words: currentWords,
        startMs: currentWords[0].startMs,
        endMs: currentWords[currentWords.length - 1].endMs,
      });
      currentWords = [];
    }

    currentWords.push(word);
  }

  if (currentWords.length > 0) {
    phrases.push({
      words: currentWords,
      startMs: currentWords[0].startMs,
      endMs: currentWords[currentWords.length - 1].endMs,
    });
  }

  return phrases;
}

/**
 * Reusable subtitle/caption track component.
 *
 * Supports two visual variants:
 * - `kinetic`: Large uppercase words centered on screen (voiceover reel style)
 * - `pill`: Smaller words in a frosted glass pill at the bottom (UGC/documentary style)
 */
export const SubtitleTrack: React.FC<SubtitleTrackProps> = ({
  captions,
  highlightColor = '#FFFF00',
  textColor = '#FFFFFF',
  fontSize,
  maxWordsPerPhrase = 4,
  position = 'center',
  bottomPadding = 160,
  variant = 'kinetic',
  currentTimeMs: currentTimeMsOverride,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const currentTimeMs = currentTimeMsOverride ?? (frame / fps) * 1000;

  const resolvedFontSize = fontSize ?? (variant === 'kinetic' ? 68 : 36);

  const phrases = useMemo(
    () => (captions.length === 0 ? [] : createPhrases(captions, maxWordsPerPhrase)),
    [captions, maxWordsPerPhrase]
  );

  const currentPhraseIndex = useMemo(() => {
    for (let i = 0; i < phrases.length; i++) {
      const phrase = phrases[i];
      const nextPhrase = phrases[i + 1];
      const phraseEndMs = nextPhrase != null ? nextPhrase.startMs : phrase.endMs + 500;
      if (currentTimeMs >= phrase.startMs && currentTimeMs < phraseEndMs) return i;
    }
    return -1;
  }, [phrases, currentTimeMs]);

  const currentPhrase = currentPhraseIndex >= 0 ? phrases[currentPhraseIndex] : null;

  if (!currentPhrase) return null;

  const words = currentPhrase.words.map((word, i) => {
    const isActive = word.startMs <= currentTimeMs && word.endMs > currentTimeMs;
    const hasAppeared = word.startMs <= currentTimeMs;

    const timeSinceAppear = currentTimeMs - word.startMs;
    const popProgress = Math.min(1, Math.max(0, timeSinceAppear / 150));
    const popScale = interpolate(popProgress, [0, 0.5, 1], [0.3, 1.2, 1], {
      extrapolateRight: 'clamp',
    });

    if (!hasAppeared) return null;

    if (variant === 'kinetic') {
      return (
        <span
          key={`${currentPhraseIndex}-${word.startMs}-${i}`}
          style={{
            display: 'inline-block',
            fontSize: resolvedFontSize,
            fontWeight: 900,
            fontFamily: 'Arial Black, Impact, sans-serif',
            color: isActive ? highlightColor : textColor,
            textTransform: 'uppercase',
            textShadow: isActive
              ? `0 0 30px ${highlightColor}CC, 0 4px 12px rgba(0,0,0,0.9), 3px 3px 0 #000`
              : '0 4px 12px rgba(0,0,0,0.9), 3px 3px 0 #000',
            transform: `scale(${isActive ? popScale * 1.1 : popScale})`,
            letterSpacing: 3,
          }}
        >
          {word.text}
        </span>
      );
    }

    // pill variant
    return (
      <span
        key={`${currentPhraseIndex}-${word.startMs}-${i}`}
        style={{
          display: 'inline-block',
          fontSize: resolvedFontSize,
          fontWeight: 800,
          fontFamily: 'Arial Black, Impact, sans-serif',
          color: isActive ? highlightColor : textColor,
          textTransform: 'uppercase',
          textShadow: isActive
            ? `0 0 20px ${highlightColor}B3, 0 3px 8px rgba(0,0,0,0.9), 2px 2px 0 #000`
            : '0 3px 8px rgba(0,0,0,0.9), 2px 2px 0 #000',
          transform: `scale(${isActive ? popScale * 1.08 : popScale})`,
          letterSpacing: 2,
        }}
      >
        {word.text}
      </span>
    );
  });

  if (variant === 'kinetic') {
    return (
      <AbsoluteFill
        style={{
          justifyContent: position === 'center' ? 'center' : 'flex-end',
          alignItems: 'center',
          padding: position === 'bottom' ? `0 40px ${bottomPadding}px 40px` : '0 40px',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '12px 16px',
            maxWidth: '95%',
          }}
        >
          {words}
        </div>
      </AbsoluteFill>
    );
  }

  return (
    <AbsoluteFill
      style={{
        justifyContent: 'flex-end',
        alignItems: 'center',
        paddingBottom: bottomPadding,
      }}
    >
      <div
        style={{
          maxWidth: '92%',
          padding: '16px 28px',
          backgroundColor: 'rgba(0, 0, 0, 0.75)',
          borderRadius: 12,
          backdropFilter: 'blur(8px)',
        }}
      >
        <div
          style={{
            display: 'flex',
            flexWrap: 'wrap',
            justifyContent: 'center',
            alignItems: 'center',
            gap: '8px 12px',
          }}
        >
          {words}
        </div>
      </div>
    </AbsoluteFill>
  );
};
