/**
 * UGCReel — generic UGC-style reel composition.
 *
 * Renders multiple video segments with crossfade transitions, optional
 * b-roll overlays, data hints, captions, and a branded outro.
 * All brand identity comes from props.
 */

import React from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  staticFile,
  spring,
} from 'remotion';
import { Video } from '@remotion/media';
import { SubtitleTrack, SubtitleWord } from '../components/SubtitleTrack';

// ==================== Types ====================

export type BrollOverlay = {
  sceneIndex: number;
  asset: string;
  startOffset?: number;
  duration?: number;
  fadeIn?: number;
  fadeOut?: number;
};

export type DataHint = {
  label: string;
  value: string;
  icon?: string;
};

export type DataOverlayConfig = {
  sceneIndex: number;
  title?: string;
  hints: DataHint[];
};

export type UGCReelProps = {
  backgroundVideos: string[];
  videoDurations: number[];
  hasNativeAudio?: boolean;
  brollOverlays?: BrollOverlay[];
  dataOverlays?: DataOverlayConfig[];
  /** Brand name in watermark and outro */
  brandName?: string;
  /** Brand color */
  brandColor?: string;
  /** Logo path (staticFile or URL) */
  logoSrc?: string;
  ctaText?: string;
  ctaSubtext?: string;
  outroDuration?: number;
  showWatermark?: boolean;
  transitionDuration?: number;
  captions?: SubtitleWord[];
  showCaptions?: boolean;
};

// ==================== Helpers ====================

function resolvedSrc(src: string): string {
  return src.startsWith('http') ? src : staticFile(src);
}

// ==================== Data Overlay ====================

