import type {ReactNode} from 'react';
import {Img, staticFile} from 'remotion';

export type Point = [number, number];
export type Shot = {id: string; title: string; start: number; frames: number; cues: number[]};
export type MapIndex = {regional: Record<string, Point>; gba: Record<string, Point>};
export type Props = {shots: Shot[]; maps: MapIndex};

// Disciplined multi-hue editorial palette (deep jade-teal night + warm ivory archival + crimson/gold/mint accents)
export const palette = {
  bgDark: '#102024',
  bgDarkMid: '#193136',
  bgPanel: '#16292d',
  bgPanelSoft: '#1f363a',
  bgLight: '#f2ead9',
  bgLightCard: '#fbf7ee',
  ink: '#162528',
  inkMuted: '#536264',
  cream: '#f5efe1',
  muted: '#a9b8b4',
  gold: '#e7b85d',
  vermilion: '#d65138',
  mint: '#58c9b9',
  sky: '#7ab8d9',
  borderDark: '#2f4c50',
  borderLight: '#cfc2a8',
} as const;

export const clamp = (x: number) => Math.min(1, Math.max(0, x));
export const easeOutCubic = (x: number) => {
  const t = clamp(x);
  return 1 - Math.pow(1 - t, 3);
};
export const easeInOutCubic = (x: number) => {
  const t = clamp(x);
  return t < 0.5 ? 4 * t * t * t : 1 - Math.pow(-2 * t + 2, 3) / 2;
};
export const easeOutBack = (x: number) => {
  const t = clamp(x);
  const c1 = 1.45;
  const c3 = c1 + 1;
  return 1 + c3 * Math.pow(t - 1, 3) + c1 * Math.pow(t - 1, 2);
};
export const stagger = (progress: number, index: number, step = 0.09, span = 0.35) =>
  easeOutCubic((progress - index * step) / span);

export const photoCredits: Record<string, string> = {
  shenzhen_skyline: 'Sparktour · CC BY-SA 4.0',
  shenzhen_civic: 'Sparktour · CC BY-SA 4.0',
  shenzhen_bay: 'Windmemories · CC BY-SA 4.0',
  yantian_port: 'Niels Johannes · CC BY-SA 4.0',
  beijing_hall: 'N509FZ · CC BY-SA 4.0',
  hanoi_palace: 'Gary Todd · CC0 1.0',
  apec_2017: 'Presidency of the Mexican Republic · CC BY 2.0',
  haiphong_port: 'Nathan.cima · CC BY-SA 4.0',
  kunming_skyline: 'Hermann Luyken · CC0 1.0',
  laocai_hekou: 'Vmenkov · CC BY-SA 3.0',
  vn_cn_train: 'Changzhensky · CC BY-SA 4.0',
  phu_quoc_aerial: 'Quangpraha · CC0 1.0',
  phu_quoc_sunset: 'Vivu Vietnam · CC BY-SA 4.0',
};

export function T({
  x,
  y,
  size = 20,
  color = palette.cream,
  anchor = 'start',
  weight = 700,
  opacity = 1,
  children,
}: {
  x: number;
  y: number;
  size?: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  opacity?: number;
  children: ReactNode;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={color}
      fontWeight={weight}
      textAnchor={anchor}
      opacity={opacity}
      style={{letterSpacing: 0}}
    >
      {children}
    </text>
  );
}

export function WrappedText({
  x,
  y,
  lines,
  size = 18,
  lineHeight = 26,
  color = palette.cream,
  weight = 600,
  anchor = 'start',
  opacity = 1,
}: {
  x: number;
  y: number;
  lines: string[];
  size?: number;
  lineHeight?: number;
  color?: string;
  weight?: number;
  anchor?: 'start' | 'middle' | 'end';
  opacity?: number;
}) {
  return (
    <g opacity={opacity}>
      {lines.map((line, i) => (
        <T key={i} x={x} y={y + i * lineHeight} size={size} color={color} weight={weight} anchor={anchor}>
          {line}
        </T>
      ))}
    </g>
  );
}

export function PhotoFrame({
  name,
  x = 0,
  y = 0,
  w = 1280,
  h = 720,
  p = 0,
  focus = 'center',
  zoom = 0.08,
  panX = 0,
  radius = 0,
  credit = true,
  caption,
}: {
  name: string;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  p?: number;
  focus?: string;
  zoom?: number;
  panX?: number;
  radius?: number;
  credit?: boolean;
  caption?: string;
}) {
  const scale = 1 + zoom * easeInOutCubic(p);
  const tx = panX * (easeInOutCubic(p) - 0.5);
  return (
    <foreignObject x={x} y={y} width={w} height={h}>
      <div
        style={{
          position: 'relative',
          width: '100%',
          height: '100%',
          overflow: 'hidden',
          borderRadius: radius,
          background: '#0e1b1e',
        }}
      >
        <Img
          src={staticFile(`${name}.webp`)}
          style={{
            width: '100%',
            height: '100%',
            objectFit: 'cover',
            objectPosition: focus,
            transform: `scale(${scale}) translateX(${tx}px)`,
          }}
        />
        {caption && (
          <div
            style={{
              position: 'absolute',
              left: 12,
              bottom: 10,
              fontSize: 13,
              fontWeight: 700,
              padding: '5px 10px',
              color: palette.cream,
              background: 'rgba(16, 32, 36, 0.88)',
              borderRadius: 4,
              borderLeft: `3px solid ${palette.gold}`,
              fontFamily: '"Economy Be Vietnam Pro", sans-serif',
            }}
          >
            {caption}
          </div>
        )}
        {credit && (
          <div
            style={{
              position: 'absolute',
              right: 12,
              bottom: 10,
              fontSize: 11,
              fontWeight: 600,
              padding: '4px 8px',
              color: '#dfe7e2',
              background: 'rgba(14, 27, 30, 0.84)',
              borderRadius: 4,
              fontFamily: '"Economy Be Vietnam Pro", sans-serif',
            }}
          >
            Ảnh · {photoCredits[name]}
          </div>
        )}
      </div>
    </foreignObject>
  );
}

