/**
 * ProductDecoded — generic product disassembly composition.
 *
 * Product disassembly/assembly composition with component labels and data overlay.
 * All data comes from props — no hardcoded branding.
 */

import React, { useMemo } from 'react';
import {
  AbsoluteFill,
  Sequence,
  Img,
  Audio,
  useCurrentFrame,
  useVideoConfig,
  interpolate,
  spring,
  staticFile,
  Easing,
  OffthreadVideo,
} from 'remotion';
import type { Caption } from '@remotion/captions';
import { SubtitleTrack } from '../components/SubtitleTrack';

// ==================== Types ====================

export type ComponentLabel = {
  name: string;
  /** Metric value (e.g. calories, grams, price) */
  metricValue: number;
  /** Unit label (e.g. "cal", "g", "$") */
  metricUnit?: string;
  x: number; // 0-100 percent
  y: number; // 0-100 percent
  anchor?: 'left' | 'right';
};

export type MacroData = {
  /** First macro (e.g. protein) */
  a: number;
  aLabel: string;
  /** Second macro (e.g. carbs) */
  b: number;
  bLabel: string;
  /** Third macro (e.g. fat) */
  c: number;
  cLabel: string;
};

export type ProductDecodedProps = {
  /** Product name shown in title overlay and outro */
  productName: string;
  /** Primary metric total (e.g. total calories) */
  totalMetric: number;
  /** Unit for the primary metric */
  metricUnit?: string;
  /** Macro breakdown for donut chart */
  macros?: MacroData;
  disassemblyVideo: string;
  holdVideo: string;
  holdReversedVideo: string;
  assemblyVideo: string;
  /** Freeze frame image for data overlay segment */
  freezeFrame: string;
  /** Component labels with positions */
  components: ComponentLabel[];
  audioUrl?: string;
  captions?: Caption[];
  musicUrl?: string;
  musicVolume?: number;
  /** Brand accent color */
  accentColor?: string;
  /** Brand name shown in outro */
  brandName?: string;
  /** Logo path for outro */
  logoSrc?: string;
  /** Outro CTA */
  ctaText?: string;
  timing: {
    disassembly: number;
    floatForward: number;
    floatReversed: number;
    dataOverlay: number;
    assembly: number;
    outro: number;
  };
  /** SFX paths (optional, falls back to no audio) */
  sfx?: {
    disassemblyWhoosh?: string;
    labelPop?: string;
    dataReveal?: string;
    assemblyReverse?: string;
  };
};

// ==================== Constants ====================

const FONT = 'DM Sans, system-ui, sans-serif';
const AMBER = '#F59E0B';
const RED = '#EF4444';

// ==================== Component Label ====================

