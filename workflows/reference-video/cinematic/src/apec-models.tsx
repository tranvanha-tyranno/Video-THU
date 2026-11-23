import type {ReactNode} from 'react';
import {staticFile} from 'remotion';

export type Point = [number, number];

// Locked Editorial Documentary Motion Palette (motion-art-direction)
export const navy = '#0f1c29';
export const panel = '#182a3b';
export const panelLight = '#f4efe3';
export const cream = '#f5f0e4';
export const ink = '#172533';
export const gold = '#e3b04b';
export const crimson = '#d65a47';
export const teal = '#2ea396';
export const sky = '#5aa7d6';
export const muted = '#9eb2c4';
export const borderCol = '#355068';

// Deterministic Easing Vocabulary (animation-principles)
export const clamp01 = (t: number) => Math.max(0, Math.min(1, t));
export const easeOutExpo = (t: number) => {
  const x = clamp01(t);
  return x === 1 ? 1 : 1 - Math.pow(2, -10 * x);
};
export const easeOutCubic = (t: number) => {
  const x = clamp01(t);
  return 1 - Math.pow(1 - x, 3);
};
export const easeInOutCubic = (t: number) => {
  const x = clamp01(t);
  return x < 0.5 ? 4 * x * x * x : 1 - Math.pow(-2 * x + 2, 3) / 2;
};
export const stagger = (progress: number, index: number, step = 0.12, span = 0.42) =>
  easeOutExpo((progress - index * step) / span);

// Verified Wikimedia Commons Photo Credits
export const photoCredits: Record<string, string> = {
  apec2026: 'PCO Philippines · Public domain · APEC 2026',
  shenzhen: 'Sparktour · CC BY-SA 4.0 · Thâm Quyến',
  civic: 'Sparktour · CC BY-SA 4.0 · Trung tâm Thâm Quyến',
  gba: 'Charlie fong · CC BY-SA 4.0 · Vịnh Thâm Quyến',
  hanoi: 'NKSTTSSHNVN · CC BY-SA 4.0 · Hà Nội',
  palace: 'RB Photo · CC BY 4.0 · Phủ Chủ tịch, Hà Nội',
  greathall: 'N509FZ · CC BY-SA 4.0 · Đại lễ đường Nhân dân',
  haiphong: 'Nathan.cima · CC BY-SA 4.0 · Cảng quốc tế Hải Phòng',
  border: 'TSVC1190 · CC BY-SA 4.0 · Hữu Nghị Quan',
  laocai: 'Vmenkov · CC BY-SA 3.0 · Cầu biên giới Lào Cai – Hà Khẩu',
  train: 'N509FZ · CC BY-SA 4.0 · Tàu khổ chuẩn 1.435 mm',
  durian: 'Kembangraps · CC0 · Nông sản sầu riêng',
  phuquoc: 'Vivu Vietnam · CC BY-SA 4.0 · Đảo Phú Quốc',
  pqairport: 'FrogsLegs71 · CC BY-SA 3.0 · Sân bay quốc tế Phú Quốc',
};

// Typography helper with tabular-nums support
export function T({
  x,
  y,
  size,
  color = cream,
  anchor = 'start',
  weight = 700,
  opacity = 1,
  children,
}: {
  x: number;
  y: number;
  size: number;
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
      fill={color}
      fontSize={size}
      fontWeight={weight}
      textAnchor={anchor}
      opacity={opacity}
      style={{fontVariantNumeric: 'tabular-nums'}}
    >
      {children}
    </text>
  );
}

// Kinetic Typography: Baseline Mask Reveal (kinetic-typography skill)
export function MaskLine({
  id,
  x,
  y,
  size,
  progress,
  color = cream,
  anchor = 'start',
  weight = 800,
  width = 1160,
  children,
}: {
  id: string;
  x: number;
  y: number;
  size: number;
  progress: number;
  color?: string;
  anchor?: 'start' | 'middle' | 'end';
  weight?: number;
  width?: number;
  children: ReactNode;
}) {
  const e = easeOutExpo(progress);
  const clipX = anchor === 'middle' ? x - width / 2 : anchor === 'end' ? x - width : x;
  const dy = (1 - e) * (size * 1.15);
  return (
    <g>
      <defs>
        <clipPath id={`mask-${id}`}>
          <rect x={clipX - 8} y={y - size * 1.05} width={width + 16} height={size * 1.38} />
        </clipPath>
      </defs>
      <g clipPath={`url(#mask-${id})`}>
        <text
          x={x}
          y={y + dy}
          fill={color}
          fontSize={size}
          fontWeight={weight}
          textAnchor={anchor}
          opacity={clamp01(e * 1.4)}
          style={{fontVariantNumeric: 'tabular-nums'}}
        >
          {children}
        </text>
      </g>
    </g>
  );
}

