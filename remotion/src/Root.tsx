import React from 'react';
import { Composition, Folder } from 'remotion';
import { VoiceoverReel, VoiceoverReelProps } from './compositions/VoiceoverReel';
import {
  AnimatedInfographic,
  AnimatedInfographicProps,
  InfographicSegment,
} from './compositions/AnimatedInfographic';
import { UGCReel, UGCReelProps, calculateUGCDuration } from './compositions/UGCReel';
import {
  ProductDecoded,
  ProductDecodedProps,
  calculateProductDecodedDuration,
  defaultProductDecodedTiming,
} from './compositions/ProductDecoded';
import {
  ProductComparison,
  ProductComparisonProps,
  calculateProductComparisonDuration,
} from './compositions/ProductComparison';

const FPS = 30;
const REEL_DURATION_FRAMES = 600; // 20s at 30fps
const DEFAULT_UGC_DURATION_FRAMES = 1200; // 40s at 30fps

// ==================== Default Props ====================

const defaultVoiceoverReelProps: VoiceoverReelProps = {
  script: 'That caesar salad might have more calories than a burger.',
  audioUrl: '',
  captions: [],
  backgroundImages: [],
  audioDurationMs: 0,
  brand: {
    name: 'Your Brand',
    color: '#10B981',
    tagline: 'Know more. Choose better.',
    ctaText: 'Follow for More',
  },
};

const defaultInfographicSegments: InfographicSegment[] = [
  {
    type: 'stat',
    durationFrames: 150,
    data: { value: 70, suffix: '%', label: 'of products contain hidden sugars' },
  },
  {
    type: 'list',
    durationFrames: 200,
    data: {
      title: 'What to look for',
      items: [
        { icon: '✓', text: 'Check the label' },
        { icon: '✓', text: 'Compare per serving' },
        { icon: '✓', text: 'Watch for aliases' },
      ],
    },
  },
  {
    type: 'text',
    durationFrames: 100,
    data: { text: 'Follow for more tips', style: 'pop', size: 'hero' },
  },
];

const defaultInfographicProps: AnimatedInfographicProps = {
  segments: defaultInfographicSegments,
  audioUrl: '',
  captions: [],
  accentColor: '#10B981',
  brandName: 'Your Brand',
  tagline: 'Know more. Choose better.',
  ctaText: 'Follow for More',
};

const defaultUGCReelProps: UGCReelProps = {
  backgroundVideos: ['ugc/ugc-scene-0.mp4', 'ugc/ugc-scene-1.mp4', 'ugc/ugc-scene-2.mp4'],
  videoDurations: [8, 8, 8],
  hasNativeAudio: true,
  brandName: 'Your Brand',
  brandColor: '#10B981',
  ctaText: 'Follow for More',
  ctaSubtext: 'Link in bio',
  outroDuration: 5,
  showWatermark: true,
  transitionDuration: 0.4,
};

const defaultProductDecodedProps: ProductDecodedProps = {
  productName: 'Example Product',
  totalMetric: 1035,
  metricUnit: 'cal',
  macros: { a: 52, aLabel: 'Protein', b: 98, bLabel: 'Carbs', c: 38, cLabel: 'Fat' },
  disassemblyVideo: 'product-decoded/shot1-disassembly.mp4',
  holdVideo: 'product-decoded/shot2-hold.mp4',
  holdReversedVideo: 'product-decoded/shot2-hold-reversed.mp4',
  assemblyVideo: 'product-decoded/shot1-assembly.mp4',
  freezeFrame: 'product-decoded/freeze-frame.png',
  components: [
    { name: 'Component A', metricValue: 230, metricUnit: 'cal', x: 30, y: 30, anchor: 'left' },
    { name: 'Component B', metricValue: 180, metricUnit: 'cal', x: 70, y: 25, anchor: 'right' },
    { name: 'Component C', metricValue: 240, metricUnit: 'cal', x: 48, y: 42, anchor: 'right' },
  ],
  audioUrl: '',
  captions: [],
  accentColor: '#10B981',
  brandName: 'Your Brand',
  ctaText: 'Learn more',
  timing: defaultProductDecodedTiming,
};

const defaultProductComparisonProps: ProductComparisonProps = {
  seriesName: 'Hidden Metrics',
  hookPhrase: "Do you know what's really in your order?",
  metricUnit: 'cal',
  items: [
    { name: 'Option A', metricValue: 240, videoSrc: 'product-comparison/video-1.mp4' },
    { name: 'Option B', metricValue: 470, videoSrc: 'product-comparison/video-2.mp4' },
  ],
  accentColor: '#10B981',
  brandName: 'Your Brand',
  tagline: 'Know before you order.',
  ctaText: 'Follow for More',
};

// ==================== Root ====================

export const RemotionRoot: React.FC = () => {
  return (
    <Folder name="ContentFactory">
      {/* Voiceover reel: background video/images + AI voiceover + animated captions */}
      <Composition
        id="VoiceoverReel"
        component={VoiceoverReel}
        durationInFrames={REEL_DURATION_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultVoiceoverReelProps satisfies VoiceoverReelProps}
      />

      {/* Animated infographic: data-driven segments (stat / list / text / bars / comparison) */}
      <Composition
        id="AnimatedInfographic"
        component={AnimatedInfographic}
        durationInFrames={REEL_DURATION_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultInfographicProps satisfies AnimatedInfographicProps}
      />

      {/* UGC reel: multi-scene avatar video + crossfade + branded outro */}
      <Composition
        id="UGCReel"
        component={UGCReel}
        durationInFrames={DEFAULT_UGC_DURATION_FRAMES}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultUGCReelProps satisfies UGCReelProps}
        calculateMetadata={async ({ props }) => {
          const { totalFrames } = calculateUGCDuration(props.videoDurations, props.outroDuration);
          return { durationInFrames: totalFrames };
        }}
      />

      {/* Product decoded: disassembly + component labels + data overlay + assembly */}
      <Composition
        id="ProductDecoded"
        component={ProductDecoded}
        durationInFrames={calculateProductDecodedDuration(defaultProductDecodedProps.timing, FPS)}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultProductDecodedProps satisfies ProductDecodedProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: calculateProductDecodedDuration(props.timing, FPS),
        })}
      />

      {/* Product comparison: whip-pan orbit between products with metric reveal */}
      <Composition
        id="ProductComparison"
        component={ProductComparison}
        durationInFrames={calculateProductComparisonDuration(
          defaultProductComparisonProps.items.length
        )}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={defaultProductComparisonProps satisfies ProductComparisonProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: calculateProductComparisonDuration(
            props.items.length,
            FPS,
            props.timing
          ),
        })}
      />
    </Folder>
  );
};
