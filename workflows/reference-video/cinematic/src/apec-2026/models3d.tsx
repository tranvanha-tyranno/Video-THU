import * as THREE from 'three';
import {Callout, T, clamp, easeInOutCubic, easeOutCubic, palette, type Point} from './ui';

type PolyFace = {points: Point[]; fill: string; stroke?: string; depth: number; opacity?: number};

function makeCamera(pos: [number, number, number], target: [number, number, number], fov = 38) {
  const camera = new THREE.PerspectiveCamera(fov, 1280 / 720, 0.1, 200);
  camera.position.set(...pos);
  camera.lookAt(...target);
  camera.updateMatrixWorld();
  camera.updateProjectionMatrix();
  return camera;
}

function project3D(v: THREE.Vector3, camera: THREE.PerspectiveCamera, cx = 640, cy = 390, scale = 680): [number, number, number] {
  const p = v.clone().project(camera);
  const camSpace = v.clone().applyMatrix4(camera.matrixWorldInverse);
  return [cx + p.x * scale, cy - p.y * (scale * (720 / 1280)), camSpace.z];
}

function makeBoxFaces(
  center: [number, number, number],
  size: [number, number, number],
  colors: {top: string; left: string; right: string; front: string; back: string},
  camera: THREE.PerspectiveCamera,
): PolyFace[] {
  const [cx, cy, cz] = center;
  const [sx, sy, sz] = size;
  const hx = sx / 2;
  const hy = sy / 2;
  const hz = sz / 2;
  const v = [
    new THREE.Vector3(cx - hx, cy - hy, cz - hz),
    new THREE.Vector3(cx + hx, cy - hy, cz - hz),
    new THREE.Vector3(cx + hx, cy + hy, cz - hz),
    new THREE.Vector3(cx - hx, cy + hy, cz - hz),
    new THREE.Vector3(cx - hx, cy - hy, cz + hz),
    new THREE.Vector3(cx + hx, cy - hy, cz + hz),
    new THREE.Vector3(cx + hx, cy + hy, cz + hz),
    new THREE.Vector3(cx - hx, cy + hy, cz + hz),
  ];
  const quads: Array<[number[], string]> = [
    [[3, 2, 6, 7], colors.top],
    [[4, 5, 6, 7], colors.front],
    [[0, 1, 2, 3], colors.back],
    [[0, 4, 7, 3], colors.left],
    [[1, 5, 6, 2], colors.right],
  ];
  return quads.map(([idx, fill]) => {
    const pts = idx.map((i) => project3D(v[i], camera));
    const depth = pts.reduce((s, p) => s + p[2], 0) / pts.length;
    return {points: pts.map(([x, y]) => [x, y] as Point), fill, stroke: fill, depth};
  });
}

/**
 * 3D Perspective Rail-to-Sea Corridor powered by Three.js PerspectiveCamera + CatmullRomCurve3:
 * Kunming Plateau (elevated) -> Hekou/Lao Cai Border Gate -> Red River Valley -> Hanoi -> Hai Phong Deep-water Port.
 */
