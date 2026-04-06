/**
 * VoiceoverReel — generic voiceover reel composition.
 *
 * Brand identity (logo, colors, CTA text, tagline) is fully prop-driven.
 * No hardcoded brand names or colors.
 */

import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  useCurrentFrame,
  useVideoConfig,
  Img,
  interpolate,
  Easing,
  staticFile,
  spring,
} from 'remotion';
import { Audio, Video } from '@remotion/media';
import type { Caption } from '@remotion/captions';
import { SubtitleTrack } from '../components/SubtitleTrack';

// ==================== Types ====================

export type BrandConfig = {
  /** Brand name displayed in watermark and outro */
  name: string;
  /** Primary brand color (hex) */
  color: string;
  /** Path to logo image (staticFile path or URL) */
  logoSrc?: string;
  /** Tagline shown in outro */
  tagline?: string;
  /** CTA button text in outro */
  ctaText?: string;
};

export type VoiceoverReelProps = {
  script: string;
  audioUrl: string;
  captions: Caption[];
  backgroundImages: string[];
  backgroundVideos?: string[];
  backgroundMusic?: string;
  musicVolume?: number;
  audioDurationMs?: number;
  brand?: BrandConfig;
};

// ==================== Constants ====================

const OUTRO_DURATION_SECONDS = 5;
const DEFAULT_BRAND_COLOR = '#10B981';

// ==================== Ken Burns ====================

const KenBurnsImage: React.FC<{
  src: string;
  durationInFrames: number;
  direction: 'zoom-in' | 'zoom-out' | 'pan-left' | 'pan-right';
}> = ({ src, durationInFrames, direction }) => {
  const frame = useCurrentFrame();
  const rawProgress = frame / durationInFrames;
  const progress = Easing.inOut(Easing.cubic)(rawProgress);

  let scale: number, translateX: number, translateY: number;

  switch (direction) {
    case 'zoom-in':
      scale = interpolate(progress, [0, 1], [1, 1.35], { extrapolateRight: 'clamp' });
      translateX = interpolate(progress, [0, 1], [0, -5], { extrapolateRight: 'clamp' });
      translateY = interpolate(progress, [0, 1], [0, -3], { extrapolateRight: 'clamp' });
      break;
    case 'zoom-out':
      scale = interpolate(progress, [0, 1], [1.35, 1], { extrapolateRight: 'clamp' });
      translateX = interpolate(progress, [0, 1], [-5, 0], { extrapolateRight: 'clamp' });
      translateY = 0;
      break;
    case 'pan-left':
      scale = 1.25;
      translateX = interpolate(progress, [0, 1], [8, -8], { extrapolateRight: 'clamp' });
      translateY = interpolate(progress, [0, 1], [-2, 2], { extrapolateRight: 'clamp' });
      break;
    case 'pan-right':
    default:
      scale = 1.25;
      translateX = interpolate(progress, [0, 1], [-8, 8], { extrapolateRight: 'clamp' });
      translateY = interpolate(progress, [0, 1], [2, -2], { extrapolateRight: 'clamp' });
      break;
  }

  return (
    <Img
      src={src}
      style={{
        width: '100%',
        height: '100%',
        objectFit: 'cover',
        transform: `scale(${scale}) translate(${translateX}%, ${translateY}%)`,
        filter: 'brightness(0.5) contrast(1.15) saturate(1.1)',
      }}
    />
  );
};

// ==================== Brand Watermark ====================

const BrandWatermark: React.FC<{ brand: BrandConfig; opacity: number }> = ({ brand, opacity }) => (
  <AbsoluteFill
    style={{ justifyContent: 'flex-end', alignItems: 'center', paddingBottom: 80, opacity }}
  >
    <div
      style={{
        display: 'flex',
        alignItems: 'center',
        gap: 12,
        padding: brand.logoSrc ? '12px 24px 12px 16px' : '12px 24px',
        backgroundColor: 'rgba(0,0,0,0.6)',
        borderRadius: 40,
        border: '2px solid rgba(255,255,255,0.2)',
      }}
    >
      {brand.logoSrc && (
        <Img
          src={brand.logoSrc.startsWith('http') ? brand.logoSrc : staticFile(brand.logoSrc)}
          style={{
            width: 40,
            height: 40,
            filter: `drop-shadow(0 0 15px ${brand.color}CC)`,
          }}
        />
      )}
      <span
        style={{
          fontSize: 28,
          fontWeight: 800,
          color: 'white',
          letterSpacing: 2,
          textTransform: 'uppercase',
        }}
      >
        {brand.name}
      </span>
    </div>
  </AbsoluteFill>
);

// ==================== Outro ====================

