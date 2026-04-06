import { Composition, Folder } from 'remotion';
import { VoiceoverReel, VoiceoverReelProps, calculateVoiceoverReelDuration } from './compositions/VoiceoverReel';
import { AnimatedInfographic, AnimatedInfographicProps } from './compositions/AnimatedInfographic';
import { UGCReel, UGCReelProps, calculateUGCReelDuration } from './compositions/UGCReel';
import { ProductDecoded, ProductDecodedProps, calculateProductDecodedDuration } from './compositions/ProductDecoded';
import { ProductComparison, ProductComparisonProps, calculateProductComparisonDuration } from './compositions/ProductComparison';

const FPS = 30;

export const RemotionRoot = () => {
  return (
    <Folder name="ContentFactory">
      <Composition
        id="VoiceoverReel"
        component={VoiceoverReel}
        durationInFrames={600}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          segments: [],
          audioUrl: '',
          captions: [],
          brand: { name: 'Brand', primaryColor: '#3B82F6' },
        } satisfies VoiceoverReelProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: calculateVoiceoverReelDuration(props, FPS),
        })}
      />

      <Composition
        id="AnimatedInfographic"
        component={AnimatedInfographic}
        durationInFrames={600}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          segments: [],
          audioUrl: '',
          captions: [],
          brand: { primaryColor: '#3B82F6', backgroundColor: '#FFFFFF', textColor: '#1F2937' },
        } satisfies AnimatedInfographicProps}
      />

      <Composition
        id="UGCReel"
        component={UGCReel}
        durationInFrames={1200}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          scenes: [],
          audioUrl: '',
          captions: [],
          outroDuration: 5,
          brand: { name: 'Brand', primaryColor: '#3B82F6', logoUrl: '' },
        } satisfies UGCReelProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: calculateUGCReelDuration(props, FPS),
        })}
      />

      <Composition
        id="ProductDecoded"
        component={ProductDecoded}
        durationInFrames={900}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          productName: 'Product',
          components: [],
          videos: { disassembly: '', floatForward: '', floatReversed: '', assembly: '' },
          freezeFrame: '',
          audioUrl: '',
          captions: [],
          timing: { disassembly: 5, float: 5, dataOverlay: 5, assembly: 5, outro: 5 },
          brand: { name: 'Brand', primaryColor: '#3B82F6' },
        } satisfies ProductDecodedProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: calculateProductDecodedDuration(props.timing, FPS),
        })}
      />

      <Composition
        id="ProductComparison"
        component={ProductComparison}
        durationInFrames={600}
        fps={FPS}
        width={1080}
        height={1920}
        defaultProps={{
          items: [],
          musicUrl: '',
          brand: { name: 'Brand', primaryColor: '#3B82F6' },
        } satisfies ProductComparisonProps}
        calculateMetadata={async ({ props }) => ({
          durationInFrames: calculateProductComparisonDuration(props.items.length, FPS),
        })}
      />
    </Folder>
  );
};
