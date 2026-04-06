/**
 * AnimatedInfographic — generic animated infographic composition.
 *
 * Renders segments of type stat / list / text / bars / comparison.
 * Brand identity (accent color, logo, outro CTA) comes from props.
 */

import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Easing,
  Img,
} from 'remotion';
import { Audio } from '@remotion/media';
import type { Caption } from '@remotion/captions';
import { StatCounter } from '../components/StatCounter';
import { ListReveal, ListItem } from '../components/ListReveal';
import { KineticText } from '../components/KineticText';
import { ProgressBar, ProgressBarItem } from '../components/ProgressBar';
import { SubtitleTrack } from '../components/SubtitleTrack';

// ==================== Types ====================

export type InfographicSegment = {
  type: 'stat' | 'list' | 'text' | 'bars' | 'comparison';
  durationFrames: number;
  data:
    | StatSegmentData
    | ListSegmentData
    | TextSegmentData
    | BarsSegmentData
    | ComparisonSegmentData;
};

type StatSegmentData = {
  value: number;
  suffix?: string;
  prefix?: string;
  label: string;
  color?: string;
};

type ListSegmentData = {
  title?: string;
  items: ListItem[];
};

type TextSegmentData = {
  text: string;
  style?: 'pop' | 'slide' | 'typewriter' | 'split';
  highlightWords?: string[];
  size?: 'small' | 'medium' | 'large' | 'hero';
};

type BarsSegmentData = {
  title?: string;
  items: ProgressBarItem[];
  layout?: 'horizontal' | 'vertical';
};

type ComparisonSegmentData = {
  leftLabel: string;
  rightLabel: string;
  leftValue: number;
  rightValue: number;
  leftColor?: string;
  rightColor?: string;
  unit?: string;
};

export type AnimatedInfographicProps = {
  segments: InfographicSegment[];
  audioUrl?: string;
  captions?: Caption[];
  backgroundMusic?: string;
  musicVolume?: number;
  accentColor?: string;
  /** Brand name shown in watermark and outro */
  brandName?: string;
  /** Logo path (staticFile or URL) */
  logoSrc?: string;
  /** Outro tagline */
  tagline?: string;
  /** Outro CTA */
  ctaText?: string;
};

// ==================== Constants ====================

const OUTRO_DURATION_SECONDS = 5;

// ==================== Glass Card ====================

const GlassCard: React.FC<{ children: React.ReactNode; style?: React.CSSProperties }> = ({ children, style }) => (
  <div
    style={{
      background: 'rgba(255, 255, 255, 0.03)',
      backdropFilter: 'blur(20px)',
      borderRadius: 32,
      border: '1px solid rgba(255, 255, 255, 0.08)',
      padding: 48,
      boxShadow: '0 8px 32px rgba(0, 0, 0, 0.3), inset 0 1px 0 rgba(255,255,255,0.05)',
      ...style,
    }}
  >
    {children}
  </div>
);

// ==================== Pattern Background ====================