export function Callout({
  x,
  y,
  to,
  label,
  sub,
  color = palette.gold,
  align = 'start',
}: {
  x: number;
  y: number;
  to: Point;
  label: string;
  sub?: string;
  color?: string;
  align?: 'start' | 'end';
}) {
  const elbowX = align === 'start' ? x + 28 : x - 28;
  return (
    <g>
      <path d={`M${x} ${y + 8}L${elbowX} ${y + 8}L${to[0]} ${to[1]}`} fill="none" stroke={color} strokeWidth="1.8" />
      <circle cx={to[0]} cy={to[1]} r="4.5" fill={color} />
      <circle cx={to[0]} cy={to[1]} r="9" fill="none" stroke={color} strokeWidth="1.2" opacity="0.55" />
      <T x={x} y={y} size={16} color={color} anchor={align} weight={800}>
        {label}
      </T>
      {sub && (
        <T x={x} y={y + 24} size={13} color={palette.muted} anchor={align} weight={600}>
          {sub}
        </T>
      )}
    </g>
  );
}

export function KineticTitle({
  title,
  kicker,
  p,
  light = false,
  x = 64,
  y = 122,
}: {
  title: string;
  kicker: string;
  p: number;
  light?: boolean;
  x?: number;
  y?: number;
}) {
  const lineGrow = easeOutCubic(p * 3.2);
  const titleIn = easeOutCubic((p - 0.04) * 3.0);
  const accent = light ? palette.vermilion : palette.gold;
  const textCol = light ? palette.ink : palette.cream;
  const kickCol = light ? palette.inkMuted : palette.muted;
  return (
    <g>
      <rect x={x} y={y - 58} width={34 * lineGrow} height={4} rx={2} fill={accent} />
      <T x={x + 44} y={y - 51} size={13} color={kickCol} weight={800} opacity={easeOutCubic(p * 4)}>
        {kicker}
      </T>
      <g transform={`translate(0 ${(1 - titleIn) * 14})`} opacity={titleIn}>
        <T x={x} y={y} size={36} color={textCol} weight={800}>
          {title}
        </T>
      </g>
    </g>
  );
}

export function Stage({
  title,
  kicker,
  note,
  p = 1,
  light = false,
  progressRatio,
  children,
}: {
  title: string;
  kicker: string;
  note?: string;
  p?: number;
  light?: boolean;
  progressRatio?: number;
  children: ReactNode;
}) {
  return (
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{fontFamily: '"Economy Be Vietnam Pro", sans-serif'}}>
      <defs>
        <radialGradient id="apec-dark-bg" cx="62%" cy="44%" r="84%">
          <stop stopColor="#1f383d" />
          <stop offset="1" stopColor="#0f1e22" />
        </radialGradient>
        <linearGradient id="apec-photo-scrim" x2="0%" y2="100%">
          <stop stopColor="#0b181b" stopOpacity="0.90" />
          <stop offset="0.30" stopColor="#0b181b" stopOpacity="0.08" />
          <stop offset="0.68" stopColor="#0b181b" stopOpacity="0.10" />
          <stop offset="1" stopColor="#0b181b" stopOpacity="0.92" />
        </linearGradient>
        <pattern id="apec-grid" width="36" height="36" patternUnits="userSpaceOnUse">
          <path
            d="M0 36V0H36"
            fill="none"
            stroke={light ? '#bda98a' : '#7a9e9a'}
            opacity={light ? '0.18' : '0.12'}
            strokeWidth="0.7"
          />
        </pattern>
        <clipPath id="map-viewport">
          <rect x="64" y="152" width="820" height="466" rx="8" />
        </clipPath>
        <clipPath id="map-wide">
          <rect x="64" y="152" width="1152" height="466" rx="8" />
        </clipPath>
      </defs>
      <rect width="1280" height="720" fill={light ? palette.bgLight : 'url(#apec-dark-bg)'} />
      <rect x="32" y="28" width="1216" height="664" fill="url(#apec-grid)" />
      {children}
      <KineticTitle title={title} kicker={kicker} p={p} light={light} />
      {note && (
        <g>
          <path
            d="M64 644h1152"
            stroke={light ? palette.borderLight : palette.borderDark}
            strokeWidth="1.2"
          />
          <T x={64} y={674} size={16} color={light ? palette.inkMuted : palette.gold} weight={700}>
            {note}
          </T>
        </g>
      )}
      {typeof progressRatio === 'number' && (
        <g>
          <rect x="64" y="700" width="1152" height="4" rx="2" fill={light ? '#dcd2bc' : '#1d3539'} />
          <rect
            x="64"
            y="700"
            width={1152 * clamp(progressRatio)}
            height="4"
            rx="2"
            fill={light ? palette.vermilion : palette.mint}
          />
        </g>
      )}
    </svg>
  );
}
