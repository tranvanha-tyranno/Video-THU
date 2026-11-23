import React, { useEffect, useMemo } from 'react';
import { useLoader, useThree } from '@react-three/fiber';
import { ThreeCanvas } from '@remotion/three';
import { AbsoluteFill, interpolate, spring, staticFile, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js';
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js';
import fontData from '../font.json';

export const W = 1920;
export const H = 1080;
export const FPS = 24;

export type Vec3 = [number, number, number];

export const PALETTE = {
  bgDeep: '#050912',
  bgMid: '#0d1a2d',
  bgAccent: '#142640',
  gold: '#e8b95c',
  cyan: '#3ce6c6',
  blue: '#4d96ff',
  coral: '#f06449',
  white: '#f4f7fb',
  silver: '#a8b8cf',
  slate: '#26344a',
} as const;

export const easeOutCubic = (t: number): number => 1 - Math.pow(1 - Math.max(0, Math.min(1, t)), 3);

export const easeInOutCubic = (t: number): number => {
  const c = Math.max(0, Math.min(1, t));
  return c < 0.5 ? 4 * c * c * c : 1 - Math.pow(-2 * c + 2, 3) / 2;
};

export const lerpVec3 = (a: Vec3, b: Vec3, t: number): Vec3 => [
  a[0] + (b[0] - a[0]) * t,
  a[1] + (b[1] - a[1]) * t,
  a[2] + (b[2] - a[2]) * t,
];

/**
 * Convert geographic latitude / longitude (degrees) to a 3D point on a sphere
 * matching Three.js SphereGeometry standard equirectangular UV mapping.
 */
export function latLonToVec3(lat: number, lon: number, radius = 2.6): THREE.Vector3 {
  const latRad = (lat * Math.PI) / 180;
  const lonRad = (lon * Math.PI) / 180;
  return new THREE.Vector3(
    radius * Math.cos(latRad) * Math.cos(lonRad),
    radius * Math.sin(latRad),
    -radius * Math.cos(latRad) * Math.sin(lonRad),
  );
}

export type HubId = 'shenzhen' | 'hanoi' | 'haiphong' | 'phuquoc';

export interface GeoHub {
  id: HubId;
  name: string;
  lat: number;
  lon: number;
  color: string;
}

export const APEC_HUBS: Record<HubId, GeoHub> = {
  shenzhen: { id: 'shenzhen', name: 'Thâm Quyến', lat: 22.54, lon: 114.06, color: PALETTE.gold },
  hanoi: { id: 'hanoi', name: 'Hà Nội', lat: 21.03, lon: 105.83, color: PALETTE.coral },
  haiphong: { id: 'haiphong', name: 'Hải Phòng', lat: 20.84, lon: 106.69, color: PALETTE.cyan },
  phuquoc: { id: 'phuquoc', name: 'Phú Quốc', lat: 10.29, lon: 103.98, color: PALETTE.cyan },
};

const parsedFont = new FontLoader().parse(fontData as unknown as Parameters<FontLoader['parse']>[0]);

/**
 * Suspense-backed texture loader for Remotion + R3F with sRGB color space.
 */
export function usePhotoTexture(src: string): THREE.Texture {
  const texture = useLoader(THREE.TextureLoader, staticFile(src));
  useMemo(() => {
    texture.colorSpace = THREE.SRGBColorSpace;
    texture.anisotropy = 8;
    texture.needsUpdate = true;
  }, [texture]);
  return texture;
}

/* -------------------------------------------------------------------------- */
/*  1. CinematicStage + Deterministic CameraRig + Starfield / Dust Particles  */
/* -------------------------------------------------------------------------- */

const CameraRig: React.FC<{
  camPos: Vec3;
  lookAt: Vec3;
  fov?: number;
}> = ({ camPos, lookAt, fov }) => {
  const { camera } = useThree();
  useMemo(() => {
    camera.position.set(camPos[0], camPos[1], camPos[2]);
    camera.lookAt(lookAt[0], lookAt[1], lookAt[2]);
    if (fov !== undefined && camera instanceof THREE.PerspectiveCamera && camera.fov !== fov) {
      camera.fov = fov;
    }
    camera.updateProjectionMatrix();
    camera.updateMatrixWorld();
  }, [camera, camPos[0], camPos[1], camPos[2], lookAt[0], lookAt[1], lookAt[2], fov]);
  return null;
};

const hashSeed = (n: number): number => {
  const s = Math.sin(n * 127.1 + 311.7) * 43758.5453123;
  return s - Math.floor(s);
};

const AmbientDust: React.FC<{
  count: number;
  color: string;
  spread: number;
}> = ({ count, color, spread }) => {
  const frame = useCurrentFrame();
  const geometry = useMemo(() => {
    const positions = new Float32Array(count * 3);
    for (let i = 0; i < count; i++) {
      positions[i * 3] = (hashSeed(i * 3 + 1) - 0.5) * spread * 2;
      positions[i * 3 + 1] = (hashSeed(i * 3 + 2) - 0.5) * spread * 1.3;
      positions[i * 3 + 2] = (hashSeed(i * 3 + 3) - 0.5) * spread * 2 - 2;
    }
    const geo = new THREE.BufferGeometry();
    geo.setAttribute('position', new THREE.BufferAttribute(positions, 3));
    return geo;
  }, [count, spread]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const rotY = frame * 0.00045;
  const driftY = Math.sin(frame * 0.012) * 0.18;

  return (
    <points geometry={geometry} rotation={[0, rotY, 0]} position={[0, driftY, 0]}>
      <pointsMaterial
        color={color}
        size={0.048}
        transparent
        opacity={0.42}
        sizeAttenuation
        depthWrite={false}
      />
    </points>
  );
};

export interface CinematicStageProps {
  children: React.ReactNode;
  camPos?: Vec3;
  lookAt?: Vec3;
  fov?: number;
  fogColor?: string;
  fogNear?: number;
  fogFar?: number;
  disableFog?: boolean;
  accentColor?: string;
  rimColor?: string;
  background?: string;
  showParticles?: boolean;
  particleCount?: number;
  particleColor?: string;
}

export const CinematicStage: React.FC<CinematicStageProps> = ({
  children,
  camPos = [0, 0.8, 12],
  lookAt = [0, 0, 0],
  fov = 36,
  fogColor = '#070e1a',
  fogNear = 16,
  fogFar = 52,
  disableFog = false,
  accentColor = PALETTE.cyan,
  rimColor = PALETTE.gold,
  background = 'radial-gradient(ellipse at 58% 42%, #152944 0%, #091322 55%, #04080f 100%)',
  showParticles = true,
  particleCount = 260,
  particleColor = '#b9d8ff',
}) => {
  return (
    <AbsoluteFill style={{ background }}>
      <ThreeCanvas
        width={W}
        height={H}
        camera={{ fov, near: 0.1, far: 140, position: camPos }}
        gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
        style={{ position: 'absolute', inset: 0 }}
      >
        <CameraRig camPos={camPos} lookAt={lookAt} fov={fov} />
        {!disableFog && <fog attach="fog" args={[fogColor, fogNear, fogFar]} />}

        {/* Rich 3-point + rim PBR lighting */}
        <ambientLight intensity={0.65} color="#dbe8ff" />
        <hemisphereLight args={['#9ec5ff', '#162033', 0.85]} />
        {/* Key light */}
        <directionalLight position={[6, 9, 10]} intensity={2.8} color="#fff6e8" />
        {/* Fill light */}
        <directionalLight position={[-9, 3, 6]} intensity={1.35} color={accentColor} />
        {/* Rim / back-edge highlights */}
        <pointLight position={[8, 4, -8]} intensity={42} distance={36} color={rimColor} />
        <pointLight position={[-8, -2, -6]} intensity={28} distance={32} color={PALETTE.blue} />

        {showParticles && <AmbientDust count={particleCount} color={particleColor} spread={22} />}
        {children}
      </ThreeCanvas>
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  2. PhotoFrame3D: Sleek Metallic Glass 3D Frame for Verified .webp Photos  */
/* -------------------------------------------------------------------------- */

export interface PhotoFrame3DProps {
  src: string;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number | Vec3;
  width?: number;
  height?: number;
  accentColor?: string;
  opacity?: number;
  floatAmplitude?: number;
  floatPhase?: number;
  glow?: boolean;
}

export const PhotoFrame3D: React.FC<PhotoFrame3DProps> = ({
  src,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  width = 4.8,
  height = 2.7,
  accentColor = PALETTE.gold,
  opacity = 1,
  floatAmplitude = 0.04,
  floatPhase = 0,
  glow = true,
}) => {
  const frame = useCurrentFrame();
  const texture = usePhotoTexture(src);

  const bobY = floatAmplitude > 0 ? Math.sin(frame * 0.045 + floatPhase) * floatAmplitude : 0;
  const border = 0.11;
  const depth = 0.14;
  const railThickness = 0.045;
  const railDepth = 0.06;

  return (
    <group
      position={[position[0], position[1] + bobY, position[2]]}
      rotation={rotation}
      scale={scale}
    >
      {/* Metallic backing chassis */}
      <mesh position={[0, 0, -depth * 0.5]}>
        <boxGeometry args={[width + border * 2, height + border * 2, depth]} />
        <meshPhysicalMaterial
          color="#131d2e"
          metalness={0.82}
          roughness={0.26}
          clearcoat={0.75}
          clearcoatRoughness={0.2}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Beveled outer metallic trim rails (top, bottom, left, right) */}
      <mesh position={[0, height * 0.5 + border * 0.55, railDepth * 0.5]}>
        <boxGeometry args={[width + border * 2.15, railThickness, railDepth]} />
        <meshPhysicalMaterial
          color={accentColor}
          metalness={0.88}
          roughness={0.22}
          clearcoat={1}
          emissive={accentColor}
          emissiveIntensity={0.18}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[0, -height * 0.5 - border * 0.55, railDepth * 0.5]}>
        <boxGeometry args={[width + border * 2.15, railThickness, railDepth]} />
        <meshPhysicalMaterial
          color={accentColor}
          metalness={0.88}
          roughness={0.22}
          clearcoat={1}
          emissive={accentColor}
          emissiveIntensity={0.18}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[-width * 0.5 - border * 0.55, 0, railDepth * 0.5]}>
        <boxGeometry args={[railThickness, height + border * 2.15, railDepth]} />
        <meshPhysicalMaterial
          color="#7e94b2"
          metalness={0.85}
          roughness={0.25}
          clearcoat={0.9}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>
      <mesh position={[width * 0.5 + border * 0.55, 0, railDepth * 0.5]}>
        <boxGeometry args={[railThickness, height + border * 2.15, railDepth]} />
        <meshPhysicalMaterial
          color="#7e94b2"
          metalness={0.85}
          roughness={0.25}
          clearcoat={0.9}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Photo plane */}
      <mesh position={[0, 0, 0.012]}>
        <planeGeometry args={[width, height]} />
        <meshBasicMaterial
          map={texture}
          toneMapped={false}
          transparent={opacity < 1}
          opacity={opacity}
        />
      </mesh>

      {/* Subtle glass reflection sheen */}
      <mesh position={[0, 0, 0.032]}>
        <planeGeometry args={[width, height]} />
        <meshPhysicalMaterial
          color="#d8ecff"
          transparent
          opacity={0.075 * opacity}
          roughness={0.06}
          metalness={0.15}
          clearcoat={1}
          clearcoatRoughness={0.05}
          depthWrite={false}
        />
      </mesh>

      {/* Soft rear halo plate for 3D depth separation */}
      {glow && (
        <mesh position={[0, 0, -depth - 0.04]}>
          <planeGeometry args={[width + 0.7, height + 0.7]} />
          <meshBasicMaterial
            color={accentColor}
            transparent
            opacity={0.09 * opacity}
            depthWrite={false}
          />
        </mesh>
      )}
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  3. ExtrudedLabel3D: Bold 3D Metallic Numbers / Years via TextGeometry     */
/* -------------------------------------------------------------------------- */

export interface ExtrudedLabel3DProps {
  text: string;
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
  size?: number;
  depth?: number;
  color?: string;
  emissive?: string;
  emissiveIntensity?: number;
  align?: 'center' | 'left' | 'right';
  revealFrame?: number;
  subtleFloat?: boolean;
}

export const ExtrudedLabel3D: React.FC<ExtrudedLabel3DProps> = ({
  text,
  position = [0, 0, 0],
  rotation = [0, 0, 0],
  scale = 1,
  size = 0.85,
  depth = 0.2,
  color = PALETTE.white,
  emissive = PALETTE.gold,
  emissiveIntensity = 0.16,
  align = 'center',
  revealFrame,
  subtleFloat = false,
}) => {
  const frame = useCurrentFrame();

  const geometry = useMemo(() => {
    const geo = new TextGeometry(text, {
      font: parsedFont,
      size,
      depth,
      curveSegments: 10,
      bevelEnabled: true,
      bevelSize: size * 0.022,
      bevelThickness: depth * 0.14,
      bevelSegments: 3,
    });
    geo.computeBoundingBox();
    if (geo.boundingBox) {
      const box = geo.boundingBox;
      const cx =
        align === 'center'
          ? -(box.min.x + box.max.x) * 0.5
          : align === 'right'
            ? -box.max.x
            : -box.min.x;
      const cy = -(box.min.y + box.max.y) * 0.5;
      const cz = -(box.min.z + box.max.z) * 0.5;
      geo.translate(cx, cy, cz);
    }
    return geo;
  }, [text, size, depth, align]);

  useEffect(() => {
    return () => {
      geometry.dispose();
    };
  }, [geometry]);

  const intro =
    revealFrame !== undefined
      ? spring({
          frame: Math.max(0, frame - revealFrame),
          fps: FPS,
          config: { damping: 18, stiffness: 110 },
        })
      : 1;

  const floatY = subtleFloat ? Math.sin(frame * 0.05) * 0.04 : 0;
  const finalScale = Math.max(0.0001, scale * intro);

  return (
    <group
      position={[position[0], position[1] + floatY, position[2] - (1 - intro) * 3.5]}
      rotation={rotation}
      scale={finalScale}
    >
      <mesh geometry={geometry}>
        <meshPhysicalMaterial
          color={color}
          metalness={0.72}
          roughness={0.2}
          clearcoat={1}
          clearcoatRoughness={0.12}
          emissive={emissive}
          emissiveIntensity={emissiveIntensity}
        />
      </mesh>
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  4. EarthGlobe3D: East/Southeast Asia Globe + 3D Arcs + Pulsing Beacons    */
/* -------------------------------------------------------------------------- */

interface GlobeArcSpec {
  from: HubId;
  to: HubId;
  color: string;
  lift: number;
  speed: number;
  phase: number;
  group: 'shenzhen-hanoi' | 'hanoi-phuquoc' | 'corridor';
}

const GLOBE_ARCS: GlobeArcSpec[] = [
  {
    from: 'shenzhen',
    to: 'hanoi',
    color: PALETTE.gold,
    lift: 0.52,
    speed: 0.013,
    phase: 0.0,
    group: 'shenzhen-hanoi',
  },
  {
    from: 'shenzhen',
    to: 'haiphong',
    color: PALETTE.cyan,
    lift: 0.46,
    speed: 0.011,
    phase: 0.35,
    group: 'shenzhen-hanoi',
  },
  {
    from: 'hanoi',
    to: 'haiphong',
    color: PALETTE.white,
    lift: 0.16,
    speed: 0.018,
    phase: 0.15,
    group: 'shenzhen-hanoi',
  },
  {
    from: 'hanoi',
    to: 'phuquoc',
    color: PALETTE.coral,
    lift: 0.62,
    speed: 0.012,
    phase: 0.5,
    group: 'hanoi-phuquoc',
  },
  {
    from: 'shenzhen',
    to: 'phuquoc',
    color: PALETTE.cyan,
    lift: 0.85,
    speed: 0.0095,
    phase: 0.72,
    group: 'corridor',
  },
];

const UP_AXIS = new THREE.Vector3(0, 0, 1);

const CityBeacon: React.FC<{
  hub: GeoHub;
  radius: number;
  highlighted: boolean;
  frame: number;
}> = ({ hub, radius, highlighted, frame }) => {
  const { surfacePos, quaternion } = useMemo(() => {
    const pos = latLonToVec3(hub.lat, hub.lon, radius + 0.014);
    const normal = pos.clone().normalize();
    const quat = new THREE.Quaternion().setFromUnitVectors(UP_AXIS, normal);
    return { surfacePos: pos, quaternion: quat };
  }, [hub.lat, hub.lon, radius]);

  const pulse = ((frame * 0.032 + hub.lat * 0.07) % 1);
  const ringScale = (highlighted ? 1.25 : 0.85) * (0.65 + pulse * 1.65);
  const ringOpacity = (1 - pulse) * (highlighted ? 0.9 : 0.5);
  const pinHeight = highlighted ? 0.24 : 0.14;

  return (
    <group position={surfacePos} quaternion={quaternion}>
      {/* Core glowing node */}
      <mesh>
        <sphereGeometry args={[highlighted ? 0.055 : 0.038, 14, 14]} />
        <meshBasicMaterial color={hub.color} />
      </mesh>
      {/* Vertical beacon spire along normal (+Z in local frame) */}
      <mesh position={[0, 0, pinHeight * 0.5]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.008, 0.022, pinHeight, 10]} />
        <meshBasicMaterial color={hub.color} transparent opacity={0.88} />
      </mesh>
      {/* Pulsing surface ring */}
      <mesh scale={[ringScale, ringScale, 1]}>
        <ringGeometry args={[0.06, 0.082, 28]} />
        <meshBasicMaterial
          color={hub.color}
          transparent
          opacity={ringOpacity}
          side={THREE.DoubleSide}
          depthWrite={false}
        />
      </mesh>
      {/* Secondary static halo ring */}
      <mesh>
        <ringGeometry args={[0.042, 0.055, 24]} />
        <meshBasicMaterial color="#ffffff" transparent opacity={0.7} side={THREE.DoubleSide} />
      </mesh>
    </group>
  );
};

export interface EarthGlobe3DProps {
  position?: Vec3;
  rotation?: Vec3;
  scale?: number;
  radius?: number;
  spinSpeed?: number;
  activeRoute?: 'all' | 'shenzhen-hanoi' | 'hanoi-phuquoc' | 'corridor';
  highlightHub?: HubId | 'all';
  showAtmosphere?: boolean;
  showRings?: boolean;
}

// Default rotation centers East / Southeast Asia (~18°N, 109°E) facing +Z camera
const ASIA_BASE_ROT_X = 0.31;
const ASIA_BASE_ROT_Y = -Math.PI / 2 - (109 * Math.PI) / 180;

export const EarthGlobe3D: React.FC<EarthGlobe3DProps> = ({
  position = [0, 0, 0],
  rotation,
  scale = 1,
  radius = 2.6,
  spinSpeed = 0.00055,
  activeRoute = 'all',
  highlightHub = 'all',
  showAtmosphere = true,
  showRings = true,
}) => {
  const frame = useCurrentFrame();
  const dayTex = usePhotoTexture('earth.jpg');
  const nightTex = usePhotoTexture('earth-night.jpg');

  const arcData = useMemo(() => {
    return GLOBE_ARCS.map((spec) => {
      const p = latLonToVec3(APEC_HUBS[spec.from].lat, APEC_HUBS[spec.from].lon, radius);
      const q = latLonToVec3(APEC_HUBS[spec.to].lat, APEC_HUBS[spec.to].lon, radius);
      const mid = p
        .clone()
        .add(q)
        .multiplyScalar(0.5)
        .normalize()
        .multiplyScalar(radius + spec.lift);
      const curve = new THREE.QuadraticBezierCurve3(p, mid, q);
      const tube = new THREE.TubeGeometry(curve, 56, 0.015, 8, false);
      return { spec, curve, tube };
    });
  }, [radius]);

  useEffect(() => {
    return () => {
      arcData.forEach((a) => a.tube.dispose());
    };
  }, [arcData]);

  const rotX = rotation ? rotation[0] : ASIA_BASE_ROT_X;
  const rotY = rotation ? rotation[1] : ASIA_BASE_ROT_Y + frame * spinSpeed;
  const rotZ = rotation ? rotation[2] : 0.04;

  const hubs = Object.values(APEC_HUBS);

  return (
    <group position={position} rotation={[rotX, rotY, rotZ]} scale={scale}>
      {/* Earth sphere */}
      <mesh>
        <sphereGeometry args={[radius, 80, 52]} />
        <meshStandardMaterial
          map={dayTex}
          emissiveMap={nightTex}
          emissive="#86beff"
          emissiveIntensity={0.55}
          roughness={0.86}
          metalness={0.05}
        />
      </mesh>

      {/* Atmospheric glow halo */}
      {showAtmosphere && (
        <>
          <mesh scale={1.024}>
            <sphereGeometry args={[radius, 56, 32]} />
            <meshBasicMaterial
              color="#438bff"
              transparent
              opacity={0.1}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
          <mesh scale={1.065}>
            <sphereGeometry args={[radius, 48, 24]} />
            <meshBasicMaterial
              color="#2b67d9"
              transparent
              opacity={0.055}
              side={THREE.BackSide}
              depthWrite={false}
            />
          </mesh>
        </>
      )}

      {/* Subtle orbital telemetry rings */}
      {showRings && (
        <group rotation={[Math.PI / 2 - 0.18, 0.12, frame * 0.001]}>
          <mesh>
            <torusGeometry args={[radius * 1.22, 0.006, 8, 120]} />
            <meshBasicMaterial color={PALETTE.cyan} transparent opacity={0.22} />
          </mesh>
          <mesh rotation={[0.42, 0.35, 0]}>
            <torusGeometry args={[radius * 1.34, 0.004, 8, 120]} />
            <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.16} />
          </mesh>
        </group>
      )}

      {/* 3D Lat/Lon TubeGeometry arcs + animated glowing packets */}
      {arcData.map(({ spec, curve, tube }, idx) => {
        const isActive = activeRoute === 'all' || spec.group === activeRoute;
        const opacity = isActive ? 0.85 : 0.22;
        const t1 = (frame * spec.speed + spec.phase) % 1;
        const t2 = (t1 + 0.5) % 1;
        const p1 = curve.getPoint(t1);
        const p2 = curve.getPoint(t2);

        return (
          <group key={idx}>
            <mesh geometry={tube}>
              <meshBasicMaterial color={spec.color} transparent opacity={opacity} />
            </mesh>
            {isActive && (
              <>
                <mesh position={p1}>
                  <sphereGeometry args={[0.044, 10, 10]} />
                  <meshBasicMaterial color="#ffffff" />
                </mesh>
                <mesh position={p1}>
                  <sphereGeometry args={[0.075, 10, 10]} />
                  <meshBasicMaterial color={spec.color} transparent opacity={0.45} />
                </mesh>
                <mesh position={p2}>
                  <sphereGeometry args={[0.032, 8, 8]} />
                  <meshBasicMaterial color={spec.color} />
                </mesh>
              </>
            )}
          </group>
        );
      })}

      {/* Pulsing 3D beacon rings at Shenzhen, Hanoi, Hai Phong, Phu Quoc */}
      {hubs.map((hub) => (
        <CityBeacon
          key={hub.id}
          hub={hub}
          radius={radius}
          highlighted={highlightHub === 'all' || highlightHub === hub.id}
          frame={frame}
        />
      ))}
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  5. FloatingHUD: Minimal Translucent Lower-Third Broadcast Overlay         */
/* -------------------------------------------------------------------------- */

export interface FloatingHUDProps {
  kicker?: string;
  caption?: string;
  subcaption?: string;
  credit?: string;
  accentColor?: string;
  progress?: number;
  fadeInFrames?: number;
}

export const FloatingHUD: React.FC<FloatingHUDProps> = ({
  kicker,
  caption,
  subcaption,
  credit,
  accentColor = PALETTE.gold,
  progress,
  fadeInFrames = 14,
}) => {
  const frame = useCurrentFrame();
  const enter = interpolate(frame, [0, fadeInFrames], [0, 1], {
    extrapolateLeft: 'clamp',
    extrapolateRight: 'clamp',
    easing: easeOutCubic,
  });
  const translateY = (1 - enter) * 18;

  return (
    <AbsoluteFill
      style={{
        pointerEvents: 'none',
        justifyContent: 'flex-end',
        fontFamily: '"Be Vietnam Pro", "Segoe UI", Arial, sans-serif',
      }}
    >
      {/* Soft bottom cinematic gradient scrim (no boxed cards, no header bar) */}
      <div
        style={{
          position: 'absolute',
          left: 0,
          right: 0,
          bottom: 0,
          height: 280,
          background:
            'linear-gradient(to top, rgba(4, 8, 16, 0.84) 0%, rgba(4, 8, 16, 0.42) 52%, rgba(4, 8, 16, 0) 100%)',
        }}
      />

      {/* Lower-third content */}
      <div
        style={{
          position: 'relative',
          display: 'flex',
          alignItems: 'flex-end',
          justifyContent: 'space-between',
          padding: '0 84px 54px 84px',
          opacity: enter,
          transform: `translateY(${translateY}px)`,
        }}
      >
        <div style={{ maxWidth: 1260 }}>
          {kicker && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 14,
                marginBottom: 10,
              }}
            >
              <span
                style={{
                  display: 'inline-block',
                  width: 34,
                  height: 3,
                  background: accentColor,
                  boxShadow: `0 0 12px ${accentColor}`,
                  borderRadius: 2,
                }}
              />
              <span
                style={{
                  fontSize: 18,
                  fontWeight: 700,
                  letterSpacing: '0.16em',
                  textTransform: 'uppercase',
                  color: accentColor,
                  textShadow: '0 2px 10px rgba(0,0,0,0.85)',
                }}
              >
                {kicker}
              </span>
            </div>
          )}

          {caption && (
            <div
              style={{
                fontSize: 38,
                fontWeight: 700,
                lineHeight: 1.24,
                color: PALETTE.white,
                textShadow: '0 3px 18px rgba(0,0,0,0.92)',
              }}
            >
              {caption}
            </div>
          )}

          {subcaption && (
            <div
              style={{
                marginTop: 8,
                fontSize: 22,
                fontWeight: 400,
                lineHeight: 1.35,
                color: PALETTE.silver,
                textShadow: '0 2px 12px rgba(0,0,0,0.9)',
              }}
            >
              {subcaption}
            </div>
          )}
        </div>

        {/* Minimal translucent photo credit */}
        {credit && (
          <div
            style={{
              marginLeft: 32,
              fontSize: 15,
              fontWeight: 500,
              letterSpacing: '0.03em',
              color: 'rgba(214, 226, 242, 0.72)',
              textAlign: 'right',
              whiteSpace: 'nowrap',
              textShadow: '0 2px 8px rgba(0,0,0,0.9)',
            }}
          >
            {credit}
          </div>
        )}
      </div>

      {/* Optional ultra-thin bottom progress hairline */}
      {progress !== undefined && (
        <div
          style={{
            position: 'absolute',
            left: 0,
            right: 0,
            bottom: 0,
            height: 3,
            background: 'rgba(255,255,255,0.08)',
          }}
        >
          <div
            style={{
              width: `${Math.max(0, Math.min(1, progress)) * 100}%`,
              height: '100%',
              background: `linear-gradient(90deg, ${PALETTE.cyan}, ${accentColor})`,
            }}
          />
        </div>
      )}
    </AbsoluteFill>
  );
};
