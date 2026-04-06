/**
 * ProductComparison — generic whip-pan product comparison composition.
 *
 * Originally "BrandCalorieSpin" from LeanDine. Renamed and genericized:
 * - brand/calorie → product/metric
 * - Hardcoded color and logo removed
 * All identity comes from props.
 */

import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  OffthreadVideo,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  Easing,
  staticFile,
  spring,
} from 'remotion';
import { Audio } from '@remotion/media';

// ==================== Types ====================

export type ProductComparisonItem = {
  name: string;
  /** Primary metric value (e.g. calories, price, weight) */
  metricValue: number;
  videoSrc: string;
};

export type ProductComparisonTiming = {
  introSeconds?: number;
  holdSeconds?: number;
  transitionSeconds?: number;
  outroSeconds?: number;
};

export type ProductComparisonSfx = {
  whoosh?: string;
  metricPop?: string;
  introHit?: string;
  finalReveal?: string;
  volume?: number;
};

export type ProductComparisonProps = {
  /** Series/brand name shown during intro and header */
  seriesName: string;
  /** Hook phrase shown during intro */
  hookPhrase: string;
  /** Unit label for the metric (e.g. "cal", "kcal", "$") */
  metricUnit?: string;
  items: ProductComparisonItem[];
  musicSrc?: string;
  musicVolume?: number;
  timing?: ProductComparisonTiming;
  sfx?: ProductComparisonSfx;
  /** Accent color for outro and low-value highlight */
  accentColor?: string;
  /** Brand name in outro */
  brandName?: string;
  /** Logo path for outro */
  logoSrc?: string;
  /** Outro tagline */
  tagline?: string;
  /** Outro CTA */
  ctaText?: string;
};

// ==================== Timing ====================

const DEFAULT_TIMING = {
  introSeconds: 2,
  holdSeconds: 2.5,
  transitionSeconds: 1.0,
  outroSeconds: 3.5,
} as const;

function resolveTiming(timing?: ProductComparisonTiming) {
  return {
    introSeconds: timing?.introSeconds ?? DEFAULT_TIMING.introSeconds,
    holdSeconds: timing?.holdSeconds ?? DEFAULT_TIMING.holdSeconds,
    transitionSeconds: timing?.transitionSeconds ?? DEFAULT_TIMING.transitionSeconds,
    outroSeconds: timing?.outroSeconds ?? DEFAULT_TIMING.outroSeconds,
  };
}

// ==================== Duration Helper ====================

export function calculateProductComparisonDuration(
  itemCount: number,
  fps = 30,
  timing?: ProductComparisonTiming
): number {
  const t = resolveTiming(timing);
  const totalSeconds =
    t.introSeconds +
    (itemCount > 0 ? t.transitionSeconds : 0) +
    itemCount * t.holdSeconds +
    Math.max(0, itemCount - 1) * t.transitionSeconds +
    t.outroSeconds;
  return Math.ceil(totalSeconds * fps);
}

// ==================== Metric Color ====================

function getMetricColor(value: number, accentColor: string): string {
  // Returns accent for low values, scales to red for high values
  if (value <= 200) return accentColor;
  if (value <= 400) return '#F59E0B';
  if (value <= 600) return '#F97316';
  return '#EF4444';
}

// ==================== Timeline ====================

type TransitionDirection = 'left' | 'right';

type TimelineSegment =
  | { type: 'intro'; startFrame: number; endFrame: number }
  | { type: 'item'; index: number; startFrame: number; endFrame: number }
  | { type: 'transition'; fromIndex: number; toIndex: number; direction: TransitionDirection; startFrame: number; endFrame: number }
  | { type: 'transitionIn'; toIndex: number; direction: TransitionDirection; startFrame: number; endFrame: number }
  | { type: 'outro'; startFrame: number; endFrame: number };