const ComponentLabelOverlay: React.FC<{
  component: ComponentLabel;
  delay: number;
  accentColor: string;
  fadeOut?: { start: number; end: number };
}> = ({ component, delay, accentColor, fadeOut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const entrance = spring({ frame, fps, delay, config: { damping: 15, stiffness: 150 } });
  const exitOpacity = fadeOut
    ? interpolate(frame, [fadeOut.start, fadeOut.end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  const scale = interpolate(entrance, [0, 1], [0.3, 1]);
  const opacity = interpolate(entrance, [0, 0.4], [0, 1], { extrapolateRight: 'clamp' }) * exitOpacity;
  const isRight = component.anchor === 'right';

  const dotX = (component.x / 100) * 1080;
  const dotY = (component.y / 100) * 1920;
  const labelX = dotX + (isRight ? 30 : -30);
  const labelY = dotY - 20;
  const unit = component.metricUnit ?? '';

  return (
    <div style={{ position: 'absolute', inset: 0, pointerEvents: 'none' }}>
      <div
        style={{
          position: 'absolute', left: dotX - 6, top: dotY - 6, width: 12, height: 12,
          borderRadius: '50%', backgroundColor: accentColor, boxShadow: `0 0 12px ${accentColor}CC`,
          opacity, transform: `scale(${scale})`,
        }}
      />
      <svg style={{ position: 'absolute', inset: 0, width: '100%', height: '100%', opacity }}>
        <line x1={dotX} y1={dotY} x2={labelX} y2={labelY + 18} stroke={accentColor} strokeWidth={2} strokeDasharray="6,4" opacity={0.7} />
      </svg>
      <div
        style={{
          position: 'absolute',
          left: isRight ? labelX : undefined,
          right: isRight ? undefined : 1080 - labelX,
          top: labelY,
          transform: `scale(${scale})`,
          transformOrigin: isRight ? 'left center' : 'right center',
          opacity,
          display: 'flex', alignItems: 'center', gap: 8,
          backgroundColor: 'rgba(0, 0, 0, 0.75)', backdropFilter: 'blur(8px)',
          borderRadius: 20, padding: '8px 16px',
          border: `1.5px solid ${accentColor}80`,
          whiteSpace: 'nowrap',
        }}
      >
        <span style={{ color: '#fff', fontSize: 26, fontFamily: FONT, fontWeight: 500 }}>{component.name}</span>
        <span style={{ color: accentColor, fontSize: 26, fontFamily: FONT, fontWeight: 700 }}>{component.metricValue}{unit}</span>
      </div>
    </div>
  );
};

// ==================== Running Total ====================

const RunningTotal: React.FC<{
  components: ComponentLabel[];
  staggerFrames: number;
  startDelay: number;
  accentColor: string;
  metricUnit?: string;
  fadeOut?: { start: number; end: number };
}> = ({ components, staggerFrames, startDelay, accentColor, metricUnit = '', fadeOut }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  let visibleCount = 0;
  for (let i = 0; i < components.length; i++) {
    if (frame >= startDelay + i * staggerFrames + 8) visibleCount = i + 1;
  }

  const runningTotal = components.slice(0, visibleCount).reduce((sum, c) => sum + c.metricValue, 0);
  const allVisible = visibleCount === components.length;

  const entrance = spring({ frame, fps, delay: startDelay, config: { damping: 200 } });
  const pulseScale = allVisible
    ? interpolate(spring({ frame, fps, delay: startDelay + components.length * staggerFrames + 5, config: { damping: 12 } }), [0, 1], [1, 1.08])
    : 1;
  const exitOpacity = fadeOut
    ? interpolate(frame, [fadeOut.start, fadeOut.end], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })
    : 1;

  return (
    <div style={{ position: 'absolute', bottom: 120, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity: entrance * exitOpacity, transform: `scale(${pulseScale})` }}>
      <div
        style={{
          backgroundColor: allVisible ? `${accentColor}33` : 'rgba(0, 0, 0, 0.7)',
          backdropFilter: 'blur(12px)', borderRadius: 28, padding: '14px 32px',
          border: `2px solid ${allVisible ? accentColor : 'rgba(255,255,255,0.15)'}`,
          display: 'flex', alignItems: 'center', gap: 12,
        }}
      >
        <span style={{ color: '#fff', fontSize: 32, fontFamily: FONT, fontWeight: 500 }}>Total:</span>
        <span style={{ color: allVisible ? accentColor : '#fff', fontSize: 38, fontFamily: FONT, fontWeight: 800 }}>
          {runningTotal}{metricUnit}
        </span>
      </div>
    </div>
  );
};

// ==================== Donut Chart ====================

const DonutChart: React.FC<{ macros: MacroData; totalMetric: number; accentColor: string }> = ({ macros, totalMetric, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const size = 400;
  const cx = size / 2;
  const cy = size / 2;
  const radius = 150;
  const strokeWidth = 48;
  const circumference = 2 * Math.PI * radius;

  const segments = [
    { label: macros.aLabel, grams: macros.a, color: accentColor, pct: macros.a / (macros.a + macros.b + macros.c) },
    { label: macros.bLabel, grams: macros.b, color: AMBER, pct: macros.b / (macros.a + macros.b + macros.c) },
    { label: macros.cLabel, grams: macros.c, color: RED, pct: macros.c / (macros.a + macros.b + macros.c) },
  ];

  const drawProgress = interpolate(frame, [0, 2 * fps], [0, 1], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  let cumulativeOffset = 0;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 40 }}>
      <svg width={size} height={size}>
        <circle cx={cx} cy={cy} r={radius} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth={strokeWidth} />
        {segments.map((seg) => {
          const segLen = seg.pct * circumference;
          const drawn = segLen * drawProgress;
          const rotation = -90 + (cumulativeOffset / circumference) * 360 * drawProgress;
          cumulativeOffset += segLen;
          return (
            <circle key={seg.label} cx={cx} cy={cy} r={radius} fill="none" stroke={seg.color} strokeWidth={strokeWidth}
              strokeDasharray={`${drawn} ${circumference}`} strokeLinecap="round"
              transform={`rotate(${rotation} ${cx} ${cy})`}
              opacity={interpolate(drawProgress, [0, 0.1], [0, 1], { extrapolateRight: 'clamp' })}
            />
          );
        })}
        <text x={cx} y={cy - 14} textAnchor="middle" fill="#fff" fontSize={64} fontFamily={FONT} fontWeight={800}
          opacity={interpolate(frame, [fps, 1.5 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
          {totalMetric}
        </text>
        <text x={cx} y={cy + 30} textAnchor="middle" fill="rgba(255,255,255,0.6)" fontSize={28} fontFamily={FONT} fontWeight={500}
          opacity={interpolate(frame, [fps, 1.5 * fps], [0, 1], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' })}>
          total
        </text>
      </svg>
      <div style={{ display: 'flex', gap: 56 }}>
        {segments.map((seg, i) => {
          const barEntrance = spring({ frame, fps, delay: Math.round(1.5 * fps) + i * 8, config: { damping: 200 } });
          return (
            <div key={seg.label} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 8, opacity: barEntrance, transform: `translateY(${interpolate(barEntrance, [0, 1], [20, 0])}px)` }}>
              <div style={{ width: 16, height: 16, borderRadius: '50%', backgroundColor: seg.color }} />
              <span style={{ color: '#fff', fontSize: 36, fontFamily: FONT, fontWeight: 700 }}>{seg.grams}g</span>
              <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 26, fontFamily: FONT, fontWeight: 500 }}>{seg.label}</span>
            </div>
          );
        })}
      </div>
    </div>
  );
};

// ==================== Data Overlay Segment ====================

const DataOverlaySegment: React.FC<{
  macros?: MacroData;
  totalMetric: number;
  productName: string;
  durationInFrames: number;
  accentColor: string;
}> = ({ macros, totalMetric, productName, durationInFrames, accentColor }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();

  const exitStart = durationInFrames - Math.round(fps);
  const exitOpacity = interpolate(frame, [exitStart, durationInFrames], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.in(Easing.quad) });
  const exitScale = interpolate(frame, [exitStart, durationInFrames], [1, 0.95], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const overlayIn = interpolate(frame, [0, Math.round(0.5 * fps)], [0, 0.82], { extrapolateRight: 'clamp', easing: Easing.out(Easing.quad) });
  const overlayOut = interpolate(frame, [exitStart, durationInFrames], [0.82, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp' });
  const overlayOpacity = frame < exitStart ? overlayIn : overlayOut;
  const titleEntrance = spring({ frame, fps, delay: Math.round(0.3 * fps), config: { damping: 200 } });

  return (
    <AbsoluteFill>
      <div style={{ position: 'absolute', inset: 0, backgroundColor: `rgba(0, 0, 0, ${overlayOpacity})`, backdropFilter: 'blur(12px)' }} />
      <div style={{ position: 'absolute', inset: 0, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40, opacity: exitOpacity, transform: `scale(${exitScale})` }}>
        <div style={{ opacity: titleEntrance, transform: `translateY(${interpolate(titleEntrance, [0, 1], [30, 0])}px)` }}>
          <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 36, fontFamily: FONT, fontWeight: 500, textTransform: 'uppercase', letterSpacing: 4 }}>
            Breakdown
          </span>
        </div>
        <div style={{ opacity: titleEntrance, transform: `translateY(${interpolate(titleEntrance, [0, 1], [20, 0])}px)` }}>
          <span style={{ color: '#fff', fontSize: 60, fontFamily: FONT, fontWeight: 800 }}>{productName}</span>
        </div>
        {macros && <DonutChart macros={macros} totalMetric={totalMetric} accentColor={accentColor} />}
        {!macros && (
          <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
            <span style={{ color: accentColor, fontSize: 80, fontFamily: FONT, fontWeight: 900 }}>{totalMetric}</span>
          </div>
        )}
      </div>
    </AbsoluteFill>
  );
};

// ==================== Product Title ====================

const ProductTitle: React.FC<{ name: string }> = ({ name }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, delay: Math.round(0.5 * fps), config: { damping: 200 } });
  const exit = interpolate(frame, [3.5 * fps, 4.5 * fps], [1, 0], { extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.quad) });
  const opacity = entrance * exit;
  const translateY = interpolate(entrance, [0, 1], [40, 0]);

  return (
    <div style={{ position: 'absolute', top: 160, left: 0, right: 0, display: 'flex', justifyContent: 'center', opacity, transform: `translateY(${translateY}px)` }}>
      <div style={{ backgroundColor: 'rgba(0, 0, 0, 0.6)', backdropFilter: 'blur(12px)', borderRadius: 24, padding: '16px 40px', border: '1.5px solid rgba(255, 255, 255, 0.15)' }}>
        <span style={{ color: '#fff', fontSize: 44, fontFamily: FONT, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 2 }}>{name}</span>
      </div>
    </div>
  );
};

