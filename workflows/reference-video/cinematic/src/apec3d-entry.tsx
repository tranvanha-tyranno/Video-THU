import React from 'react';
import {
  AbsoluteFill,
  Composition,
  Sequence,
  interpolate,
  registerRoot,
  useCurrentFrame,
} from 'remotion';
import './economy-story/fonts.css';
import {
  DiplomacyConstellation3D,
  GlobeCorridorScene3D,
  PhotoGalleryFlythrough3D,
  RailViaduct3D,
  SmartBorder3D,
  TradeMonuments3D,
  type MapIndexData,
  type Scene3DCtx,
  type ShotData,
} from './apec3d/Scenes3D';
import { FPS, H, PALETTE, W, easeInOutCubic } from './apec3d/World3D';

const TOTAL_FRAMES = 14400;
const XFADE_FRAMES = 12;

interface Apec3DProps {
  shots: ShotData[];
  maps: MapIndexData;
}

const SCENE_REGISTRY: Record<string, React.FC<Scene3DCtx>> = {
  // PhotoGalleryFlythrough3D (9 shots)
  hook: PhotoGalleryFlythrough3D,
  shenzhen: PhotoGalleryFlythrough3D,
  summit: PhotoGalleryFlythrough3D,
  people: PhotoGalleryFlythrough3D,
  exports_vn: PhotoGalleryFlythrough3D,
  gba_link: PhotoGalleryFlythrough3D,
  port_hai_phong: PhotoGalleryFlythrough3D,
  border_photo: PhotoGalleryFlythrough3D,
  cta: PhotoGalleryFlythrough3D,

  // GlobeCorridorScene3D (2 shots)
  map_bridge: GlobeCorridorScene3D,
  recap: GlobeCorridorScene3D,

  // TradeMonuments3D (3 shots)
  trade_surge: TradeMonuments3D,
  trade_gap: TradeMonuments3D,
  supply_chain: TradeMonuments3D,

  // RailViaduct3D (4 shots)
  rail_bottleneck: RailViaduct3D,
  rail_map: RailViaduct3D,
  rail_specs: RailViaduct3D,
  rail_network: RailViaduct3D,

  // SmartBorder3D (1 shot)
  smart_border: SmartBorder3D,

  // DiplomacyConstellation3D (5 shots)
  scope: DiplomacyConstellation3D,
  handover: DiplomacyConstellation3D,
  phu_quoc_map: DiplomacyConstellation3D,
  multilateral: DiplomacyConstellation3D,
  challenges: DiplomacyConstellation3D,
};

const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));

const ShotTransitionWrapper: React.FC<{
  shot: ShotData;
  index: number;
  totalShots: number;
  maps: MapIndexData;
}> = ({ shot, index, totalShots, maps }) => {
  const localFrame = useCurrentFrame();
  const clampedFrame = Math.min(localFrame, Math.max(0, shot.frames - 1));

  let beat = 0;
  for (let i = 0; i < shot.cues.length; i++) {
    if (clampedFrame >= shot.cues[i]) {
      beat = i;
    }
  }
  const beatStart = shot.cues[beat] ?? 0;
  const beatEnd = shot.cues[beat + 1] ?? shot.frames;
  const p = clamp01(clampedFrame / Math.max(1, shot.frames - 1));
  const q = clamp01((clampedFrame - beatStart) / Math.max(1, beatEnd - beatStart - 1));

  const isFirst = index === 0;
  const isLast = index === totalShots - 1;

  // Smooth cinematic crossfade & subtle zoom-dissolve at shot boundaries
  const enterOpacity = isFirst
    ? interpolate(localFrame, [0, 14], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easeInOutCubic,
      })
    : interpolate(localFrame, [0, XFADE_FRAMES], [0, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easeInOutCubic,
      });

  const exitOpacity = isLast
    ? interpolate(localFrame, [shot.frames - 18, shot.frames], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easeInOutCubic,
      })
    : interpolate(localFrame, [shot.frames, shot.frames + XFADE_FRAMES], [1, 0], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easeInOutCubic,
      });

  const enterScale = isFirst
    ? 1
    : interpolate(localFrame, [0, XFADE_FRAMES], [1.03, 1], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easeInOutCubic,
      });

  const exitScale = isLast
    ? 1
    : interpolate(localFrame, [shot.frames, shot.frames + XFADE_FRAMES], [1, 1.025], {
        extrapolateLeft: 'clamp',
        extrapolateRight: 'clamp',
        easing: easeInOutCubic,
      });

  const SceneComp = SCENE_REGISTRY[shot.id] ?? PhotoGalleryFlythrough3D;

  return (
    <AbsoluteFill
      style={{
        opacity: enterOpacity * exitOpacity,
        transform: `scale(${enterScale * exitScale})`,
        transformOrigin: '50% 50%',
      }}
    >
      <SceneComp
        shot={shot}
        beat={beat}
        p={p}
        q={q}
        localFrame={clampedFrame}
        maps={maps}
      />
    </AbsoluteFill>
  );
};

const Apec3DCinematicComp: React.FC<Apec3DProps> = ({ shots, maps }) => {
  return (
    <AbsoluteFill style={{ backgroundColor: PALETTE.bgDeep }}>
      {shots.map((shot, idx) => {
        const isLast = idx === shots.length - 1;
        const duration = isLast
          ? Math.max(1, Math.min(TOTAL_FRAMES - shot.start, shot.frames))
          : Math.max(1, Math.min(TOTAL_FRAMES - shot.start, shot.frames + XFADE_FRAMES));

        return (
          <Sequence
            key={shot.id}
            from={shot.start}
            durationInFrames={duration}
          >
            <ShotTransitionWrapper
              shot={shot}
              index={idx}
              totalShots={shots.length}
              maps={maps}
            />
          </Sequence>
        );
      })}
    </AbsoluteFill>
  );
};

const DEFAULT_SHOTS: ShotData[] = [
  { id: 'hook', title: 'APEC 2026', start: 0, frames: TOTAL_FRAMES, cues: [0, 4800, 9600] },
];

const DEFAULT_MAPS: MapIndexData = {
  region: {
    shenzhen: [562.97, 121.4],
    hanoi: [283.36, 176.88],
    haiphong: [312.4, 183.54],
    danang: [363.87, 355.31],
    phuquoc: [220.46, 556.69],
  },
  rail: {
    laocai: [135.71, 98.5],
    phutho: [350.81, 316.96],
    hanoi: [460.99, 372.3],
    bacninh: [502.43, 342.61],
    hungyen: [498.94, 443.72],
    haiphong: [610.42, 406.57],
    lachhuyen: [648.37, 412.17],
  },
  phuquoc: {
    duongdong: [407.45, 384.71],
    airport: [454.0, 457.19],
    anthoi: [479.95, 670.46],
  },
};

const Root: React.FC = () => {
  return (
    <Composition
      id="Apec3DCinematic"
      component={Apec3DCinematicComp as unknown as React.FC<Record<string, unknown>>}
      durationInFrames={TOTAL_FRAMES}
      fps={FPS}
      width={W}
      height={H}
      defaultProps={{ shots: DEFAULT_SHOTS, maps: DEFAULT_MAPS }}
    />
  );
};

registerRoot(Root);