function buildTimeline(itemCount: number, fps: number, timing?: ProductComparisonTiming): TimelineSegment[] {
  const t = resolveTiming(timing);
  const segments: TimelineSegment[] = [];
  let f = 0;

  const introFrames = Math.round(t.introSeconds * fps);
  segments.push({ type: 'intro', startFrame: f, endFrame: f + introFrames });
  f += introFrames;

  const holdFrames = Math.round(t.holdSeconds * fps);
  const transFrames = Math.round(t.transitionSeconds * fps);

  if (itemCount > 0) {
    segments.push({ type: 'transitionIn', toIndex: 0, direction: 'left', startFrame: f, endFrame: f + transFrames });
    f += transFrames;
  }

  for (let i = 0; i < itemCount; i++) {
    segments.push({ type: 'item', index: i, startFrame: f, endFrame: f + holdFrames });
    f += holdFrames;
    if (i < itemCount - 1) {
      const direction: TransitionDirection = i % 2 === 0 ? 'left' : 'right';
      segments.push({ type: 'transition', fromIndex: i, toIndex: i + 1, direction, startFrame: f, endFrame: f + transFrames });
      f += transFrames;
    }
  }

  const outroFrames = Math.round(t.outroSeconds * fps);
  segments.push({ type: 'outro', startFrame: f, endFrame: f + outroFrames });
  return segments;
}

function findSegment(timeline: TimelineSegment[], frame: number): TimelineSegment {
  for (const seg of timeline) {
    if (frame >= seg.startFrame && frame < seg.endFrame) return seg;
  }
  return timeline[timeline.length - 1];
}

function getFirstVisibleFrame(timeline: TimelineSegment[], itemIndex: number): number {
  for (const seg of timeline) {
    if (seg.type === 'transitionIn' && seg.toIndex === itemIndex) return seg.startFrame;
    if (seg.type === 'transition' && seg.toIndex === itemIndex) return seg.startFrame;
    if (seg.type === 'item' && seg.index === itemIndex) return seg.startFrame;
  }
  return 0;
}

// ==================== Video Layer ====================

type VideoLayer = { itemIndex: number; opacity: number; translateX: number; blur: number; scale: number; rotation: number };