// ==================== Outro ====================

const ProductOutro: React.FC<{
  productName: string;
  totalMetric: number;
  metricUnit?: string;
  accentColor: string;
  brandName?: string;
  logoSrc?: string;
  ctaText?: string;
}> = ({ productName, totalMetric, metricUnit = '', accentColor, brandName, logoSrc, ctaText }) => {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const entrance = spring({ frame, fps, delay: Math.round(0.3 * fps), config: { damping: 200 } });
  const ctaEntrance = spring({ frame, fps, delay: Math.round(1.5 * fps), config: { damping: 15, stiffness: 120 } });

  return (
    <AbsoluteFill style={{ backgroundColor: '#0a0a0a', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 40 }}>
      {logoSrc && (
        <div style={{ opacity: entrance, transform: `scale(${interpolate(entrance, [0, 1], [0.8, 1])})` }}>
          <Img src={logoSrc.startsWith('http') ? logoSrc : staticFile(logoSrc)} style={{ width: 120, height: 120 }} />
        </div>
      )}
      <div style={{ opacity: entrance, transform: `translateY(${interpolate(entrance, [0, 1], [20, 0])}px)`, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 12 }}>
        <span style={{ color: 'rgba(255,255,255,0.5)', fontSize: 24, fontFamily: FONT, fontWeight: 500 }}>{productName}</span>
        <span style={{ color: accentColor, fontSize: 56, fontFamily: FONT, fontWeight: 800 }}>{totalMetric}{metricUnit}</span>
      </div>
      {ctaText && (
        <div style={{ opacity: ctaEntrance, transform: `scale(${interpolate(ctaEntrance, [0, 1], [0.8, 1])})`, backgroundColor: accentColor, borderRadius: 40, padding: '18px 48px' }}>
          <span style={{ color: '#fff', fontSize: 32, fontFamily: FONT, fontWeight: 700 }}>{ctaText}</span>
        </div>
      )}
      {brandName && (
        <div style={{ opacity: interpolate(ctaEntrance, [0.5, 1], [0, 1], { extrapolateLeft: 'clamp' }) }}>
          <span style={{ color: 'rgba(255,255,255,0.4)', fontSize: 22, fontFamily: FONT, fontWeight: 500 }}>{brandName}</span>
        </div>
      )}
    </AbsoluteFill>
  );
};