const DataOverlay: React.FC<{ title?: string; hints: DataHint[]; durationFrames: number; accentColor: string }> = ({
  title,
  hints,
  durationFrames,
  accentColor,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const containerOpacity = interpolate(
    frame,
    [0, fps * 0.4, durationFrames - fps * 0.5, durationFrames],
    [0, 1, 1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const titleY = interpolate(frame, [fps * 0.2, fps * 0.6], [-20, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ justifyContent: 'flex-start', alignItems: 'center', paddingTop: 80, opacity: containerOpacity }}>
      <div
        style={{
          display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
          padding: '20px 32px', backgroundColor: 'rgba(0, 0, 0, 0.6)',
          borderRadius: 20, backdropFilter: 'blur(12px)', border: '1px solid rgba(255, 255, 255, 0.1)',
        }}
      >
        {title && (
          <div style={{ transform: `translateY(${titleY}px)`, fontSize: 22, fontWeight: 700, color: 'rgba(255, 255, 255, 0.8)', letterSpacing: 2, textTransform: 'uppercase' }}>
            {title}
          </div>
        )}
        <div style={{ display: 'flex', gap: 24, alignItems: 'center' }}>
          {hints.map((hint, i) => {
            const staggerDelay = fps * 0.3 + i * fps * 0.25;
            const itemScale = spring({ frame: frame - staggerDelay, fps, config: { damping: 14, stiffness: 120 } });
            const itemOpacity = interpolate(frame, [staggerDelay, staggerDelay + fps * 0.3], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
            return (
              <div
                key={i}
                style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, opacity: itemOpacity, transform: `scale(${Math.max(0, itemScale)})` }}
              >
                <span style={{ fontSize: 40, fontWeight: 900, color: accentColor, lineHeight: 1, textShadow: '0 2px 8px rgba(0,0,0,0.5)' }}>{hint.value}</span>
                <span style={{ fontSize: 18, fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', textTransform: 'uppercase', letterSpacing: 1 }}>{hint.label}</span>
              </div>
            );
          })}
        </div>
      </div>
    </AbsoluteFill>
  );
};

// ==================== Outro ====================

const UGCOutro: React.FC<{
  ctaText?: string;
  ctaSubtext?: string;
  brandName?: string;
  brandColor: string;
  logoSrc?: string;
}> = ({ ctaText, ctaSubtext, brandName, brandColor, logoSrc }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const overlayOpacity = interpolate(frame, [0, fps * 0.5], [0, 0.9], { extrapolateRight: 'clamp' });
  const logoScale = spring({ frame: frame - fps * 0.3, fps, config: { damping: 12, stiffness: 100 } });
  const glowIntensity = interpolate(Math.sin((frame / fps) * Math.PI * 2), [-1, 1], [0.4, 0.8]);
  const taglineOpacity = interpolate(frame, [fps * 1, fps * 1.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const taglineY = interpolate(frame, [fps * 1, fps * 1.5], [30, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaOpacity = interpolate(frame, [fps * 2, fps * 2.5], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const ctaScale = spring({ frame: frame - fps * 2, fps, config: { damping: 15, stiffness: 120 } });
  const ctaPulse = interpolate(Math.sin((frame / fps) * Math.PI * 3), [-1, 1], [1, 1.02]);

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ background: `radial-gradient(ellipse at center, rgba(0,0,0,${overlayOpacity * 0.8}) 0%, rgba(0,0,0,${overlayOpacity}) 100%)` }} />
      <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 40 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${logoScale})` }}>
          {logoSrc && (
            <Img
              src={resolvedSrc(logoSrc)}
              style={{ width: 100, height: 100, filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${brandColor}CC)` }}
            />
          )}
          {brandName && (
            <span style={{ fontSize: 56, fontWeight: 900, color: 'white', letterSpacing: 4, textTransform: 'uppercase', textShadow: '0 4px 20px rgba(0,0,0,0.5)' }}>
              {brandName}
            </span>
          )}
        </div>

        {ctaText && (
          <div style={{ opacity: taglineOpacity, transform: `translateY(${taglineY}px)`, fontSize: 28, fontWeight: 600, color: 'rgba(255, 255, 255, 0.85)', letterSpacing: 2, textTransform: 'uppercase' }}>
            {ctaText}
          </div>
        )}

        {ctaSubtext && (
          <div
            style={{
              opacity: ctaOpacity,
              transform: `scale(${Math.max(0.5, ctaScale) * ctaPulse})`,
              marginTop: 40,
              display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 16,
            }}
          >
            <div style={{ padding: '24px 60px', backgroundColor: brandColor, borderRadius: 50, boxShadow: `0 0 40px ${brandColor}99, 0 8px 30px rgba(0,0,0,0.3)` }}>
              <span style={{ fontSize: 32, fontWeight: 800, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>{ctaText}</span>
            </div>
            <span style={{ fontSize: 22, fontWeight: 500, color: 'rgba(255, 255, 255, 0.7)' }}>{ctaSubtext}</span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ==================== Main Component ====================

export const UGCReel: React.FC<UGCReelProps> = ({
  backgroundVideos,
  videoDurations,
  hasNativeAudio = true,
  brollOverlays = [],
  dataOverlays = [],
  brandName,
  brandColor = '#10B981',
  logoSrc,
  ctaText,
  ctaSubtext,
  outroDuration = 5,
  showWatermark = true,
  transitionDuration = 0.4,
  captions = [],
  showCaptions = false,
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();
  const currentTimeMs = (frame / fps) * 1000;

  const outroDurationFrames = outroDuration * fps;
  const outroStartFrame = durationInFrames - outroDurationFrames;
  const isInOutro = frame >= outroStartFrame;
  const crossfadeFrames = transitionDuration * fps;

  const videoStartFrames: number[] = [];
  let cumulative = 0;
  for (const d of videoDurations) {
    videoStartFrames.push(cumulative);
    cumulative += d * fps;
  }

  const watermarkOpacity = interpolate(frame, [outroStartFrame - fps * 0.3, outroStartFrame], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* Video segments */}
      {backgroundVideos.map((videoFile, index) => {
        const startFrame = videoStartFrames[index];
        const durationFrames = videoDurations[index] * fps;
        const endFrame = startFrame + durationFrames;

        let opacity = 1;
        if (index > 0) {
          opacity *= interpolate(frame, [startFrame - crossfadeFrames / 2, startFrame + crossfadeFrames / 2], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        }
        if (index < backgroundVideos.length - 1) {
          opacity *= interpolate(frame, [endFrame - crossfadeFrames / 2, endFrame + crossfadeFrames / 2], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
        }

        const seqStart = Math.max(0, startFrame - Math.floor(crossfadeFrames / 2));
        const seqEnd = Math.min(durationInFrames, endFrame + Math.floor(crossfadeFrames / 2));

        return (
          <Sequence key={`video-${index}`} from={seqStart} durationInFrames={seqEnd - seqStart}>
            <AbsoluteFill style={{ opacity }}>
              <Video
                src={resolvedSrc(videoFile)}
                muted={!hasNativeAudio}
                loop={false}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
              />
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* B-roll overlays */}
      {brollOverlays.map((broll, idx) => {
        const sceneStart = videoStartFrames[broll.sceneIndex] ?? 0;
        const sceneDuration = videoDurations[broll.sceneIndex] ?? 5;
        const brollStart = sceneStart + (broll.startOffset ?? 0) * fps;
        const brollDuration = (broll.duration ?? sceneDuration) * fps;
        const fadeInF = (broll.fadeIn ?? 0.3) * fps;
        const fadeOutF = (broll.fadeOut ?? 0.3) * fps;

        const brollOpacity = (() => {
          const local = frame - brollStart;
          if (local < 0 || local > brollDuration) return 0;
          let o = 1;
          if (local < fadeInF) o *= interpolate(local, [0, fadeInF], [0, 1], { extrapolateRight: 'clamp' });
          if (local > brollDuration - fadeOutF) o *= interpolate(local, [brollDuration - fadeOutF, brollDuration], [1, 0], { extrapolateLeft: 'clamp' });
          return o;
        })();

        const isImage = /\.(png|jpg|jpeg|webp)$/i.test(broll.asset);

        return (
          <Sequence key={`broll-${idx}`} from={brollStart} durationInFrames={Math.ceil(brollDuration)}>
            <AbsoluteFill style={{ opacity: brollOpacity }}>
              {isImage ? (
                <img src={resolvedSrc(broll.asset)} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              ) : (
                <Video src={resolvedSrc(broll.asset)} muted loop={false} style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              )}
            </AbsoluteFill>
          </Sequence>
        );
      })}

      {/* Data overlays */}
      {dataOverlays.map((config, idx) => {
        const sceneStart = videoStartFrames[config.sceneIndex] ?? 0;
        const sceneDuration = (videoDurations[config.sceneIndex] ?? 5) * fps;
        return (
          <Sequence key={`data-${idx}`} from={sceneStart} durationInFrames={sceneDuration}>
            <DataOverlay title={config.title} hints={config.hints} durationFrames={sceneDuration} accentColor={brandColor} />
          </Sequence>
        );
      })}

      {/* Vignette */}
      <AbsoluteFill style={{ background: 'radial-gradient(ellipse at center, transparent 60%, rgba(0,0,0,0.3) 100%)', pointerEvents: 'none' }} />

      {/* Bottom gradient for watermark */}
      {showWatermark && !isInOutro && (
        <AbsoluteFill style={{ background: 'linear-gradient(180deg, transparent 70%, rgba(0,0,0,0.4) 100%)', pointerEvents: 'none' }} />
      )}

      {/* Brand watermark */}
      {showWatermark && !isInOutro && (brandName != null || logoSrc != null) && (
        <AbsoluteFill style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80, opacity: watermarkOpacity }}>
          <div
            style={{
              display: 'flex', alignItems: 'center', gap: 12,
              padding: logoSrc ? '12px 24px 12px 16px' : '12px 24px',
              backgroundColor: 'rgba(0,0,0,0.5)', borderRadius: 40,
              border: '2px solid rgba(255,255,255,0.15)', backdropFilter: 'blur(8px)',
            }}
          >
            {logoSrc && (
              <Img
                src={resolvedSrc(logoSrc)}
                style={{ width: 36, height: 36, filter: `drop-shadow(0 0 10px ${brandColor}CC)` }}
              />
            )}
            {brandName && (
              <span style={{ fontSize: 24, fontWeight: 800, color: 'white', letterSpacing: 2, textTransform: 'uppercase' }}>
                {brandName}
              </span>
            )}
          </div>
        </AbsoluteFill>
      )}

      {/* Captions */}
      {showCaptions && captions.length > 0 && !isInOutro && (
        <SubtitleTrack
          captions={captions}
          highlightColor={brandColor}
          variant="pill"
          bottomPadding={160}
          currentTimeMs={currentTimeMs}
        />
      )}

      {/* Outro */}
      <Sequence from={outroStartFrame} durationInFrames={outroDurationFrames}>
        <UGCOutro ctaText={ctaText} ctaSubtext={ctaSubtext} brandName={brandName} brandColor={brandColor} logoSrc={logoSrc} />
      </Sequence>
    </AbsoluteFill>
  );
};

// ==================== Duration Helper ====================

export function calculateUGCDuration(
  videoDurations: number[],
  outroDuration = 5
): { totalSeconds: number; totalFrames: number } {
  const contentSeconds = videoDurations.reduce((sum, d) => sum + d, 0);
  const totalSeconds = contentSeconds + outroDuration;
  return { totalSeconds, totalFrames: totalSeconds * 30 };
}