function computeVideoLayers(segment: TimelineSegment, progress: number, itemCount: number): VideoLayer[] {
  if (segment.type === 'intro') return [];

  if (segment.type === 'transitionIn') {
    const { toIndex, direction } = segment;
    const eased = Easing.bezier(0.4, 0, 0.2, 1)(progress);
    const dir = direction === 'left' ? 1 : -1;
    return [{
      itemIndex: toIndex,
      opacity: interpolate(eased, [0, 0.15, 0.5], [0, 0.6, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      translateX: interpolate(eased, [0, 1], [120 * dir, 0]),
      blur: interpolate(eased, [0, 0.3, 0.65, 1], [35, 20, 8, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      scale: interpolate(eased, [0, 1], [0.88, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
      rotation: interpolate(eased, [0, 1], [8 * dir, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }),
    }];
  }

  if (segment.type === 'item') {
    const settle = interpolate(progress, [0, 0.08, 0.18], [1.02, 0.995, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
    return [{ itemIndex: segment.index, opacity: 1, translateX: 0, blur: 0, scale: settle, rotation: 0 }];
  }

  if (segment.type === 'transition') {
    const { fromIndex, toIndex, direction } = segment;
    const eased = Easing.bezier(0.4, 0, 0.2, 1)(progress);
    const dir = direction === 'left' ? 1 : -1;
    return [
      {
        itemIndex: fromIndex,
        opacity: interpolate(eased, [0, 0.3, 0.55, 0.75], [1, 0.8, 0.35, 0], { extrapolateRight: 'clamp' }),
        translateX: interpolate(eased, [0, 1], [0, -120 * dir]),
        blur: interpolate(eased, [0, 0.15, 0.35, 0.6], [0, 6, 18, 35], { extrapolateRight: 'clamp' }),
        scale: interpolate(eased, [0, 0.3, 0.6], [1, 0.95, 0.88], { extrapolateRight: 'clamp' }),
        rotation: interpolate(eased, [0, 0.3, 0.6], [0, -3 * dir, -8 * dir], { extrapolateRight: 'clamp' }),
      },
      {
        itemIndex: toIndex,
        opacity: interpolate(eased, [0.25, 0.45, 0.7, 1], [0, 0.35, 0.8, 1], { extrapolateLeft: 'clamp' }),
        translateX: interpolate(eased, [0, 1], [120 * dir, 0]),
        blur: interpolate(eased, [0.4, 0.6, 0.8, 1], [35, 18, 6, 0], { extrapolateLeft: 'clamp' }),
        scale: interpolate(eased, [0.4, 0.7, 1], [0.88, 0.95, 1], { extrapolateLeft: 'clamp' }),
        rotation: interpolate(eased, [0.4, 0.7, 1], [8 * dir, 3 * dir, 0], { extrapolateLeft: 'clamp' }),
      },
    ];
  }

  if (segment.type === 'outro' && itemCount > 0) {
    return [{
      itemIndex: itemCount - 1,
      opacity: interpolate(progress, [0, 0.25], [1, 0], { extrapolateRight: 'clamp' }),
      translateX: 0,
      blur: interpolate(progress, [0, 0.25], [0, 8], { extrapolateRight: 'clamp' }),
      scale: interpolate(progress, [0, 0.25], [1, 1.05], { extrapolateRight: 'clamp' }),
      rotation: 0,
    }];
  }

  return [];
}

// ==================== Sub-Components ====================

const SeriesIntro: React.FC<{ seriesName: string; hookPhrase: string; progress: number }> = ({ seriesName, hookPhrase, progress }) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();

  const brandScale = spring({ frame, fps, config: { damping: 15, stiffness: 80 } });
  const brandOpacity = interpolate(progress, [0, 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleOpacity = interpolate(progress, [0.3, 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const subtitleY = interpolate(progress, [0.3, 0.6], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const fadeOut = interpolate(progress, [0.8, 1], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', backgroundColor: 'black', opacity: fadeOut }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 24 }}>
        <span style={{ fontSize: 80, fontWeight: 900, color: 'white', letterSpacing: 6, textTransform: 'uppercase', opacity: brandOpacity, transform: `scale(${brandScale})`, textShadow: '0 4px 20px rgba(0,0,0,0.5)', fontFamily: 'Arial Black, Impact, sans-serif' }}>
          {seriesName}
        </span>
        <span style={{ fontSize: 38, fontWeight: 700, color: 'rgba(255,255,255,0.85)', letterSpacing: 1, textAlign: 'center', maxWidth: '85%', lineHeight: 1.3, opacity: subtitleOpacity, transform: `translateY(${subtitleY}px)`, fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {hookPhrase}
        </span>
      </div>
    </AbsoluteFill>
  );
};

const GhostMetricText: React.FC<{ value: number; unit: string; accentColor: string; progress: number }> = ({ value, unit, accentColor, progress }) => {
  const revealProgress = interpolate(progress, [0.12, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  if (revealProgress <= 0) return null;

  const translateY = interpolate(revealProgress, [0, 0.6, 1], [80, 0, -10], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const scale = interpolate(revealProgress, [0, 0.4, 0.7, 1], [0.5, 1.15, 1.0, 1.0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const opacity = interpolate(revealProgress, [0, 0.2, 0.85, 1], [0, 0.9, 0.9, 0.8], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const floatOffset = revealProgress > 0.7 ? Math.sin((progress - 0.7) * Math.PI * 8) * 3 : 0;

  const color = getMetricColor(value, accentColor);
  const countProgress = interpolate(revealProgress, [0, 0.8], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const easedCount = Easing.out(Easing.cubic)(countProgress);
  const displayValue = Math.round(easedCount * value);

  return (
    <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', pointerEvents: 'none' }}>
      <div style={{ transform: `translateY(${translateY + floatOffset}px) scale(${scale})`, opacity, display: 'flex', alignItems: 'baseline', gap: 8 }}>
        <span style={{ fontSize: 140, fontWeight: 900, color: 'white', fontFamily: 'Arial Black, Impact, sans-serif', textShadow: `0 0 40px ${color}80, 0 0 80px ${color}40, 0 4px 20px rgba(0,0,0,0.8)`, letterSpacing: 4 }}>
          {displayValue}
        </span>
        <span style={{ fontSize: 48, fontWeight: 800, color: `${color}CC`, fontFamily: 'Arial, Helvetica, sans-serif', textShadow: '0 4px 12px rgba(0,0,0,0.8)', textTransform: 'uppercase', letterSpacing: 2 }}>
          {unit}
        </span>
      </div>
    </AbsoluteFill>
  );
};

const ItemNameOverlay: React.FC<{ name: string; progress: number; itemIndex: number; totalItems: number }> = ({ name, progress, itemIndex, totalItems }) => {
  const slideProgress = interpolate(progress, [0, 0.15], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const translateY = interpolate(slideProgress, [0, 1], [-60, 0], { easing: Easing.bezier(0.25, 0.1, 0.25, 1) });
  const opacity = interpolate(progress, [0, 0.1, 0.85, 1], [0, 1, 1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 180, pointerEvents: 'none' }}>
      <div style={{ opacity, transform: `translateY(${translateY}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ fontSize: 24, fontWeight: 700, color: 'rgba(255,255,255,0.5)', letterSpacing: 3, fontFamily: 'Arial, Helvetica, sans-serif' }}>
          {itemIndex + 1} / {totalItems}
        </span>
        <span style={{ fontSize: 48, fontWeight: 900, color: 'white', textTransform: 'uppercase', letterSpacing: 3, textAlign: 'center', maxWidth: '90%', textShadow: '0 4px 16px rgba(0,0,0,0.8)', fontFamily: 'Arial Black, Impact, sans-serif' }}>
          {name}
        </span>
      </div>
    </AbsoluteFill>
  );
};

const ComparisonOutro: React.FC<{
  progress: number;
  outroSeconds: number;
  accentColor: string;
  brandName?: string;
  logoSrc?: string;
  tagline?: string;
  ctaText?: string;
}> = ({ progress, outroSeconds, accentColor, brandName, logoSrc, tagline, ctaText }) => {
  const { fps } = useVideoConfig();

  const overlayOpacity = interpolate(progress, [0, 0.15], [0, 0.85], { extrapolateRight: 'clamp' });
  const logoFrame = Math.max(0, Math.round(progress * outroSeconds * fps) - Math.round(fps * 0.2));
  const logoScale = spring({ frame: logoFrame, fps, config: { damping: 12, stiffness: 100 } });
  const glowIntensity = interpolate(Math.sin(progress * Math.PI * 4), [-1, 1], [0.4, 0.8]);
  const textOpacity = interpolate(progress, [0.3, 0.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(progress, [0.5, 0.7], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaFrame = Math.max(0, Math.round(progress * outroSeconds * fps) - Math.round(fps * 1.5));
  const ctaScale = spring({ frame: ctaFrame, fps, config: { damping: 15, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${logoScale})` }}>
          {logoSrc && (
            <Img
              src={logoSrc.startsWith('http') ? logoSrc : staticFile(logoSrc)}
              style={{ width: 100, height: 100, filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${accentColor}CC)` }}
            />
          )}
          {brandName && (
            <span style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {brandName}
            </span>
          )}
        </div>
        {tagline && (
          <div style={{ opacity: textOpacity, fontSize: 28, fontWeight: 600, color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 2, textTransform: 'uppercase' }}>
            {tagline}
          </div>
        )}
        {ctaText && (
          <div
            style={{
              opacity: ctaOpacity,
              transform: `scale(${Math.max(0.5, ctaScale)})`,
              marginTop: 40,
              padding: '20px 50px',
              backgroundColor: accentColor,
              borderRadius: 50,
              boxShadow: `0 0 30px ${accentColor}80`,
            }}
          >
            <span style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>
              {ctaText}
            </span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ==================== Main Component ====================

export const ProductComparison: React.FC<ProductComparisonProps> = ({
  seriesName,
  hookPhrase,
  metricUnit = '',
  items,
  musicSrc,
  musicVolume = 0.3,
  timing,
  sfx,
  accentColor = '#10B981',
  brandName,
  logoSrc,
  tagline,
  ctaText,
}) => {
  const { fps } = useVideoConfig();
  const frame = useCurrentFrame();
  const t = useMemo(() => resolveTiming(timing), [timing]);

  const timeline = useMemo(() => buildTimeline(items.length, fps, timing), [items.length, fps, timing]);
  const segment = useMemo(() => findSegment(timeline, frame), [timeline, frame]);

  const segmentDuration = segment.endFrame - segment.startFrame;
  const progress = (frame - segment.startFrame) / segmentDuration;

  const layers = useMemo(
    () => computeVideoLayers(segment, progress, items.length),
    [segment, progress, items.length]
  );

  const firstVisibleFrames = useMemo(
    () => items.map((_, idx) => getFirstVisibleFrame(timeline, idx)),
    [items, timeline]
  );

  const showSeriesHeader =
    segment.type === 'item' || segment.type === 'transition' || segment.type === 'transitionIn';

  const resolvedSrc = (src: string) => src.startsWith('http') ? src : staticFile(src);

  return (
    <AbsoluteFill
      style={{
        background: `radial-gradient(ellipse at center, ${accentColor}1F 0%, rgba(0, 0, 0, 1) 65%)`,
        overflow: 'hidden',
      }}
    >
      {/* Video backgrounds — always mounted to prevent frame jumps */}
      {items.map((item, idx) => {
        const layer = layers.find((l) => l.itemIndex === idx);
        return (
          <AbsoluteFill
            key={`video-${idx}`}
            style={{
              opacity: layer?.opacity ?? 0,
              transform: layer ? `translateX(${layer.translateX}%) scale(${layer.scale}) rotate(${layer.rotation}deg)` : undefined,
              filter: layer && layer.blur > 0 ? `blur(${layer.blur}px)` : undefined,
              willChange: 'transform, opacity, filter',
            }}
          >
            <Sequence from={firstVisibleFrames[idx]} layout="none">
              <OffthreadVideo
                src={resolvedSrc(item.videoSrc)}
                muted
                loop
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </Sequence>
          </AbsoluteFill>
        );
      })}

      {/* Gradient overlay */}
      {(segment.type === 'item' || segment.type === 'transition' || segment.type === 'transitionIn') && (
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, rgba(0,0,0,0.5) 0%, rgba(0,0,0,0) 25%, rgba(0,0,0,0) 60%, rgba(0,0,0,0.4) 100%)' }} />
      )}

      {/* Intro */}
      {segment.type === 'intro' && (
        <SeriesIntro seriesName={seriesName} hookPhrase={hookPhrase} progress={progress} />
      )}

      {/* Persistent series header */}
      {showSeriesHeader && (
        <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 60, pointerEvents: 'none' }}>
          <span style={{ fontSize: 28, fontWeight: 800, color: 'rgba(255,255,255,0.6)', letterSpacing: 6, textTransform: 'uppercase', textShadow: '0 2px 10px rgba(0,0,0,0.8)', fontFamily: 'Arial, Helvetica, sans-serif' }}>
            {seriesName}
          </span>
        </AbsoluteFill>
      )}

      {/* Item hold content */}
      {segment.type === 'item' && (
        <>
          <ItemNameOverlay name={items[segment.index].name} progress={progress} itemIndex={segment.index} totalItems={items.length} />
          <GhostMetricText value={items[segment.index].metricValue} unit={metricUnit} accentColor={accentColor} progress={progress} />
        </>
      )}

      {/* Outro */}
      {segment.type === 'outro' && (
        <ComparisonOutro progress={progress} outroSeconds={t.outroSeconds} accentColor={accentColor} brandName={brandName} logoSrc={logoSrc} tagline={tagline} ctaText={ctaText} />
      )}

      {/* Music */}
      {musicSrc && <Audio src={resolvedSrc(musicSrc)} volume={musicVolume} />}

      {/* SFX */}
      {sfx && (
        <>
          {sfx.introHit &&
            (() => {
              const introSeg = timeline.find((s) => s.type === 'intro');
              if (!introSeg) return null;
              const hitFrame = introSeg.startFrame + Math.round(0.2 * (introSeg.endFrame - introSeg.startFrame));
              return (
                <Sequence from={hitFrame} layout="none">
                  <Audio src={staticFile(sfx.introHit)} volume={sfx.volume ?? 0.8} />
                </Sequence>
              );
            })()}

          {sfx.whoosh &&
            timeline
              .filter((s) => s.type === 'transitionIn' || s.type === 'transition')
              .map((s, i) => (
                <Sequence key={`whoosh-${i}`} from={s.startFrame} layout="none">
                  <Audio src={staticFile(sfx.whoosh!)} volume={sfx.volume ?? 0.8} />
                </Sequence>
              ))}

          {sfx.metricPop &&
            timeline
              .filter((s) => s.type === 'item')
              .map((s, i) => {
                const itemSegs = timeline.filter((seg) => seg.type === 'item');
                const isLast = i === itemSegs.length - 1;
                if (isLast && sfx.finalReveal) return null;
                const popFrame = s.startFrame + Math.round(0.12 * (s.endFrame - s.startFrame));
                return (
                  <Sequence key={`pop-${i}`} from={popFrame} layout="none">
                    <Audio src={staticFile(sfx.metricPop!)} volume={sfx.volume ?? 0.8} />
                  </Sequence>
                );
              })}

          {sfx.finalReveal &&
            (() => {
              const itemSegs = timeline.filter((s) => s.type === 'item');
              const lastItem = itemSegs[itemSegs.length - 1];
              if (!lastItem) return null;
              const revealFrame = lastItem.startFrame + Math.round(0.1 * (lastItem.endFrame - lastItem.startFrame));
              return (
                <Sequence from={revealFrame} layout="none">
                  <Audio src={staticFile(sfx.finalReveal)} volume={(sfx.volume ?? 0.8) * 1.5} />
                </Sequence>
              );
            })()}
        </>
      )}
    </AbsoluteFill>
  );
};