export function RailCorridor3D({p, beat, q}: {p: number; beat: number; q: number}) {
  const orbit = -0.35 + 0.55 * easeInOutCubic(p);
  const camX = Math.sin(orbit) * 14.2;
  const camZ = Math.cos(orbit) * 13.8;
  const camY = 6.9 - 0.6 * easeInOutCubic(p);
  const camera = makeCamera([camX, camY, camZ], [0.2, 0.3, 0.2], 36);

  const faces: PolyFace[] = [];

  // Terrain blocks from Kunming highland (left, elevated) down to Hai Phong sea (right)
  faces.push(
    ...makeBoxFaces(
      [-4.1, 0.55, -0.3],
      [3.8, 1.5, 5.2],
      {top: '#47655b', left: '#2a3e38', right: '#344c44', front: '#304740', back: '#253832'},
      camera,
    ),
    ...makeBoxFaces(
      [-1.0, 0.05, 0.0],
      [2.6, 0.9, 5.2],
      {top: '#3b5850', left: '#233632', right: '#2d453f', front: '#293e39', back: '#20312d'},
      camera,
    ),
    ...makeBoxFaces(
      [1.8, -0.25, 0.1],
      [3.2, 0.6, 5.2],
      {top: '#324e49', left: '#1d302d', right: '#253b37', front: '#223633', back: '#1a2b28'},
      camera,
    ),
    // East Sea / Gulf of Tonkin water basin on the right
    ...makeBoxFaces(
      [4.9, -0.45, 0.1],
      [3.2, 0.4, 5.2],
      {top: '#174957', left: '#10343f', right: '#133d4a', front: '#113743', back: '#0e2d37'},
      camera,
    ),
  );

  // Port crane / container terminal blocks at Hai Phong
  faces.push(
    ...makeBoxFaces(
      [3.55, 0.18, -0.65],
      [0.65, 0.28, 0.45],
      {top: '#e7b85d', left: '#a67b32', right: '#c49340', front: '#b88839', back: '#8a6427'},
      camera,
    ),
    ...makeBoxFaces(
      [3.75, 0.18, 0.25],
      [0.65, 0.28, 0.45],
      {top: '#d65138', left: '#8a3020', right: '#b03e29', front: '#9e3724', back: '#75281a'},
      camera,
    ),
    // Cargo ship hull in water
    ...makeBoxFaces(
      [5.1, -0.1, 0.45],
      [1.45, 0.28, 0.52],
      {top: '#243a40', left: '#17282d', right: '#1e3238', front: '#a63626', back: '#152226'},
      camera,
    ),
    ...makeBoxFaces(
      [5.05, 0.14, 0.45],
      [0.95, 0.2, 0.36],
      {top: '#58c9b9', left: '#378a7f', right: '#48a89b', front: '#3f998d', back: '#2d736a'},
      camera,
    ),
  );

  // Kunming city cluster blocks on left plateau
  const kmBuildings: Array<[number, number, number, number]> = [
    [-4.9, 1.65, -1.1, 0.72],
    [-4.35, 1.85, -1.35, 1.12],
    [-3.8, 1.58, -0.95, 0.58],
    [-4.55, 1.62, -0.45, 0.65],
  ];
  for (const [bx, by, bz, bh] of kmBuildings) {
    faces.push(
      ...makeBoxFaces(
        [bx, by, bz],
        [0.42, bh, 0.42],
        {top: '#cbd5d0', left: '#6e8482', right: '#8ea4a0', front: '#7c9490', back: '#5c706e'},
        camera,
      ),
    );
  }

  // Border gate arch at Lao Cai / Hekou
  faces.push(
    ...makeBoxFaces(
      [-1.55, 0.78, -0.2],
      [0.2, 0.62, 1.25],
      {top: '#e7b85d', left: '#9a712c', right: '#b88938', front: '#d6a44e', back: '#7e5a22'},
      camera,
    ),
  );

  // Hanoi urban hub cluster
  const hnBuildings: Array<[number, number, number, number]> = [
    [1.2, 0.32, -0.75, 0.56],
    [1.65, 0.44, -0.95, 0.8],
    [2.05, 0.28, -0.6, 0.48],
  ];
  for (const [bx, by, bz, bh] of hnBuildings) {
    faces.push(
      ...makeBoxFaces(
        [bx, by, bz],
        [0.36, bh, 0.36],
        {top: '#e4d8bf', left: '#8b806d', right: '#afa18b', front: '#9c8f7a', back: '#756b5b'},
        camera,
      ),
    );
  }

  // Painter's algorithm sort (back to front: more negative camera Z is farther away)
  faces.sort((a, b) => a.depth - b.depth);

  // Standard-gauge 1435mm rail path via Three.js CatmullRomCurve3
  const curve = new THREE.CatmullRomCurve3([
    new THREE.Vector3(-4.5, 1.33, 0.35), // Kunming
    new THREE.Vector3(-2.6, 1.05, 0.12),
    new THREE.Vector3(-1.55, 0.53, -0.15), // Hekou / Lao Cai
    new THREE.Vector3(0.0, 0.26, 0.22),
    new THREE.Vector3(1.55, 0.08, 0.05), // Hanoi
    new THREE.Vector3(3.45, 0.07, -0.12), // Hai Phong Port
  ]);
  const curvePts = curve.getPoints(64).map((pt) => project3D(pt, camera));
  const railD = curvePts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  // Animated train moving along the 3D rail spline
  const trainU = clamp(beat === 0 ? 0.15 + 0.35 * q : beat === 1 ? 0.42 + 0.32 * q : 0.65 + 0.3 * q);
  const trainNodes = [0, -0.045, -0.09].map((du) => {
    const u = clamp(trainU + du);
    const pos = curve.getPoint(u);
    return project3D(new THREE.Vector3(pos.x, pos.y + 0.12, pos.z), camera);
  });

  // Maritime shipping arc from Hai Phong port outward
  const shipArc = new THREE.CatmullRomCurve3([
    new THREE.Vector3(3.8, 0.05, -0.05),
    new THREE.Vector3(4.9, 0.12, 0.25),
    new THREE.Vector3(6.2, -0.1, 0.8),
  ]);
  const shipPts = shipArc.getPoints(28).map((pt) => project3D(pt, camera));
  const shipD = shipPts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' ');

  const nodePos = (v: [number, number, number]): Point => {
    const [x, y] = project3D(new THREE.Vector3(...v), camera);
    return [x, y];
  };
  const pKm = nodePos([-4.5, 1.38, 0.35]);
  const pLc = nodePos([-1.55, 0.62, -0.15]);
  const pHn = nodePos([1.55, 0.16, 0.05]);
  const pHp = nodePos([3.65, 0.22, -0.12]);

  const drawProgress = beat === 0 ? easeOutCubic(q * 1.4) : 1;

  return (
    <g>
      {faces.map((f, i) => (
        <polygon
          key={i}
          points={f.points.map((pt) => `${pt[0].toFixed(1)},${pt[1].toFixed(1)}`).join(' ')}
          fill={f.fill}
          stroke="#132528"
          strokeWidth="0.6"
        />
      ))}

      {/* Rail bed & glowing 1435mm track */}
      <path d={railD} fill="none" stroke="#102024" strokeWidth="8.5" strokeLinecap="round" opacity="0.7" />
      <path
        d={railD}
        fill="none"
        stroke={palette.gold}
        strokeWidth="4.2"
        strokeLinecap="round"
        pathLength={1}
        strokeDasharray="1"
        strokeDashoffset={1 - drawProgress}
      />
      <path
        d={railD}
        fill="none"
        stroke="#fff3d2"
        strokeWidth="1.4"
        strokeDasharray="8 8"
        opacity={beat >= 1 ? 0.9 : 0.4}
      />

      {/* Maritime outbound shipping arc */}
      {beat >= 2 && (
        <path
          d={shipD}
          fill="none"
          stroke={palette.mint}
          strokeWidth="3"
          strokeDasharray="7 6"
          pathLength={1}
          strokeDashoffset={1 - easeOutCubic(q * 1.4)}
        />
      )}

      {/* Animated train cars */}
      {trainNodes.map(([tx, ty], i) => (
        <g key={i}>
          <circle cx={tx} cy={ty} r={i === 0 ? 7.5 : 5.5} fill={i === 0 ? palette.vermilion : palette.cream} stroke="#102024" strokeWidth="2" />
        </g>
      ))}

      {/* Key station callouts */}
      <Callout x={112} y={208} to={pKm} label="Côn Minh (Vân Nam)" sub="Thị trường Tây Nam Trung Quốc" color={palette.cream} />
      <Callout x={390} y={196} to={pLc} label="Hà Khẩu · Lào Cai" sub="Cửa khẩu kết nối liên vận" color={palette.gold} />
      <Callout x={885} y={196} to={pHn} label="Hà Nội" sub="Trung tâm điều phối phía Bắc" color={palette.cream} align="end" />
      <Callout x={1180} y={230} to={pHp} label="Cảng Hải Phòng" sub="Cửa ngõ ra biển quốc tế" color={palette.mint} align="end" />

      {/* Technical gauge badge */}
      {beat >= 1 && (
        <g transform="translate(86 520)" opacity={easeOutCubic(beat === 1 ? q * 2.2 : 1)}>
          <rect width="370" height="96" rx="7" fill="#13262a" stroke={palette.gold} strokeWidth="1.4" opacity="0.94" />
          <T x={18} y={32} size={14} color={palette.gold} weight={800}>
            TIÊU CHUẨN ĐƯỜNG SẮT ĐỒNG BỘ
          </T>
          <T x={18} y={62} size={26} color={palette.cream} weight={800}>
            Khổ ray 1.435 mm
          </T>
          <T x={18} y={84} size={13} color={palette.muted} weight={600}>
            Giảm chuyển tải biên giới · Mô phỏng minh họa khái niệm
          </T>
        </g>
      )}
    </g>
  );
}