const Outro: React.FC<{ durationInFrames: number; brand: BrandConfig }> = ({
  durationInFrames: _durationInFrames,
  brand,
}) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const brandColor = brand.color;

  const overlayOpacity = interpolate(frame, [0, fps * 0.5], [0, 0.85], { extrapolateRight: 'clamp' });

  const logoScale = spring({ frame: frame - fps * 0.3, fps, config: { damping: 12, stiffness: 100 } });
  const glowIntensity = interpolate(Math.sin((frame / fps) * Math.PI * 2), [-1, 1], [0.4, 0.8]);

  const textOpacity = interpolate(frame, [fps * 1, fps * 1.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const textY = interpolate(frame, [fps * 1, fps * 1.5], [30, 0], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });

  const ctaOpacity = interpolate(frame, [fps * 2, fps * 2.5], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
  });
  const ctaScale = spring({ frame: frame - fps * 2, fps, config: { damping: 15, stiffness: 120 } });

  return (
    <AbsoluteFill>
      <AbsoluteFill style={{ backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})` }} />

      <AbsoluteFill
        style={{ justifyContent: 'center', alignItems: 'center', flexDirection: 'column', gap: 40 }}
      >
        <div
          style={{ display: 'flex', alignItems: 'center', gap: 24, transform: `scale(${logoScale})` }}
        >
          {brand.logoSrc && (
            <Img
              src={brand.logoSrc.startsWith('http') ? brand.logoSrc : staticFile(brand.logoSrc)}
              style={{
                width: 100,
                height: 100,
                filter: `drop-shadow(0 0 ${30 * glowIntensity}px ${brandColor}CC)`,
              }}
            />
          )}
          <span
            style={{
              fontSize: 56,
              fontWeight: 900,
              color: 'white',
              letterSpacing: 4,
              textTransform: 'uppercase',
              textShadow: '0 4px 20px rgba(0,0,0,0.5)',
            }}
          >
            {brand.name}
          </span>
        </div>

        {brand.tagline && (
          <div
            style={{
              opacity: textOpacity,
              transform: `translateY(${textY}px)`,
              fontSize: 28,
              fontWeight: 600,
              color: 'rgba(255, 255, 255, 0.8)',
              letterSpacing: 2,
              textTransform: 'uppercase',
            }}
          >
            {brand.tagline}
          </div>
        )}

        {brand.ctaText && (
          <div
            style={{
              opacity: ctaOpacity,
              transform: `scale(${Math.max(0.5, ctaScale)})`,
              marginTop: 40,
              padding: '20px 50px',
              backgroundColor: brandColor,
              borderRadius: 50,
              boxShadow: `0 0 30px ${brandColor}80`,
            }}
          >
            <span
              style={{
                fontSize: 32,
                fontWeight: 800,
                color: 'white',
                letterSpacing: 2,
                textTransform: 'uppercase',
              }}
            >
              {brand.ctaText}
            </span>
          </div>
        )}
      </AbsoluteFill>
    </AbsoluteFill>
  );
};

// ==================== Main Component ====================

export const VoiceoverReel: React.FC<VoiceoverReelProps> = ({
  script,
  audioUrl,
  captions,
  backgroundImages,
  backgroundVideos,
  backgroundMusic,
  musicVolume = 0.25,
  brand = { name: 'Brand', color: DEFAULT_BRAND_COLOR },
}) => {
  const { fps, durationInFrames } = useVideoConfig();
  const frame = useCurrentFrame();

  const outroDurationFrames = OUTRO_DURATION_SECONDS * fps;
  const outroStartFrame = durationInFrames - outroDurationFrames;
  const contentDurationFrames = outroStartFrame;
  const isInOutro = frame >= outroStartFrame;

  const useVideos = backgroundVideos != null && backgroundVideos.length > 0;
  const numSegments = useVideos ? (backgroundVideos?.length ?? 2) : 2;
  const crossfadeDuration = fps * 0.4;
  const segmentDuration = contentDurationFrames / numSegments;
  const switch1Frame = Math.floor(segmentDuration);
  const switch2Frame = Math.floor(segmentDuration * 2);

  const video1Opacity = interpolate(
    frame,
    [switch1Frame - crossfadeDuration / 2, switch1Frame + crossfadeDuration / 2],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const video2FadeIn = interpolate(
    frame,
    [switch1Frame - crossfadeDuration / 2, switch1Frame + crossfadeDuration / 2],
    [0, 1],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const video2FadeOut =
    numSegments >= 3
      ? interpolate(
          frame,
          [switch2Frame - crossfadeDuration / 2, switch2Frame + crossfadeDuration / 2],
          [1, 0],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
      : 1;
  const video2Opacity = video2FadeIn * video2FadeOut;
  const video3Opacity =
    numSegments >= 3
      ? interpolate(
          frame,
          [switch2Frame - crossfadeDuration / 2, switch2Frame + crossfadeDuration / 2],
          [0, 1],
          { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
        )
      : 0;

  const captionOpacity = interpolate(
    frame,
    [outroStartFrame - fps * 0.5, outroStartFrame],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );
  const watermarkOpacity = interpolate(
    frame,
    [outroStartFrame - fps * 0.3, outroStartFrame],
    [1, 0],
    { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' }
  );

  const resolvedSrc = (src: string) =>
    src.startsWith('http') ? src : staticFile(src);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000000' }}>
      {/* VIDEO BACKGROUNDS */}
      {useVideos && backgroundVideos && (
        <>
          {backgroundVideos[0] && (
            <Sequence from={0} durationInFrames={switch1Frame + Math.floor(crossfadeDuration)}>
              <AbsoluteFill style={{ opacity: video1Opacity }}>
                <Video src={resolvedSrc(backgroundVideos[0])} muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </AbsoluteFill>
            </Sequence>
          )}
          {backgroundVideos[1] && (
            <Sequence from={switch1Frame - Math.floor(crossfadeDuration / 2)} durationInFrames={Math.floor(segmentDuration) + Math.floor(crossfadeDuration)}>
              <AbsoluteFill style={{ opacity: video2Opacity }}>
                <Video src={resolvedSrc(backgroundVideos[1])} muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </AbsoluteFill>
            </Sequence>
          )}
          {backgroundVideos[2] && (
            <Sequence from={switch2Frame - Math.floor(crossfadeDuration / 2)}>
              <AbsoluteFill style={{ opacity: video3Opacity }}>
                <Video src={resolvedSrc(backgroundVideos[2])} muted loop style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
              </AbsoluteFill>
            </Sequence>
          )}
        </>
      )}

      {/* IMAGE BACKGROUNDS (Ken Burns) */}
      {!useVideos && (
        <>
          {backgroundImages[0] && (
            <AbsoluteFill style={{ opacity: video1Opacity }}>
              <KenBurnsImage src={backgroundImages[0]} durationInFrames={Math.floor(segmentDuration)} direction="zoom-in" />
            </AbsoluteFill>
          )}
          {backgroundImages[1] && (
            <AbsoluteFill style={{ opacity: video2Opacity }}>
              <KenBurnsImage src={backgroundImages[1]} durationInFrames={Math.floor(segmentDuration)} direction="pan-right" />
            </AbsoluteFill>
          )}
          {backgroundImages[2] && (
            <AbsoluteFill style={{ opacity: video3Opacity }}>
              <KenBurnsImage src={backgroundImages[2]} durationInFrames={Math.floor(segmentDuration)} direction="zoom-out" />
            </AbsoluteFill>
          )}
        </>
      )}

      {/* Gradient overlay */}
      <AbsoluteFill
        style={{
          background: useVideos
            ? 'linear-gradient(180deg, rgba(0,0,0,0.15) 0%, rgba(0,0,0,0) 30%, rgba(0,0,0,0) 70%, rgba(0,0,0,0.4) 100%)'
            : 'linear-gradient(180deg, rgba(0,0,0,0.3) 0%, rgba(0,0,0,0.1) 30%, rgba(0,0,0,0.1) 70%, rgba(0,0,0,0.6) 100%)',
        }}
      />

      {/* Voiceover */}
      {audioUrl && <Audio src={resolvedSrc(audioUrl)} />}

      {/* Background music */}
      {backgroundMusic && (
        <Audio src={resolvedSrc(backgroundMusic)} volume={musicVolume} />
      )}

      {/* Captions */}
      {!isInOutro && captions.length > 0 && (
        <AbsoluteFill style={{ opacity: captionOpacity }}>
          <SubtitleTrack
            captions={captions}
            highlightColor="#FFFF00"
            variant="kinetic"
            position="center"
          />
        </AbsoluteFill>
      )}

      {/* Fallback script text */}
      {captions.length === 0 && !isInOutro && (
        <AbsoluteFill style={{ justifyContent: 'center', alignItems: 'center', padding: '0 60px' }}>
          <div style={{ fontSize: 56, fontWeight: 900, color: 'white', textAlign: 'center', textTransform: 'uppercase' }}>
            {script}
          </div>
        </AbsoluteFill>
      )}

      {/* Brand watermark */}
      {!isInOutro && (
        <BrandWatermark brand={brand} opacity={watermarkOpacity} />
      )}

      {/* Outro */}
      <Sequence from={outroStartFrame} durationInFrames={outroDurationFrames}>
        <Outro durationInFrames={outroDurationFrames} brand={brand} />
      </Sequence>
    </AbsoluteFill>
  );
};