// Single-intent Camera Move on Verified Photographs (shot-composition skill)
export function PhotoLayer({
  name,
  p,
  x = 0,
  y = 0,
  w = 1280,
  h = 720,
  mode = 'push',
  clipId,
}: {
  name: string;
  p: number;
  x?: number;
  y?: number;
  w?: number;
  h?: number;
  mode?: 'push' | 'pull' | 'panRight' | 'panLeft';
  clipId?: string;
}) {
  const t = easeInOutCubic(p);
  const scale = mode === 'push' ? 1.0 + 0.075 * t : mode === 'pull' ? 1.08 - 0.075 * t : 1.08;
  const dx = mode === 'panRight' ? -36 * t : mode === 'panLeft' ? -36 * (1 - t) : 0;
  const cx = x + w / 2;
  const cy = y + h / 2;
  return (
    <g clipPath={clipId ? `url(#${clipId})` : undefined}>
      <image
        href={staticFile(`${name}.webp`)}
        x={x}
        y={y}
        width={w}
        height={h}
        preserveAspectRatio="xMidYMid slice"
        transform={`translate(${cx + dx} ${cy}) scale(${scale}) translate(${-cx} ${-cy})`}
      />
    </g>
  );
}

// Framed Photo Card with Credit Badge
export function PhotoCard({
  name,
  p,
  x,
  y,
  w,
  h,
  caption,
  mode = 'push',
}: {
  name: string;
  p: number;
  x: number;
  y: number;
  w: number;
  h: number;
  caption?: string;
  mode?: 'push' | 'pull' | 'panRight' | 'panLeft';
}) {
  const cid = `pcard-${name}-${Math.round(x)}-${Math.round(y)}`;
  return (
    <g>
      <defs>
        <clipPath id={cid}>
          <rect x={x} y={y} width={w} height={h} rx={10} />
        </clipPath>
      </defs>
      <rect x={x - 1} y={y - 1} width={w + 2} height={h + 2} rx={11} fill="#0b1520" stroke={borderCol} strokeWidth={1.5} />
      <PhotoLayer name={name} p={p} x={x} y={y} w={w} h={h} mode={mode} clipId={cid} />
      <rect x={x} y={y + h - 54} width={w} height={54} clipPath={`url(#${cid})`} fill="#0d1824" opacity={0.82} />
      {caption && (
        <T x={x + 16} y={y + h - 29} size={15} color={cream} weight={700}>
          {caption}
        </T>
      )}
      <T x={x + 16} y={y + h - 10} size={11} color={muted} weight={500}>
        Ảnh · {photoCredits[name] || name}
      </T>
    </g>
  );
}

// Animated Callout Badge (diagram-animation)
export function Callout({
  x,
  y,
  to,
  label,
  sub,
  progress = 1,
  accent = gold,
}: {
  x: number;
  y: number;
  to: Point;
  label: string;
  sub?: string;
  progress?: number;
  accent?: string;
}) {
  const e = easeOutExpo(progress);
  const w = Math.max(190, label.length * 9.5 + 34);
  const h = sub ? 54 : 36;
  return (
    <g opacity={e}>
      <path
        d={`M${to[0]} ${to[1]} L${x} ${y + h / 2}`}
        stroke={accent}
        strokeWidth={2.2}
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - e}
      />
      <circle cx={to[0]} cy={to[1]} r={5 * e} fill={accent} stroke={cream} strokeWidth={1.8} />
      <rect x={x} y={y} width={w} height={h} rx={6} fill={panel} stroke={accent} strokeWidth={1.5} opacity={0.95} />
      <T x={x + 14} y={y + 23} size={15} color={cream}>
        {label}
      </T>
      {sub && (
        <T x={x + 14} y={y + 43} size={12} color={muted} weight={500}>
          {sub}
        </T>
      )}
    </g>
  );
}

// Flowing Connector Arrow with Traveling Packet (diagram-animation)
export function FlowPath({
  d,
  progress,
  loopT,
  color = teal,
  width = 3.2,
  packetPos,
}: {
  d: string;
  progress: number;
  loopT: number;
  color?: string;
  width?: number;
  packetPos?: Point;
}) {
  const e = easeInOutCubic(progress);
  return (
    <g>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={width}
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray={1}
        strokeDashoffset={1 - e}
        opacity={0.9}
      />
      {e > 0.7 && (
        <path
          d={d}
          fill="none"
          stroke={cream}
          strokeWidth={1.6}
          strokeDasharray="6 10"
          strokeDashoffset={-loopT * 48}
          opacity={0.75}
        />
      )}
      {packetPos && e > 0.4 && (
        <g>
          <circle cx={packetPos[0]} cy={packetPos[1]} r={9} fill={color} opacity={0.28} />
          <circle cx={packetPos[0]} cy={packetPos[1]} r={4.5} fill={gold} stroke={cream} strokeWidth={1.5} />
        </g>
      )}
    </g>
  );
}

// Deterministic 3D Perspective Projection Helper (threejs-animation / isometric engineering)
export function project3D(
  x: number,
  y: number,
  z: number,
  yaw: number,
  pitch: number,
  cx: number,
  cy: number,
  scale = 1,
): Point {
  const cosY = Math.cos(yaw);
  const sinY = Math.sin(yaw);
  const cosP = Math.cos(pitch);
  const sinP = Math.sin(pitch);
  const rx = x * cosY - z * sinY;
  const rz = x * sinY + z * cosY;
  const ry = y * cosP - rz * sinP;
  const depth = y * sinP + rz * cosP;
  const persp = 900 / (900 + depth);
  return [cx + rx * scale * persp, cy - ry * scale * persp];
}

export function poly3D(points: Point[]) {
  return points.map((pt, i) => `${i === 0 ? 'M' : 'L'}${pt[0].toFixed(1)} ${pt[1].toFixed(1)}`).join(' ') + ' Z';
}