// ==================== Main Component ====================

export const ProductDecoded: React.FC<ProductDecodedProps> = ({
  productName,
  totalMetric,
  metricUnit = '',
  macros,
  disassemblyVideo,
  holdVideo,
  holdReversedVideo,
  assemblyVideo,
  freezeFrame,
  components,
  audioUrl,
  captions = [],
  musicUrl,
  musicVolume = 0.15,
  accentColor = '#10B981',
  brandName,
  logoSrc,
  ctaText,
  timing,
  sfx,
}) => {
  const { fps } = useVideoConfig();

  const seg = {
    disassembly: Math.round(timing.disassembly * fps),
    floatForward: Math.round(timing.floatForward * fps),
    floatReversed: Math.round(timing.floatReversed * fps),
    dataOverlay: Math.round(timing.dataOverlay * fps),
    assembly: Math.round(timing.assembly * fps),
    outro: Math.round(timing.outro * fps),
  };

  const off = {
    disassembly: 0,
    floatForward: seg.disassembly,
    floatReversed: seg.disassembly + seg.floatForward,
    dataOverlay: seg.disassembly + seg.floatForward + seg.floatReversed,
    assembly: seg.disassembly + seg.floatForward + seg.floatReversed + seg.dataOverlay,
    outro: seg.disassembly + seg.floatForward + seg.floatReversed + seg.dataOverlay + seg.assembly,
  };

  const totalFloatFrames = seg.floatForward + seg.floatReversed;
  const labelBuffer = Math.round(0.5 * fps);
  const availableForLabels = totalFloatFrames - labelBuffer * 2;
  const staggerFrames = Math.floor(availableForLabels / Math.max(components.length, 1));
  const labelStartDelay = labelBuffer;
  const labelFadeOutStart = totalFloatFrames - Math.round(1.2 * fps);
  const labelFadeOutEnd = totalFloatFrames - Math.round(0.2 * fps);

  const videoStyle = { width: '100%' as const, height: '100%' as const, objectFit: 'cover' as const };
  const resolveStaticSrc = (src: string) => src.startsWith('http') ? src : staticFile(src);

  return (
    <AbsoluteFill style={{ backgroundColor: '#000' }}>
      {audioUrl && <Audio src={resolveStaticSrc(audioUrl)} />}
      {musicUrl && <Audio src={resolveStaticSrc(musicUrl)} volume={musicVolume} />}

      {/* Segment 1: Disassembly */}
      <Sequence durationInFrames={seg.disassembly} premountFor={fps}>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(disassemblyVideo)} style={videoStyle} />
        </AbsoluteFill>
        <ProductTitle name={productName} />
        {sfx?.disassemblyWhoosh && (
          <Sequence from={Math.round(3 * fps)}>
            <Audio src={staticFile(sfx.disassemblyWhoosh)} volume={0.2} />
          </Sequence>
        )}
      </Sequence>

      {/* Segment 2: Float Forward */}
      <Sequence from={off.floatForward} durationInFrames={seg.floatForward} premountFor={fps}>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(holdVideo)} style={videoStyle} />
        </AbsoluteFill>
      </Sequence>

      {/* Segment 3: Float Reversed */}
      <Sequence from={off.floatReversed} durationInFrames={seg.floatReversed} premountFor={fps}>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(holdReversedVideo)} style={videoStyle} />
        </AbsoluteFill>
      </Sequence>

      {/* Component labels (spans float segments) */}
      <Sequence from={off.floatForward} durationInFrames={seg.floatForward + seg.floatReversed} premountFor={fps}>
        {components.map((component, i) => (
          <ComponentLabelOverlay
            key={component.name}
            component={component}
            delay={labelStartDelay + i * staggerFrames}
            accentColor={accentColor}
            fadeOut={{ start: labelFadeOutStart, end: labelFadeOutEnd }}
          />
        ))}
        {sfx?.labelPop && components.map((component, i) => (
          <Sequence key={`pop-${component.name}`} from={labelStartDelay + i * staggerFrames}>
            <Audio src={staticFile(sfx.labelPop!)} volume={0.15} />
          </Sequence>
        ))}
        <RunningTotal
          components={components}
          staggerFrames={staggerFrames}
          startDelay={labelStartDelay}
          accentColor={accentColor}
          metricUnit={metricUnit}
          fadeOut={{ start: labelFadeOutStart, end: labelFadeOutEnd }}
        />
      </Sequence>

      {/* Segment 4: Data Overlay */}
      <Sequence from={off.dataOverlay} durationInFrames={seg.dataOverlay} premountFor={fps}>
        <AbsoluteFill>
          <Img src={staticFile(freezeFrame)} style={videoStyle} />
        </AbsoluteFill>
        <DataOverlaySegment macros={macros} totalMetric={totalMetric} productName={productName} durationInFrames={seg.dataOverlay} accentColor={accentColor} />
        {sfx?.dataReveal && (
          <Sequence from={Math.round(1.5 * fps)}>
            <Audio src={staticFile(sfx.dataReveal)} volume={0.25} />
          </Sequence>
        )}
      </Sequence>

      {/* Segment 5: Assembly */}
      <Sequence from={off.assembly} durationInFrames={seg.assembly} premountFor={fps}>
        <AbsoluteFill>
          <OffthreadVideo src={staticFile(assemblyVideo)} style={videoStyle} />
        </AbsoluteFill>
        {sfx?.assemblyReverse && (
          <Audio src={staticFile(sfx.assemblyReverse)} volume={0.2} />
        )}
      </Sequence>

      {/* Segment 6: Outro */}
      <Sequence from={off.outro} durationInFrames={seg.outro} premountFor={fps}>
        <ProductOutro productName={productName} totalMetric={totalMetric} metricUnit={metricUnit} accentColor={accentColor} brandName={brandName} logoSrc={logoSrc} ctaText={ctaText} />
      </Sequence>

      {/* Global captions */}
      {captions.length > 0 && (
        <SubtitleTrack captions={captions} highlightColor={accentColor} variant="pill" bottomPadding={80} />
      )}
    </AbsoluteFill>
  );
};

// ==================== Duration Helper ====================

export function calculateProductDecodedDuration(
  timing: ProductDecodedProps['timing'],
  fps: number
): number {
  return Math.round(
    (timing.disassembly + timing.floatForward + timing.floatReversed + timing.dataOverlay + timing.assembly + timing.outro) * fps
  );
}

export const defaultProductDecodedTiming = {
  disassembly: 5,
  floatForward: 5,
  floatReversed: 5,
  dataOverlay: 5,
  assembly: 5,
  outro: 5,
};