const PatternBackground: React.FC<{ accentColor: string }> = ({ accentColor }) => {
  const frame = useCurrentFrame();
  const { durationInFrames } = useVideoConfig();

  const rotation = interpolate(frame, [0, durationInFrames], [0, 15]);
  const pulse = Math.sin((frame / 30) * 0.5) * 0.1 + 0.9;
  const patternOffsetX = interpolate(frame, [0, durationInFrames], [0, 50]);
  const patternOffsetY = interpolate(frame, [0, durationInFrames], [0, 30]);

  return (
    <AbsoluteFill style={{ overflow: 'hidden' }}>
      <div style={{ position: 'absolute', inset: 0, background: 'linear-gradient(135deg, #0F172A 0%, #1E293B 50%, #0F172A 100%)' }} />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', pointerEvents: 'none', opacity: 0.1 }}>
        <defs>
          <pattern id="cf-dot-pattern" x={patternOffsetX} y={patternOffsetY} width="80" height="80" patternUnits="userSpaceOnUse">
            <circle cx="40" cy="40" r="1.5" fill={accentColor} opacity={0.6} />
          </pattern>
        </defs>
        <rect width="100%" height="100%" fill="url(#cf-dot-pattern)" />
      </svg>
      <div
        style={{
          position: 'absolute', top: '-20%', right: '-10%', width: 800, height: 800, borderRadius: '50%',
          background: `radial-gradient(circle, ${accentColor}20 0%, transparent 60%)`,
          transform: `rotate(${rotation}deg) scale(${pulse})`,
          filter: 'blur(60px)',
        }}
      />
      <div
        style={{
          position: 'absolute', bottom: '-30%', left: '-20%', width: 1000, height: 1000, borderRadius: '50%',
          background: 'radial-gradient(circle, #3B82F618 0%, transparent 60%)',
          transform: `rotate(${-rotation}deg) scale(${pulse})`,
          filter: 'blur(80px)',
        }}
      />
      <div style={{ position: 'absolute', top: 0, left: 0, right: 0, height: 2, background: `linear-gradient(90deg, transparent, ${accentColor}60, transparent)` }} />
    </AbsoluteFill>
  );
};

// ==================== Comparison ====================

const ComparisonView: React.FC<{ data: ComparisonSegmentData; localFrame: number }> = ({ data, localFrame }) => {
  const { fps } = useVideoConfig();
  if (localFrame < 0) return null;

  const safeFrame = Math.max(0, localFrame);
  const leftColor = data.leftColor ?? '#EF4444';
  const rightColor = data.rightColor ?? '#10B981';
  const maxValue = Math.max(data.leftValue, data.rightValue);
  const maxBarHeight = 320;

  const leftProgress = interpolate(safeFrame, [0, fps * 1], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });
  const rightProgress = interpolate(safeFrame, [fps * 0.4, fps * 1.4], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.out(Easing.cubic) });

  const leftHeight = (data.leftValue / maxValue) * maxBarHeight * leftProgress;
  const rightHeight = (data.rightValue / maxValue) * maxBarHeight * rightProgress;

  const labelOpacity = interpolate(safeFrame, [fps * 0.3, fps * 0.6], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const leftDisplayValue = Math.round(data.leftValue * leftProgress);
  const rightDisplayValue = Math.round(data.rightValue * rightProgress);

  const vsScale = spring({ frame: safeFrame - fps * 0.5, fps, config: { damping: 10, stiffness: 200 } });

  return (
    <GlassCard style={{ width: '90%', maxWidth: 900 }}>
      <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 48 }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%', opacity: labelOpacity }}>
          <span style={{ fontSize: 36, fontWeight: 800, color: leftColor, textTransform: 'uppercase', letterSpacing: 2, textShadow: `0 0 30px ${leftColor}80` }}>{data.leftLabel}</span>
          <span style={{ fontSize: 28, fontWeight: 700, color: 'rgba(255,255,255,0.4)', transform: `scale(${Math.max(0, vsScale)})` }}>VS</span>
          <span style={{ fontSize: 36, fontWeight: 800, color: rightColor, textTransform: 'uppercase', letterSpacing: 2, textShadow: `0 0 30px ${rightColor}80` }}>{data.rightLabel}</span>
        </div>
        <div style={{ display: 'flex', alignItems: 'flex-end', justifyContent: 'center', gap: 80, height: maxBarHeight + 80, width: '100%' }}>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: leftColor, textShadow: `0 0 30px ${leftColor}80` }}>{leftDisplayValue}{data.unit ?? ''}</span>
            <div style={{ width: 100, height: leftHeight, background: `linear-gradient(180deg, ${leftColor} 0%, ${leftColor}aa 100%)`, borderRadius: 16, boxShadow: `0 0 40px ${leftColor}50`, minHeight: 4 }} />
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 20 }}>
            <span style={{ fontSize: 52, fontWeight: 900, color: rightColor, textShadow: `0 0 30px ${rightColor}80` }}>{rightDisplayValue}{data.unit ?? ''}</span>
            <div style={{ width: 100, height: rightHeight, background: `linear-gradient(180deg, ${rightColor} 0%, ${rightColor}aa 100%)`, borderRadius: 16, boxShadow: `0 0 40px ${rightColor}50`, minHeight: 4 }} />
          </div>
        </div>
      </div>
    </GlassCard>
  );
};