/**
 * 3D Pacific Rim 21-Economy APEC Globe powered by Three.js Sphere + Quaternion rotation
 */
export function PacificGlobe3D({p, beat, q}: {p: number; beat: number; q: number}) {
  const camera = makeCamera([0, 1.4, 9.2], [0, 0, 0], 34);
  const rotY = -2.25 + 0.42 * easeInOutCubic(p);
  const rotX = 0.24;
  const quat = new THREE.Quaternion().setFromEuler(new THREE.Euler(rotX, rotY, 0, 'YXZ'));
  const R = 2.42;

  const toVec = (latDeg: number, lonDeg: number, radius = R) => {
    const lat = THREE.MathUtils.degToRad(latDeg);
    const lon = THREE.MathUtils.degToRad(lonDeg);
    return new THREE.Vector3(
      radius * Math.cos(lat) * Math.cos(lon),
      radius * Math.sin(lat),
      -radius * Math.cos(lat) * Math.sin(lon),
    ).applyQuaternion(quat);
  };

  // Graticule lines
  const gridPaths: string[] = [];
  for (let lat = -60; lat <= 60; lat += 30) {
    const segs: string[] = [];
    for (let lon = -180; lon <= 180; lon += 6) {
      const v = toVec(lat, lon);
      if (v.z > -0.1) {
        const [x, y] = project3D(v, camera, 440, 398, 690);
        segs.push(`${segs.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    if (segs.length > 2) gridPaths.push(segs.join(' '));
  }
  for (let lon = -180; lon < 180; lon += 30) {
    const segs: string[] = [];
    for (let lat = -75; lat <= 75; lat += 5) {
      const v = toVec(lat, lon);
      if (v.z > -0.1) {
        const [x, y] = project3D(v, camera, 440, 398, 690);
        segs.push(`${segs.length === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`);
      }
    }
    if (segs.length > 2) gridPaths.push(segs.join(' '));
  }

  // Representative APEC 21 economy hubs around the Pacific Rim
  const hubs: Array<{id: string; name: string; lat: number; lon: number; key?: boolean}> = [
    {id: 'sz', name: 'Thâm Quyến (2026)', lat: 22.5, lon: 114.1, key: true},
    {id: 'vn', name: 'Việt Nam (2027)', lat: 16.0, lon: 106.5, key: true},
    {id: 'jp', name: 'Nhật Bản', lat: 35.7, lon: 139.7},
    {id: 'kr', name: 'Hàn Quốc', lat: 37.5, lon: 127.0},
    {id: 'sg', name: 'Singapore', lat: 1.3, lon: 103.8},
    {id: 'au', name: 'Úc', lat: -33.9, lon: 151.2},
    {id: 'us', name: 'Hoa Kỳ', lat: 37.7, lon: -122.4},
    {id: 'ru', name: 'Nga (Viễn Đông)', lat: 43.1, lon: 131.9},
    {id: 'ph', name: 'Philippines', lat: 14.6, lon: 121.0},
    {id: 'id', name: 'Indonesia', lat: -6.2, lon: 106.8},
    {id: 'my', name: 'Malaysia', lat: 3.1, lon: 101.7},
    {id: 'th', name: 'Thái Lan', lat: 13.7, lon: 100.5},
    {id: 'ca', name: 'Canada', lat: 49.3, lon: -123.1},
    {id: 'pe', name: 'Peru', lat: -12.0, lon: -77.0},
  ];

  const szVec = toVec(22.5, 114.1);
  const arcs = hubs
    .filter((h) => h.id !== 'sz')
    .map((h) => {
      const end = toVec(h.lat, h.lon);
      const mid = szVec.clone().add(end).normalize().multiplyScalar(R * 1.24);
      const curve = new THREE.QuadraticBezierCurve3(szVec, mid, end);
      const pts = curve
        .getPoints(24)
        .filter((v) => v.z > -0.45)
        .map((v) => project3D(v, camera, 440, 398, 690));
      return {
        id: h.id,
        key: h.key,
        d: pts.map(([x, y], i) => `${i === 0 ? 'M' : 'L'}${x.toFixed(1)} ${y.toFixed(1)}`).join(' '),
      };
    });

  const drawArc = easeOutCubic(beat === 0 ? q * 1.3 : 1);

  return (
    <g>
      {/* Globe silhouette */}
      <circle cx="440" cy="398" r="222" fill="#132c33" stroke="#36626a" strokeWidth="2" />
      <circle cx="440" cy="398" r="222" fill="url(#apec-dark-bg)" opacity="0.45" />
      {gridPaths.map((d, i) => (
        <path key={i} d={d} fill="none" stroke="#467278" strokeWidth="0.9" opacity="0.35" />
      ))}

      {/* Network arcs radiating from Shenzhen 2026 */}
      {arcs.map((a) =>
        a.d ? (
          <path
            key={a.id}
            d={a.d}
            fill="none"
            stroke={a.key ? palette.gold : palette.mint}
            strokeWidth={a.key ? 3.2 : 1.5}
            opacity={a.key ? 0.98 : 0.55}
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - drawArc}
          />
        ) : null,
      )}

      {/* Visible economy markers */}
      {hubs.map((h) => {
        const v = toVec(h.lat, h.lon);
        if (v.z < -0.15) return null;
        const [x, y] = project3D(v, camera, 440, 398, 690);
        return (
          <g key={h.id}>
            {h.key && (
              <circle
                cx={x}
                cy={y}
                r={10 + 5 * Math.sin(p * Math.PI * 4) ** 2}
                fill="none"
                stroke={palette.gold}
                strokeWidth="1.8"
                opacity="0.7"
              />
            )}
            <circle
              cx={x}
              cy={y}
              r={h.key ? 6.5 : 4}
              fill={h.id === 'vn' ? palette.vermilion : h.key ? palette.gold : palette.mint}
              stroke="#102024"
              strokeWidth="1.5"
            />
            {(h.key || h.id === 'jp' || h.id === 'sg' || h.id === 'au' || h.id === 'kr') && (
              <T x={x + 10} y={y + 4} size={h.key ? 14 : 12} color={h.key ? palette.cream : palette.muted} weight={h.key ? 800 : 600}>
                {h.name}
              </T>
            )}
          </g>
        );
      })}
    </g>
  );
}