// ==================== Outro ====================

const Outro: React.FC<{
  accentColor: string;
  brandName?: string;
  logoSrc?: string;
  tagline?: string;
  ctaText?: string;
}> = ({ accentColor, brandName, logoSrc, tagline, ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const overlayOpacity = interpolate(frame, [0, fps * 0.5], [0, 0.95], { extrapolateRight: 'clamp' });
  const logoScale = spring({ frame: frame - fps * 0.3, fps, config: { damping: 12, stiffness: 100 } });
  const glowIntensity = interpolate(Math.sin((frame / fps) * Math.PI * 2), [-1, 1], [0.4, 0.8]);
  const textOpacity = interpolate(frame, [fps * 1, fps * 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const textY = interpolate(frame, [fps * 1, fps * 1.5], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaScale = spring({ frame: frame - fps * 2, fps, config: { damping: 15, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(15, 23, 42, ${overlayOpacity})` }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${logoScale})` }}>
          {logoSrc && (
            <Img
              src={logoSrc.startsWith('http') ? logoSrc : staticFile(logoSrc)}
              style={{ width: 100, height: 100, filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${accentColor}80)` }}
            />
          )}
          {brandName && (
            <span style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {brandName}
            </span>
          )}
        </div>
        {tagline && (
          <div style={{ opacity: textOpacity, transform: `translateY(${textY}px)`, fontSize: 28, fontWeight: 600, color: 'rgba(255, 255, 255, 0.7)', letterSpacing: 3, textTransform: 'uppercase' }}>
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
              background: `linear-gradient(135deg, ${accentColor} 0%, ${accentColor}dd 100%)`,
              borderRadius: 50,
              boxShadow: `0 0 40px ${accentColor}60, 0 8px 32px rgba(0,0,0,0.3)`,
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

export const AnimatedInfographic: React.FC<AnimatedInfographicProps> = ({
  segments,
  audioUrl,
  captions = [],
  backgroundMusic,
  musicVolume = 0.25,
  accentColor = '#10B981',
  brandName,
  logoSrc,
  tagline,
  ctaText,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const outroDurationFrames = OUTRO_DURATION_SECONDS * fps;
  const outroStartFrame = durationInFrames - outroDurationFrames;
  const isInOutro = frame >= outroStartFrame;

  const segmentStarts = useMemo(() => {
    const starts: number[] = [];
    let current = 0;
    for (const seg of segments) {
      starts.push(current);
      current += seg.durationFrames;
    }
    return starts;
  }, [segments]);

  const currentSegmentIndex = useMemo(() => {
    for (let i = segments.length - 1; i >= 0; i--) {
      if (frame >= segmentStarts[i]) return i;
    }
    return 0;
  }, [frame, segmentStarts, segments.length]);

  const resolvedSrc = (src: string) => src.startsWith('http') ? src : staticFile(src);

  return (
    <AbsoluteFill style={{ fontFamily: 'system-ui, -apple-system, sans-serif' }}>
      <PatternBackground accentColor={accentColor} />

      {audioUrl && <Audio src={resolvedSrc(audioUrl)} />}
      {backgroundMusic && <Audio src={resolvedSrc(backgroundMusic)} volume={musicVolume} />}

      {!isInOutro &&
        segments.map((segment, index) => {
          const startFrame = segmentStarts[index];
          const isActive = index === currentSegmentIndex;
          if (!isActive && frame < startFrame) return null;

          const nextStart = segmentStarts[index + 1] ?? outroStartFrame;
          const fadeOut = interpolate(frame, [nextStart - fps * 0.4, nextStart], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const exitScale = interpolate(frame, [nextStart - fps * 0.4, nextStart], [1, 0.95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
          const localFrame = frame - startFrame;

          return (
            <Sequence key={index} from={startFrame} durationInFrames={segment.durationFrames + fps}>
              <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', opacity: fadeOut, transform: `scale(${exitScale})` }}>
                {segment.type === 'stat' && (
                  <GlassCard>
                    <StatCounter {...(segment.data as StatSegmentData)} startFrame={0} color={(segment.data as StatSegmentData).color ?? accentColor} size="large" />
                  </GlassCard>
                )}
                {segment.type === 'list' && (
                  <GlassCard style={{ width: '90%', maxWidth: 900 }}>
                    {(segment.data as ListSegmentData).title && (
                      <div style={{ fontSize: 44, fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: 40, textShadow: '0 4px 20px rgba(0,0,0,0.5)', letterSpacing: 2 }}>
                        {(segment.data as ListSegmentData).title}
                      </div>
                    )}
                    <ListReveal items={(segment.data as ListSegmentData).items} startFrame={0} iconColor={accentColor} />
                  </GlassCard>
                )}
                {segment.type === 'text' && (
                  <KineticText
                    text={(segment.data as TextSegmentData).text}
                    startFrame={0}
                    style={(segment.data as TextSegmentData).style ?? 'pop'}
                    highlightWords={(segment.data as TextSegmentData).highlightWords}
                    highlightColor={accentColor}
                    size={(segment.data as TextSegmentData).size ?? 'large'}
                  />
                )}
                {segment.type === 'bars' && (
                  <GlassCard style={{ width: '90%', maxWidth: 900 }}>
                    {(segment.data as BarsSegmentData).title && (
                      <div style={{ fontSize: 40, fontWeight: 900, color: 'white', textAlign: 'center', marginBottom: 40, textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
                        {(segment.data as BarsSegmentData).title}
                      </div>
                    )}
                    <ProgressBar items={(segment.data as BarsSegmentData).items} startFrame={0} layout={(segment.data as BarsSegmentData).layout} />
                  </GlassCard>
                )}
                {segment.type === 'comparison' && (
                  <ComparisonView data={segment.data as ComparisonSegmentData} localFrame={localFrame} />
                )}
              </AbsoluteFill>
            </Sequence>
          );
        })}

      {/* Brand watermark */}
      {!isInOutro && (brandName != null || logoSrc != null) && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 60 }}>
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              padding: logoSrc ? '12px 24px 12px 16px' : '12px 24px',
              background: 'rgba(255,255,255,0.05)',
              backdropFilter: 'blur(10px)',
              borderRadius: 40,
              border: '1px solid rgba(255,255,255,0.1)',
            }}
          >
            {logoSrc && (
              <Img
                src={logoSrc.startsWith('http') ? logoSrc : staticFile(logoSrc)}
                style={{ width: 36, height: 36, filter: `drop-shadow(0 0 8px ${accentColor}60)` }}
              />
            )}
            {brandName && (
              <span style={{ fontSize: 22, fontWeight: 700, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>
                {brandName}
              </span>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* Captions */}
      {!isInOutro && captions.length > 0 && (
        <SubtitleTrack captions={captions} highlightColor={accentColor} variant="pill" bottomPadding={120} />
      )}

      <Sequence from={outroStartFrame} durationInFrames={outroDurationFrames}>
        <Outro accentColor={accentColor} brandName={brandName} logoSrc={logoSrc} tagline={tagline} ctaText={ctaText} />
      </Sequence>
    </AbsoluteFill>
  );
};
