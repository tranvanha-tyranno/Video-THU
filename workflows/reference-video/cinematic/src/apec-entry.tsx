import type {ReactNode} from 'react';
import {AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import './economy-story/fonts.css';
import {
  FlowPath,
  MaskLine,
  PhotoCard,
  PhotoLayer,
  T,
  borderCol,
  clamp01,
  cream,
  crimson,
  easeInOutCubic,
  easeOutCubic,
  easeOutExpo,
  gold,
  ink,
  muted,
  navy,
  panel,
  panelLight,
  photoCredits,
  poly3D,
  project3D,
  sky,
  stagger,
  teal,
  type Point,
} from './apec-models';

type Shot = {id: string; title: string; start: number; frames: number; cues: number[]};
type MapIndex = {
  region: Record<string, Point>;
  rail: Record<string, Point>;
  phuquoc: Record<string, Point>;
};
type Props = {shots: Shot[]; maps: MapIndex};
type SceneCtx = {shot: Shot; beat: number; p: number; q: number; localFrame: number; maps: MapIndex};

// Master Editorial Frame Stage (shot-composition: 5% title-safe margins, 12-col rhythm, 3 motion layers)
function Stage({
  title,
  kicker,
  note,
  light = false,
  enterP = 1,
  children,
}: {
  title: string;
  kicker: string;
  note?: string;
  light?: boolean;
  enterP?: number;
  children: ReactNode;
}) {
  const textCol = light ? ink : cream;
  const subCol = light ? '#556575' : muted;
  return (
    <AbsoluteFill style={{background: light ? panelLight : navy}}>
      <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{fontFamily: '"Economy Be Vietnam Pro", sans-serif'}}>
        <defs>
          <radialGradient id="apec-bg" cx="62%" cy="46%" r="82%">
            <stop stopColor="#1b3147" />
            <stop offset="1" stopColor="#0c1722" />
          </radialGradient>
          <pattern id="apec-grid" width="36" height="36" patternUnits="userSpaceOnUse">
            <path d="M0 36V0H36" fill="none" stroke={light ? '#b8b09c' : '#587896'} opacity={light ? 0.2 : 0.12} strokeWidth="0.7" />
          </pattern>
          <linearGradient id="photo-scrim" x2="0%" y2="100%">
            <stop stopColor="#09131d" stopOpacity="0.88" />
            <stop offset="0.30" stopColor="#09131d" stopOpacity="0.08" />
            <stop offset="0.70" stopColor="#09131d" stopOpacity="0.10" />
            <stop offset="1" stopColor="#09131d" stopOpacity="0.92" />
          </linearGradient>
          <clipPath id="map-window">
            <rect x="64" y="156" width="840" height="466" rx="10" />
          </clipPath>
        </defs>
        <rect width="1280" height="720" fill={light ? panelLight : 'url(#apec-bg)'} />
        <rect x="44" y="34" width="1192" height="652" fill="url(#apec-grid)" />
        {children}
        {/* Header inside 5% title-safe margin (x=64, y=56..136) */}
        <rect x="64" y="59" width="34" height="4.5" rx="2.2" fill={light ? crimson : gold} />
        <T x={110} y={66} size={13.5} color={subCol} weight={700}>
          {kicker}
        </T>
        <MaskLine id={`h-${kicker.slice(0, 8)}`} x={64} y={118} size={36} progress={enterP} color={textCol} weight={800}>
          {title}
        </MaskLine>
        {note && (
          <g>
            <path d="M64 644H1216" stroke={light ? '#c2b8a3' : '#355068'} strokeWidth="1.2" opacity={0.75} />
            <T x={64} y={676} size={16.5} color={light ? '#2d4559' : gold} weight={600}>
              {note}
            </T>
          </g>
        )}
      </svg>
    </AbsoluteFill>
  );
}

// Full-bleed verified documentary photo with scrim, kinetic headline & credit
function FullPhotoScene({
  title,
  kicker,
  name,
  p,
  q,
  note,
  mode = 'push',
  badge,
}: {
  title: string;
  kicker: string;
  name: string;
  p: number;
  q: number;
  note: string;
  mode?: 'push' | 'pull' | 'panRight' | 'panLeft';
  badge?: {big: string; sub: string};
}) {
  return (
    <Stage title={title} kicker={kicker} note={note} enterP={Math.min(1, p * 5)}>
      <PhotoLayer name={name} p={p} mode={mode} />
      <rect width="1280" height="638" fill="url(#photo-scrim)" />
      <rect y="636" width="1280" height="84" fill="#0d1824" opacity="0.95" />
      {badge && (
        <g opacity={easeOutExpo(q * 2.5)} transform={`translate(0 ${(1 - easeOutExpo(q * 2.5)) * 16})`}>
          <rect x="64" y="492" width="440" height="112" rx="10" fill="#0e1b29" opacity="0.90" stroke={gold} strokeWidth="1.4" />
          <T x={86} y={544} size={34} color={gold} weight={800}>
            {badge.big}
          </T>
          <T x={86} y={578} size={15} color={cream} weight={600}>
            {badge.sub}
          </T>
        </g>
      )}
      <rect x="850" y="596" width="366" height="28" rx="5" fill="#0e1b29" opacity="0.86" />
      <T x={1204} y={614} anchor="end" size={12} color={muted} weight={500}>
        Ảnh · {photoCredits[name]}
      </T>
    </Stage>
  );
}

// 1. Hook: APEC 2026 Shenzhen skyline -> actual APEC 2026 leaders photo -> question
function HookScene({shot, beat, p, q}: SceneCtx) {
  if (beat === 1) {
    return (
      <FullPhotoScene
        title={shot.title}
        kicker="THÂM QUYẾN · THÁNG 11/2026"
        name="apec2026"
        p={q}
        q={q}
        mode="pull"
        note="Lãnh đạo 21 nền kinh tế tại Tuần lễ Cấp cao APEC 33 · Việt Nam tiếp nhận vai trò chủ nhà 2027"
        badge={{big: 'APEC 2026 → 2027', sub: 'Chuyển giao trực tiếp Thâm Quyến → Phú Quốc'}}
      />
    );
  }
  return (
    <FullPhotoScene
      title={shot.title}
      kicker="TÀI LIỆU PHÂN TÍCH · NGOẠI GIAO VIỆT – TRUNG"
      name={beat === 0 ? 'shenzhen' : 'civic'}
      p={q}
      q={q}
      mode="push"
      note={
        beat === 0
          ? '18–19/11/2026 · Thâm Quyến đón Tuần lễ Cấp cao APEC lần thứ 33'
          : 'Câu hỏi trung tâm: Cái bắt tay này thực chất đến đâu và bài toán nào đang chờ Việt Nam?'
      }
      badge={
        beat === 2
          ? {big: '3 trụ cột thực chất', sub: 'Ngoại giao · Thương mại ~350 tỷ USD · Hạ tầng xuyên biên giới'}
          : undefined
      }
    />
  );
}

// 2. Scope: How to read data, maps & diagrams
function ScopeScene({shot, beat, p}: SceneCtx) {
  const items = [
    {
      tag: '01 · SỐ LIỆU THỰC TẾ',
      title: 'Tổng cục Hải quan & Văn kiện APEC',
      desc: 'Kim ngạch 2024–10T/2026, kết quả hội đàm ngày 17/11/2026 tại Thâm Quyến.',
      col: teal,
    },
    {
      tag: '02 · BẢN ĐỒ ĐỊNH VỊ',
      title: 'OpenStreetMap & Hành lang thực địa',
      desc: 'Định vị trục Thâm Quyến – Hà Nội – Hải Phòng – Hữu Nghị – Phú Quốc.',
      col: gold,
    },
    {
      tag: '03 · MÔ PHỎNG KỸ THUẬT',
      title: 'Mặt cắt đường sắt & Cửa khẩu thông minh',
      desc: 'Minh họa nguyên lý khổ ray 1.435 mm và luồng xe tự hành, tách biệt số liệu thực.',
      col: sky,
    },
  ];
  return (
    <Stage
      title={shot.title}
      kicker="PHẠM VI TƯ LIỆU & PHƯƠNG PHÁP"
      note="Mọi con số thương mại và tiến độ dự án đều tách rõ giữa dữ liệu đã ghi nhận và mục tiêu kế hoạch"
      light
      enterP={Math.min(1, p * 4)}
    >
      {items.map((it, i) => {
        const e = stagger(p * 1.6, i, 0.14, 0.45);
        const active = (beat === 0 && i === 0) || (beat === 1 && i >= 1);
        const x = 64 + i * 394;
        return (
          <g key={it.tag} opacity={0.3 + 0.7 * e} transform={`translate(0 ${(1 - e) * 28})`}>
            <rect
              x={x}
              y={186}
              width={364}
              height={400}
              rx={12}
              fill="#ffffff"
              stroke={active ? it.col : '#d6cebc'}
              strokeWidth={active ? 3 : 1.5}
            />
            <rect x={x} y={186} width={364} height={10} rx={4} fill={it.col} />
            <T x={x + 26} y={244} size={13} color={it.col} weight={800}>
              {it.tag}
            </T>
            <T x={x + 26} y={294} size={22} color={ink} weight={800}>
              {it.title.split(' & ')[0]}
            </T>
            {it.title.includes(' & ') && (
              <T x={x + 26} y={324} size={22} color={ink} weight={800}>
                &amp; {it.title.split(' & ')[1]}
              </T>
            )}
            <path d={`M${x + 26} 352H${x + 336}`} stroke="#e3dccb" strokeWidth="1.5" />
            <foreignObject x={x + 26} y={372} width={312} height={180}>
              <div style={{fontSize: 17, lineHeight: 1.55, color: '#394b5c', fontWeight: 500}}>{it.desc}</div>
            </foreignObject>
          </g>
        );
      })}
    </Stage>
  );
}

// 3. Shenzhen APEC 2026: Split verified photo + animated infographic stats
function ShenzhenScene({shot, beat, p, q}: SceneCtx) {
  const stats = [
    {num: '21/21', label: 'Nền kinh tế dự đầy đủ', sub: 'Lần đầu sau nhiều năm có mặt đủ lãnh đạo cấp cao'},
    {num: '18–19/11', label: 'Tuần lễ Cấp cao APEC 33', sub: 'Tổ chức tại trung tâm công nghệ Thâm Quyến'},
    {num: '3 trụ cột', label: 'Triển vọng Thâm Quyến', sub: 'Kinh tế số · Trí tuệ nhân tạo · Chuyển đổi xanh & FTAAP'},
  ];
  return (
    <Stage
      title={shot.title}
      kicker="CHỦ NHÀ APEC 2026 · THÂM QUYẾN"
      note="Chủ đề APEC 2026: Xây dựng cộng đồng châu Á – Thái Bình Dương cùng thịnh vượng"
      enterP={Math.min(1, p * 4)}
    >
      <PhotoCard
        name={beat === 0 ? 'civic' : 'shenzhen'}
        p={q}
        x={64}
        y={162}
        w={690}
        h={454}
        caption="Thâm Quyến — trung tâm công nghệ & đổi mới miền nam Trung Quốc"
        mode="push"
      />
      {stats.map((s, i) => {
        const e = stagger(p * 1.5, i, 0.16, 0.35);
        const active = beat === i;
        const y = 162 + i * 158;
        return (
          <g key={s.num} opacity={e} transform={`translate(${(1 - e) * 32} 0)`}>
            <rect
              x={786}
              y={y}
              width={430}
              height={138}
              rx={10}
              fill={panel}
              stroke={active ? gold : borderCol}
              strokeWidth={active ? 2.5 : 1.2}
            />
            <T x={810} y={y + 48} size={34} color={active ? gold : teal} weight={800}>
              {s.num}
            </T>
            <T x={810} y={y + 82} size={17} color={cream} weight={700}>
              {s.label}
            </T>
            <T x={810} y={y + 110} size={13} color={muted} weight={500}>
              {s.sub}
            </T>
          </g>
        );
      })}
    </Stage>
  );
}

// 4. Regional OSM Map: Shenzhen -> Hanoi/Hai Phong -> Phu Quoc
function RegionalMapScene({shot, beat, p, q, maps, localFrame}: SceneCtx) {
  const pts = maps.region;
  const nx = 64,
    ny = 156;
  const scale = 0.78 + 0.05 * easeInOutCubic(p);
  const tx = 18 - 18 * easeInOutCubic(p);
  const ty = -10 - 22 * easeInOutCubic(p);
  const loc = (k: string): Point => [nx + pts[k][0] * scale + tx, ny + pts[k][1] * scale + ty];
  const sz = loc('shenzhen');
  const hn = loc('hanoi');
  const pq = loc('phuquoc');
  const curve1 = `M${sz[0]} ${sz[1]} Q${(sz[0] + hn[0]) / 2} ${(sz[1] + hn[1]) / 2 - 48} ${hn[0]} ${hn[1]}`;
  const curve2 = `M${hn[0]} ${hn[1]} Q${(hn[0] + pq[0]) / 2 + 72} ${(hn[1] + pq[1]) / 2} ${pq[0]} ${pq[1]}`;
  const marks: [string, string, number, number, string][] = [
    ['shenzhen', 'Thâm Quyến · APEC 2026', -145, -16, gold],
    ['hanoi', 'Hà Nội', -72, -10, teal],
    ['haiphong', 'Hải Phòng', 14, 16, teal],
    ['danang', 'Đà Nẵng', 12, 6, muted],
    ['phuquoc', 'Phú Quốc · APEC 2027', 16, 6, crimson],
  ];
  return (
    <Stage
      title={shot.title}
      kicker="BẢN ĐỒ ĐỊNH VỊ · TRỤC KẾT NỐI APEC 2026–2027"
      note="Đường nối trên bản đồ biểu thị trục chuyển giao ngoại giao và kết nối kinh tế giữa hai nước chủ nhà"
      enterP={Math.min(1, p * 4)}
    >
      <g clipPath="url(#map-window)">
        <image
          href={staticFile('map-region.webp')}
          x={nx + tx}
          y={ny + ty}
          width={1000 * scale}
          height={650 * scale}
        />
        <FlowPath d={curve1} progress={beat >= 1 ? 1 : q * 0.4} loopT={localFrame / 24} color={gold} width={3.6} />
        <FlowPath d={curve2} progress={beat >= 2 ? q : 0} loopT={localFrame / 24} color={crimson} width={3.6} />
        {marks.map(([k, label, dx, dy, col]) => {
          const [x, y] = loc(k);
          const isFocus = (beat === 0 && k === 'shenzhen') || (beat === 1 && (k === 'hanoi' || k === 'haiphong')) || (beat === 2 && k === 'phuquoc');
          return (
            <g key={k}>
              {isFocus && <circle cx={x} cy={y} r={12 + 10 * Math.sin(Math.PI * q) ** 2} fill="none" stroke={col} strokeWidth={2.5} />}
              <circle cx={x} cy={y} r={isFocus ? 8 : 5.5} fill={col} stroke="#ffffff" strokeWidth={2} />
              <text x={x + dx} y={y + dy} fontSize={15} fontWeight={800} paintOrder="stroke" stroke="#f5f0e4" strokeWidth={4.5} strokeLinejoin="round" fill={ink}>
                {label}
              </text>
            </g>
          );
        })}
        <rect x="614" y="582" width="276" height="28" rx="4" fill="#f5f0e4" opacity="0.9" />
        <T x={624} y={600} size={11.5} color={ink} weight={600}>
          © OpenStreetMap · OpenMapTiles · OpenFreeMap
        </T>
      </g>
      {/* Right side editorial legend panel */}
      <rect x="928" y="156" width="288" height="466" rx="10" fill={panel} stroke={borderCol} />
      <T x={950} y={198} size={18} color={gold} weight={800}>
        Ba điểm tựa bản đồ
      </T>
      <path d="M950 218H1194" stroke={borderCol} />
      {[
        ['01 · Thâm Quyến', 'Chủ nhà APEC 2026 · Vùng Vịnh Lớn', gold],
        ['02 · Hà Nội – Hải Phòng', 'Đầu mối ngoại giao, đường sắt & cảng biển', teal],
        ['03 · Đảo Phú Quốc', 'Điểm hẹn Tuần lễ Cấp cao APEC 2027', crimson],
      ].map(([h, d, c], i) => (
        <g key={h} opacity={beat >= i ? 1 : 0.42}>
          <circle cx={958} cy={262 + i * 110} r={6} fill={c} />
          <T x={976} y={268 + i * 110} size={16} color={cream} weight={800}>
            {h}
          </T>
          <foreignObject x={976} y={278 + i * 110} width={220} height={60}>
            <div style={{fontSize: 13.5, lineHeight: 1.45, color: muted}}>{d}</div>
          </foreignObject>
        </g>
      ))}
    </Stage>
  );
}

// 5. Bilateral Summit Nov 17, 2026: Verified photo + diplomatic timeline
function SummitScene({shot, beat, p, q}: SceneCtx) {
  const points = [
    ['17/11/2026', 'Hội đàm Tô Lâm – Tập Cận Bình tại Thâm Quyến'],
    ['Lần thứ 2 / 2026', 'Chuyến thăm Trung Quốc thứ hai trong cùng năm 2026'],
    ['3 trọng tâm', 'Tin cậy chiến lược · Thương mại cân bằng · Chuỗi cung ứng & Vùng Vịnh Lớn'],
  ];
  return (
    <Stage
      title={shot.title}
      kicker="NGOẠI GIAO CẤP CAO · NGÀY 17/11/2026"
      note="Nguồn: Báo Chính phủ, TTXVN/VietnamPlus (11/2026)"
      enterP={Math.min(1, p * 4)}
    >
      <PhotoCard
        name={beat === 1 ? 'greathall' : 'apec2026'}
        p={q}
        x={64}
        y={162}
        w={640}
        h={454}
        caption={beat === 1 ? 'Biểu tượng ngoại giao cấp cao Trung Quốc' : 'Tuần lễ Cấp cao APEC 33 tại Thâm Quyến (11/2026)'}
        mode="push"
      />
      <rect x={730} y={162} width={486} height={454} rx={12} fill={panel} stroke={borderCol} />
      <T x={758} y={208} size={19} color={gold} weight={800}>
        Dấu mốc hội đàm song phương
      </T>
      <path d="M772 246V546" stroke={borderCol} strokeWidth={3} />
      <path d={`M772 246V${246 + 300 * easeOutCubic((beat + q) / 3)}`} stroke={gold} strokeWidth={3.5} />
      {points.map(([tag, desc], i) => {
        const active = i <= beat;
        const y = 258 + i * 124;
        return (
          <g key={tag} opacity={active ? 1 : 0.35}>
            <circle cx={772} cy={y} r={i === beat ? 10 : 7} fill={i === beat ? gold : teal} stroke={cream} strokeWidth={2} />
            <T x={800} y={y - 2} size={15} color={gold} weight={800}>
              {tag}
            </T>
            <foreignObject x={800} y={y + 8} width={390} height={74}>
              <div style={{fontSize: 16, lineHeight: 1.45, color: cream, fontWeight: 500}}>{desc}</div>
            </foreignObject>
          </g>
        );
      })}
    </Stage>
  );
}

// 6. APEC 2026 -> 2027 Handover Infographic
function HandoverScene({shot, beat, p, localFrame}: SceneCtx) {
  const e0 = easeOutExpo(p * 3);
  const e1 = easeOutExpo((p - 0.25) * 3);
  return (
    <Stage
      title={shot.title}
      kicker="CHUYỂN GIAO TRỌNG TRÁCH · 2026 → 2027"
      note="Trung Quốc khẳng định ủng hộ mạnh mẽ Việt Nam tổ chức thành công Năm APEC 2027"
      enterP={Math.min(1, p * 4)}
    >
      {/* Left Card: APEC 2026 */}
      <g opacity={e0} transform={`translate(${(1 - e0) * -28} 0)`}>
        <rect x={64} y={176} width={470} height={428} rx={12} fill={panel} stroke={gold} strokeWidth={beat === 0 ? 2.8 : 1.5} />
        <rect x={64} y={176} width={470} height={8} rx={4} fill={gold} />
        <T x={94} y={230} size={14} color={gold} weight={800}>
          NĂM CHỦ NHÀ 2026 · TRUNG QUỐC
        </T>
        <T x={94} y={280} size={36} color={cream} weight={800}>
          Thâm Quyến
        </T>
        <foreignObject x={94} y={306} width={410} height={110}>
          <div style={{fontSize: 17, lineHeight: 1.5, color: muted}}>
            Chủ đề: “Xây dựng cộng đồng châu Á – Thái Bình Dương cùng thịnh vượng”
          </div>
        </foreignObject>
        <T x={94} y={442} size={15} color={teal} weight={700}>
          • Tuyên bố “Triển vọng Thâm Quyến”
        </T>
        <T x={94} y={478} size={15} color={cream} weight={600}>
          • Kinh tế số, trí tuệ nhân tạo &amp; chuyển đổi xanh
        </T>
        <T x={94} y={514} size={15} color={cream} weight={600}>
          • Thúc đẩy Khu vực Thương mại Tự do FTAAP
        </T>
      </g>

      {/* Center Animated Handover Arc */}
      <FlowPath d="M548 390 C600 330, 680 330, 732 390" progress={Math.min(1, (p - 0.15) * 2.5)} loopT={localFrame / 24} color={gold} width={4.5} />
      <rect x={575} y={404} width={130} height={36} rx={18} fill={gold} opacity={e1} />
      <T x={640} y={427} size={13} color={ink} anchor="middle" weight={800}>
        CHUYỂN GIAO
      </T>

      {/* Right Card: APEC 2027 */}
      <g opacity={e1} transform={`translate(${(1 - e1) * 28} 0)`}>
        <rect x={746} y={176} width={470} height={428} rx={12} fill={panel} stroke={teal} strokeWidth={beat >= 1 ? 2.8 : 1.5} />
        <rect x={746} y={176} width={470} height={8} rx={4} fill={teal} />
        <T x={776} y={230} size={14} color={teal} weight={800}>
          NĂM CHỦ NHÀ 2027 · VIỆT NAM
        </T>
        <T x={776} y={280} size={36} color={cream} weight={800}>
          Phú Quốc
        </T>
        <foreignObject x={776} y={306} width={410} height={110}>
          <div style={{fontSize: 17, lineHeight: 1.5, color: muted}}>
            Chủ đề: “Kiến tạo kỷ nguyên mới tự cường, đổi mới sáng tạo và thịnh vượng chung”
          </div>
        </foreignObject>
        <T x={776} y={442} size={15} color={gold} weight={700}>
          • 3 ưu tiên: Năng suất · Thương mại · Chất lượng sống
        </T>
        <T x={776} y={478} size={15} color={cream} weight={600}>
          • Kế thừa trực tiếp chương trình nghị sự Thâm Quyến
        </T>
        <T x={776} y={514} size={15} color={cream} weight={600}>
          • Được Trung Quốc cam kết ủng hộ toàn diện
        </T>
      </g>
    </Stage>
  );
}

// 7. Dual-track diplomacy: High-level + People/Cultural
function PeopleScene({shot, beat, p, q}: SceneCtx) {
  return (
    <Stage
      title={shot.title}
      kicker="NGOẠI GIAO HAI KÊNH · LÃNH ĐẠO & VĂN HÓA"
      note="Kênh lãnh đạo định hướng chiến lược · Kênh giao lưu nhân dân & văn hóa bồi đắp nền tảng tin cậy"
      enterP={Math.min(1, p * 4)}
    >
      <PhotoCard
        name={beat === 0 ? 'palace' : 'hanoi'}
        p={q}
        x={64}
        y={162}
        w={630}
        h={454}
        caption={beat === 0 ? 'Phủ Chủ tịch, Hà Nội — trung tâm ngoại giao Việt Nam' : 'Hà Nội — đầu mối đối ngoại và giao lưu quốc tế'}
        mode="panRight"
      />
      {[
        {
          k: 'KÊNH 01 · CẤP CAO',
          t: 'Định hướng chiến lược',
          d: 'Hội đàm thường xuyên giữa lãnh đạo cao nhất hai Đảng, hai Nhà nước giữ ổn định tổng thể.',
          c: gold,
        },
        {
          k: 'KÊNH 02 · NGOẠI GIAO VĂN HÓA',
          t: 'Giao lưu phu nhân & nhân dân',
          d: 'Hoạt động giao lưu giữa Phu nhân Ngô Phương Ly và Phu nhân Bành Lệ Viên tại Thâm Quyến.',
          c: teal,
        },
        {
          k: 'TÁC ĐỘNG CHUNG',
          t: 'Vùng đệm ổn định',
          d: 'Tạo dư địa đối thoại xây dựng cho doanh nghiệp, thương mại và hợp tác địa phương hai nước.',
          c: sky,
        },
      ].map((card, i) => {
        const e = stagger(p * 1.5, i, 0.16, 0.35);
        const y = 162 + i * 158;
        return (
          <g key={card.k} opacity={e} transform={`translate(${(1 - e) * 24} 0)`}>
            <rect x={724} y={y} width={492} height={138} rx={10} fill={panel} stroke={beat === i ? card.c : borderCol} strokeWidth={beat === i ? 2.5 : 1.2} />
            <T x={748} y={y + 34} size={13} color={card.c} weight={800}>
              {card.k}
            </T>
            <T x={748} y={y + 66} size={20} color={cream} weight={800}>
              {card.t}
            </T>
            <foreignObject x={748} y={y + 76} width={444} height={54}>
              <div style={{fontSize: 13.5, lineHeight: 1.4, color: muted}}>{card.d}</div>
            </foreignObject>
          </g>
        );
      })}
    </Stage>
  );
}

// 8. Trade Surge Bar Chart (chart-animation skill: eased bars + tabular-nums counter)
function TradeSurgeScene({shot, beat, p}: SceneCtx) {
  const bars = [
    {year: '2024', val: 205.2, label: '205,2', note: 'Lần đầu vượt 200 tỷ', col: sky},
    {year: '2025', val: 256.4, label: '256,4', note: '+24,8% kỷ lục mới', col: teal},
    {year: '10T / 2026', val: 290.0, label: '~290', note: '+39,3% cùng kỳ', col: gold},
    {year: 'Dự báo 2026', val: 350.0, label: '>350', note: 'Ước tính cả năm', col: crimson, dashed: true},
  ];
  const maxVal = 380;
  const baseY = 556;
  const chartH = 330;
  return (
    <Stage
      title={shot.title}
      kicker="DỮ LIỆU THƯƠNG MẠI · TỔNG CỤC HẢI QUAN VIỆT NAM (TỶ USD)"
      note="Nguồn: Tổng cục Hải quan Việt Nam, VOV, VietnamPlus (2024 – 10 tháng 2026)"
      enterP={Math.min(1, p * 4)}
    >
      {/* Gridlines */}
      {[100, 200, 300].map((v) => {
        const y = baseY - (v / maxVal) * chartH;
        return (
          <g key={v}>
            <path d={`M110 ${y}H840`} stroke={borderCol} strokeDasharray="4 6" opacity={0.65} />
            <T x={98} y={y + 5} size={13} color={muted} anchor="end" weight={600}>
              ${v}B
            </T>
          </g>
        );
      })}
      <path d={`M110 ${baseY}H840`} stroke={muted} strokeWidth={2} />

      {bars.map((b, i) => {
        const grow = easeOutCubic(clamp01((p * 1.4 - i * 0.16) / 0.38));
        const h = (b.val / maxVal) * chartH * grow;
        const x = 152 + i * 168;
        const shown = (b.val * grow).toFixed(i >= 2 ? 0 : 1).replace('.', ',');
        return (
          <g key={b.year}>
            <rect
              x={x}
              y={baseY - h}
              width={106}
              height={Math.max(2, h)}
              rx={6}
              fill={b.col}
              opacity={b.dashed ? 0.78 : 0.96}
              stroke={b.dashed ? cream : 'none'}
              strokeDasharray={b.dashed ? '6 4' : undefined}
              strokeWidth={b.dashed ? 2 : 0}
            />
            <T x={x + 53} y={baseY - h - 14} size={24} color={b.col} anchor="middle" weight={800}>
              {grow > 0.95 ? b.label : shown}
            </T>
            <T x={x + 53} y={baseY + 28} size={15} color={cream} anchor="middle" weight={800}>
              {b.year}
            </T>
            <T x={x + 53} y={baseY + 48} size={12} color={muted} anchor="middle" weight={500}>
              {b.note}
            </T>
          </g>
        );
      })}

      {/* Right Context Card + Real Port Photo */}
      <PhotoCard name="haiphong" p={p} x={872} y={168} w={344} h={240} caption="Cảng container quốc tế Hải Phòng" mode="push" />
      <rect x={872} y={426} width={344} height={178} rx={10} fill={panel} stroke={gold} strokeWidth={1.5} />
      <T x={894} y={462} size={14} color={gold} weight={800}>
        ĐỐI TÁC THƯƠNG MẠI SỐ 1
      </T>
      <T x={894} y={514} size={42} color={cream} weight={800}>
        +39,3%
      </T>
      <foreignObject x={894} y={528} width={300} height={66}>
        <div style={{fontSize: 13.5, lineHeight: 1.45, color: muted}}>
          Tốc độ tăng trưởng kim ngạch song phương 10 tháng đầu năm 2026 so với cùng kỳ.
        </div>
      </foreignObject>
    </Stage>
  );
}

// 9. Trade Gap Grouped Bar Chart (Export vs Import vs Deficit)
function TradeGapScene({shot, beat, p}: SceneCtx) {
  const groups = [
    {yr: '2024', exp: 61.2, imp: 144.0, def: 82.8},
    {yr: '2025', exp: 70.4, imp: 186.0, def: 115.6},
    {yr: '10T/2026', exp: 77.5, imp: 212.5, def: 134.9},
  ];
  const baseY = 558;
  const scaleY = 330 / 240;
  return (
    <Stage
      title={shot.title}
      kicker="CÁN CÂN THƯƠNG MẠI · XUẤT KHẨU – NHẬP KHẨU – NHẬP SIÊU (TỶ USD)"
      note="Nguồn: Tổng cục Hải quan Việt Nam · Mục tiêu tại Thâm Quyến: đưa thương mại song phương lên mức cân bằng hơn"
      light
      enterP={Math.min(1, p * 4)}
    >
      {/* Legend */}
      <rect x={64} y={160} width={16} height={16} rx={3} fill={teal} />
      <T x={88} y={174} size={14} color={ink}>
        Việt Nam xuất khẩu
      </T>
      <rect x={264} y={160} width={16} height={16} rx={3} fill={crimson} />
      <T x={288} y={174} size={14} color={ink}>
        Nhập khẩu từ Trung Quốc
      </T>
      <rect x={516} y={160} width={16} height={16} rx={3} fill={ink} />
      <T x={540} y={174} size={14} color={ink}>
        Mức nhập siêu
      </T>

      {[50, 100, 150, 200].map((v) => {
        const y = baseY - v * scaleY;
        return (
          <g key={v}>
            <path d={`M100 ${y}H840`} stroke="#cbbda4" strokeDasharray="4 6" />
            <T x={88} y={y + 5} size={13} color="#5b6a78" anchor="end">
              ${v}B
            </T>
          </g>
        );
      })}
      <path d={`M100 ${baseY}H840`} stroke={ink} strokeWidth={2} />

      {groups.map((g, i) => {
        const prog = easeOutCubic(clamp01((p * 1.4 - i * 0.2) / 0.36));
        const gx = 158 + i * 226;
        const hExp = g.exp * scaleY * prog;
        const hImp = g.imp * scaleY * prog;
        return (
          <g key={g.yr}>
            <rect x={gx} y={baseY - hExp} width={68} height={Math.max(2, hExp)} rx={5} fill={teal} />
            <T x={gx + 34} y={baseY - hExp - 10} size={16} color={teal} anchor="middle" weight={800}>
              {g.exp.toFixed(1).replace('.', ',')}
            </T>
            <rect x={gx + 78} y={baseY - hImp} width={68} height={Math.max(2, hImp)} rx={5} fill={crimson} />
            <T x={gx + 112} y={baseY - hImp - 10} size={16} color={crimson} anchor="middle" weight={800}>
              {g.imp.toFixed(1).replace('.', ',')}
            </T>
            {/* Deficit badge */}
            <rect x={gx + 6} y={baseY + 42} width={134} height={30} rx={6} fill={ink} opacity={prog} />
            <T x={gx + 73} y={baseY + 62} size={13.5} color={gold} anchor="middle" weight={800}>
              -{g.def.toFixed(1).replace('.', ',')} tỷ USD
            </T>
            <T x={gx + 73} y={baseY + 26} size={16} color={ink} anchor="middle" weight={800}>
              {g.yr}
            </T>
          </g>
        );
      })}

      {/* Right Summary Box */}
      <rect x={874} y={196} width={342} height={400} rx={12} fill="#ffffff" stroke="#d5cab6" strokeWidth={1.8} />
      <T x={898} y={244} size={14} color={crimson} weight={800}>
        BÀI TOÁN NHẬP SIÊU 10T / 2026
      </T>
      <T x={898} y={310} size={46} color={crimson} weight={800}>
        134,94
      </T>
      <T x={898} y={338} size={18} color={ink} weight={700}>
        tỷ USD thâm hụt thương mại
      </T>
      <path d="M898 362H1192" stroke="#e4dac8" />
      <foreignObject x={898} y={380} width={296} height={190}>
        <div style={{fontSize: 15.5, lineHeight: 1.55, color: '#3b4e60'}}>
          Tăng từ <b>82,8 tỷ</b> (2024) lên <b>115,6 tỷ</b> (2025) và gần <b>135 tỷ USD</b> sau 10 tháng 2026 — cho thấy mức độ phụ thuộc lớn vào nguồn cung đầu vào công nghiệp.
        </div>
      </foreignObject>
    </Stage>
  );
}

// 10. Supply Chain Flow Diagram (diagram-animation)
function SupplyChainScene({shot, beat, p, localFrame}: SceneCtx) {
  const nodes = [
    {x: 110, title: 'Đầu vào từ Trung Quốc', sub: 'Máy móc, linh kiện điện tử, vải & nguyên phụ liệu', col: crimson},
    {x: 495, title: 'Sản xuất tại Việt Nam', sub: 'Bắc Ninh, Hải Phòng, TP.HCM lắp ráp & hoàn thiện', col: gold},
    {x: 880, title: 'Xuất khẩu toàn cầu', sub: 'Điện tử, điện thoại, hàng công nghiệp đi Mỹ & EU', col: teal},
  ];
  return (
    <Stage
      title={shot.title}
      kicker="CƠ CHẾ CHUỖI CUNG ỨNG · VÌ SAO NHẬP KHẨU TĂNG MẠNH?"
      note="Nhập siêu chủ yếu phục vụ đầu vào cho các ngành chế biến – chế tạo xuất khẩu của Việt Nam"
      enterP={Math.min(1, p * 4)}
    >
      <FlowPath d="M405 340 H490" progress={clamp01((p - 0.18) * 3)} loopT={localFrame / 24} color={gold} width={4.5} />
      <FlowPath d="M790 340 H875" progress={clamp01((p - 0.42) * 3)} loopT={localFrame / 24} color={teal} width={4.5} />
      {nodes.map((n, i) => {
        const e = stagger(p * 1.5, i, 0.18, 0.35);
        const active = beat === i;
        return (
          <g key={n.title} opacity={e} transform={`translate(0 ${(1 - e) * 24})`}>
            <rect
              x={n.x}
              y={214}
              width={295}
              height={252}
              rx={12}
              fill={panel}
              stroke={active ? n.col : borderCol}
              strokeWidth={active ? 3 : 1.4}
            />
            <rect x={n.x} y={214} width={295} height={10} rx={4} fill={n.col} />
            <T x={n.x + 24} y={266} size={13} color={n.col} weight={800}>
              BƯỚC 0{i + 1}
            </T>
            <T x={n.x + 24} y={306} size={21} color={cream} weight={800}>
              {n.title}
            </T>
            <foreignObject x={n.x + 24} y={326} width={248} height={116}>
              <div style={{fontSize: 15, lineHeight: 1.5, color: muted}}>{n.sub}</div>
            </foreignObject>
          </g>
        );
      })}
      {/* Bottom insight strip */}
      <rect x={110} y={502} width={1065} height={96} rx={10} fill="#142434" stroke={borderCol} />
      <T x={138} y={542} size={17} color={gold} weight={800}>
        Hệ quả trực tiếp:
      </T>
      <T x={138} y={574} size={16} color={cream} weight={500}>
        Ổn định ngoại giao &amp; thông quan Việt – Trung quyết định trực tiếp nhịp sản xuất mỗi ngày của các khu công nghiệp Việt Nam.
      </T>
    </Stage>
  );
}

// 11. Vietnam Exports: Durian & Electronics Photo + Stat Cards
function ExportsScene({shot, beat, p, q}: SceneCtx) {
  return (
    <Stage
      title={shot.title}
      kicker="XUẤT KHẨU VIỆT NAM SANG TRUNG QUỐC · 10 THÁNG 2026"
      note="Nguồn: Tổng cục Hải quan Việt Nam · Xuất khẩu chính ngạch giúp giảm rủi ro phụ thuộc tiểu ngạch"
      enterP={Math.min(1, p * 4)}
    >
      <PhotoCard
        name={beat === 1 ? 'durian' : 'haiphong'}
        p={q}
        x={64}
        y={162}
        w={640}
        h={454}
        caption={beat === 1 ? 'Nông sản chính ngạch (sầu riêng, rau quả, thủy sản) mở rộng thị phần' : 'Hàng điện tử & nông sản đẩy tốc độ xuất khẩu tăng hai chữ số'}
        mode="push"
      />
      <rect x={734} y={162} width={482} height={212} rx={12} fill={panel} stroke={teal} strokeWidth={2} />
      <T x={762} y={204} size={14} color={teal} weight={800}>
        XUẤT KHẨU 10 THÁNG 2026
      </T>
      <T x={762} y={276} size={54} color={cream} weight={800}>
        77,52 tỷ USD
      </T>
      <T x={762} y={326} size={22} color={gold} weight={800}>
        Tăng +36,2% so với cùng kỳ
      </T>
      <rect x={734} y={396} width={482} height={220} rx={12} fill={panel} stroke={borderCol} />
      <T x={762} y={436} size={16} color={gold} weight={800}>
        Hai nhóm động lực chính
      </T>
      <T x={762} y={478} size={16} color={cream} weight={700}>
        1. Máy tính, linh kiện điện tử &amp; điện thoại
      </T>
      <T x={762} y={506} size={14} color={muted} weight={500}>
        Gắn chặt với chuỗi cung ứng công nghệ khu vực
      </T>
      <T x={762} y={548} size={16} color={cream} weight={700}>
        2. Nông sản chính ngạch qua nghị định thư
      </T>
      <T x={762} y={576} size={14} color={muted} weight={500}>
        Sầu riêng, rau quả, thủy sản, gạo vào thẳng hệ thống phân phối
      </T>
    </Stage>
  );
}

// 12. Greater Bay Area Link (Verified Shenzhen Bay Photo)
function GbaScene({shot, beat, p, q}: SceneCtx) {
  return (
    <FullPhotoScene
      title={shot.title}
      kicker="VÙNG VỊNH LỚN QUẢNG ĐÔNG – HỒNG KÔNG – MA CAO"
      name="gba"
      p={q}
      q={q}
      mode="panRight"
      note="Hội đàm ngày 17/11/2026 nhấn mạnh liên kết kinh tế, công nghệ số giữa Việt Nam với cụm Vùng Vịnh Lớn"
      badge={{
        big: beat === 0 ? 'Vùng Vịnh Lớn' : beat === 1 ? 'Công nghệ & Tài chính' : 'Liên thông chuỗi cung ứng',
        sub: 'Quảng Đông · Hồng Kông · Ma Cao ↔ Miền Bắc Việt Nam',
      }}
    />
  );
}

// 13. 3D Perspective Rail Gauge Cutaway (1,000 mm vs 1,435 mm) — threejs-animation / isometric engineering
function RailBottleneckScene({shot, beat, p, q}: SceneCtx) {
  const yaw = -0.52 + 0.14 * Math.sin(p * Math.PI);
  const pitch = 0.44;

  const renderTrack = (cx: number, cy: number, gaugeMm: number, accent: string, label: string, sub: string) => {
    const halfW = (gaugeMm / 1435) * 76;
    const sleepers = [-140, -100, -60, -20, 20, 60, 100, 140];
    const p3 = (x: number, y: number, z: number) => project3D(x, y, z, yaw, pitch, cx, cy, 1.0);
    return (
      <g>
        {/* Ballast bed */}
        <path
          d={poly3D([p3(-halfW - 44, -14, -170), p3(halfW + 44, -14, -170), p3(halfW + 44, -14, 170), p3(-halfW - 44, -14, 170)])}
          fill="#223446"
          stroke={borderCol}
          strokeWidth={1.2}
        />
        {/* Sleepers */}
        {sleepers.map((z) => (
          <path
            key={z}
            d={poly3D([p3(-halfW - 24, -6, z - 8), p3(halfW + 24, -6, z - 8), p3(halfW + 24, -6, z + 8), p3(-halfW - 24, -6, z + 8)])}
            fill="#4d5d6c"
            stroke="#2a3a4a"
            strokeWidth={0.8}
          />
        ))}
        {/* Two Steel Rails */}
        {[-halfW, halfW].map((rx, idx) => (
          <path
            key={idx}
            d={poly3D([p3(rx - 5, 8, -165), p3(rx + 5, 8, -165), p3(rx + 5, 8, 165), p3(rx - 5, 8, 165)])}
            fill={accent}
            stroke={cream}
            strokeWidth={1}
          />
        ))}
        {/* Measurement dimension arrow */}
        <line
          x1={p3(-halfW, 38, 0)[0]}
          y1={p3(-halfW, 38, 0)[1]}
          x2={p3(halfW, 38, 0)[0]}
          y2={p3(halfW, 38, 0)[1]}
          stroke={gold}
          strokeWidth={2.5}
        />
        <T x={cx} y={cy - 122} size={30} color={accent} anchor="middle" weight={800}>
          {label}
        </T>
        <T x={cx} y={cy - 92} size={15} color={muted} anchor="middle" weight={600}>
          {sub}
        </T>
      </g>
    );
  };

  return (
    <Stage
      title={shot.title}
      kicker="MẶT CẮT KỸ THUẬT 3D MINH HỌA · SO SÁNH KHỔ ĐƯỜNG RAY"
      note="Mô phỏng minh họa nguyên lý lệch khổ ray khiến tàu hàng phải dừng chuyển tải tại biên giới"
      enterP={Math.min(1, p * 4)}
    >
      <rect x={64} y={162} width={556} height={446} rx={12} fill="#122130" stroke={beat === 1 ? crimson : borderCol} strokeWidth={2} />
      {renderTrack(342, 412, 1000, crimson, '1.000 mm', 'Khổ ray cũ hiện hữu ở miền Bắc')}

      <rect x={660} y={162} width={556} height={446} rx={12} fill="#122130" stroke={beat >= 1 ? teal : borderCol} strokeWidth={2} />
      {renderTrack(938, 412, 1435, teal, '1.435 mm', 'Khổ tiêu chuẩn quốc tế & mạng lưới Trung Quốc')}

      {beat === 2 && (
        <g opacity={easeOutExpo(q * 3)}>
          <rect x={370} y={536} width={540} height={54} rx={8} fill={crimson} opacity={0.94} />
          <T x={640} y={569} size={17} color={cream} anchor="middle" weight={800}>
            Lệch khổ 435 mm → Phải dừng đổi giá chuyển hướng / chuyển container
          </T>
        </g>
      )}
    </Stage>
  );
}

// 14. Northern Vietnam Rail Corridor OSM Map
function RailMapScene({shot, beat, p, q, maps, localFrame}: SceneCtx) {
  const pts = maps.rail;
  const nx = 64,
    ny = 156;
  const scale = 0.88 + 0.06 * easeInOutCubic(p);
  const tx = -26 * easeInOutCubic(p);
  const ty = -24;
  const loc = (k: string): Point => [nx + pts[k][0] * scale + tx, ny + pts[k][1] * scale + ty];
  const order = ['laocai', 'phutho', 'hanoi', 'bacninh', 'hungyen', 'haiphong', 'lachhuyen'];
  const coords = order.map(loc);
  const d = coords.map((c, i) => `${i === 0 ? 'M' : 'L'}${c[0].toFixed(1)} ${c[1].toFixed(1)}`).join(' ');
  const labels: [string, string, number, number][] = [
    ['laocai', 'Lào Cai (Biên giới)', -20, -16],
    ['phutho', 'Phú Thọ', -58, 20],
    ['hanoi', 'Hà Nội', -62, -12],
    ['bacninh', 'Bắc Ninh', 10, -14],
    ['haiphong', 'Hải Phòng', -30, 26],
    ['lachhuyen', 'Cảng Lạch Huyện', 12, -8],
  ];
  return (
    <Stage
      title={shot.title}
      kicker="BẢN ĐỒ HÀNH LANG · TUYẾN LÀO CAI – HÀ NỘI – HẢI PHÒNG"
      note="Tuyến đường vẽ nối các điểm địa phương theo định hướng hành lang, không phải bình đồ thiết kế chi tiết"
      enterP={Math.min(1, p * 4)}
    >
      <g clipPath="url(#map-window)">
        <image href={staticFile('map-rail.webp')} x={nx + tx} y={ny + ty} width={1000 * scale} height={650 * scale} />
        <FlowPath d={d} progress={clamp01(p * 1.4)} loopT={localFrame / 24} color={crimson} width={4.2} />
        {labels.map(([k, txt, dx, dy], i) => {
          const [x, y] = loc(k);
          const pulse = (beat === 0 && i === 0) || (beat === 1 && i >= 1 && i <= 3) || (beat === 2 && i >= 4);
          return (
            <g key={k}>
              {pulse && <circle cx={x} cy={y} r={11 + 8 * Math.sin(Math.PI * q) ** 2} fill="none" stroke={crimson} strokeWidth={2.2} />}
              <circle cx={x} cy={y} r={6.5} fill={i === 0 || i === 5 ? gold : crimson} stroke="#ffffff" strokeWidth={2} />
              <text x={x + dx} y={y + dy} fontSize={14.5} fontWeight={800} paintOrder="stroke" stroke="#f5f0e4" strokeWidth={4} strokeLinejoin="round" fill={ink}>
                {txt}
              </text>
            </g>
          );
        })}
        <rect x="614" y="582" width="276" height="28" rx="4" fill="#f5f0e4" opacity="0.9" />
        <T x={624} y={600} size={11.5} color={ink} weight={600}>
          © OpenStreetMap · OpenMapTiles · OpenFreeMap
        </T>
      </g>

      <rect x={928} y={156} width={288} height={466} rx={10} fill={panel} stroke={borderCol} />
      <T x={950} y={198} size={18} color={gold} weight={800}>
        Hành lang 6 địa phương
      </T>
      <T x={950} y={248} size={38} color={cream} weight={800}>
        ~391 km
      </T>
      <T x={950} y={276} size={14} color={muted}>
        Tuyến chính khổ chuẩn 1.435 mm
      </T>
      <path d="M950 298H1194" stroke={borderCol} />
      {['Lào Cai (đấu nối Vân Nam)', 'Phú Thọ', 'Hà Nội (đầu mối 120 km/h)', 'Bắc Ninh – Hưng Yên', 'Hải Phòng – Lạch Huyện'].map((s, i) => (
        <g key={s}>
          <circle cx={960} cy={336 + i * 50} r={4.5} fill={teal} />
          <T x={976} y={341 + i * 50} size={14.5} color={cream} weight={600}>
            {s}
          </T>
        </g>
      ))}
    </Stage>
  );
}

// 15. Rail Technical Specs + 3D Electrified Viaduct & Moving Train
function RailSpecsScene({shot, beat, p}: SceneCtx) {
  const specs = [
    {k: 'KHỔ ĐƯỜNG RAY', v: '1.435 mm', s: 'Điện khí hóa, chạy chung khách & hàng', c: teal},
    {k: 'TỐC ĐỘ THIẾT KẾ', v: '160 km/h', s: 'Tuyến chính · 120 km/h qua Hà Nội', c: gold},
    {k: 'TỔNG VỐN ĐIỀU CHỈNH (2026)', v: '289,34 nghìn tỷ', s: 'Tương đương ~11,1 – 11,4 tỷ USD', c: crimson},
  ];
  const trainZ = -180 + ((p * 2.2) % 1) * 360;
  const p3 = (x: number, y: number, z: number) => project3D(x, y, z, -0.58, 0.36, 400, 415, 1.0);
  return (
    <Stage
      title={shot.title}
      kicker="MÔ PHỎNG KỸ THUẬT 3D · THÔNG SỐ DỰ ÁN LÀO CAI – HẢI PHÒNG"
      note="Nguồn: Nghị quyết Quốc hội, SGGP, Lao Động (2025–2026) · Hình cầu cạn là mô phỏng kỹ thuật minh họa"
      enterP={Math.min(1, p * 4)}
    >
      {/* Left 3D Perspective Viaduct + Moving Train */}
      <rect x={64} y={162} width={676} height={452} rx={12} fill="#101f2d" stroke={borderCol} />
      {/* Piers */}
      {[-130, 0, 130].map((z) => (
        <path
          key={z}
          d={poly3D([p3(-22, -16, z - 12), p3(22, -16, z - 12), p3(22, -130, z - 12), p3(-22, -130, z - 12)])}
          fill="#2d4356"
          stroke="#49647c"
        />
      ))}
      {/* Deck */}
      <path
        d={poly3D([p3(-56, 0, -210), p3(56, 0, -210), p3(56, 0, 210), p3(-56, 0, 210)])}
        fill="#395268"
        stroke={cream}
        strokeWidth={1.2}
      />
      {/* Catenary poles */}
      {[-120, 20, 150].map((z) => {
        const b = p3(-52, 0, z);
        const top = p3(-52, 90, z);
        const arm = p3(12, 84, z);
        return (
          <g key={z}>
            <line x1={b[0]} y1={b[1]} x2={top[0]} y2={top[1]} stroke={muted} strokeWidth={2.5} />
            <line x1={top[0]} y1={top[1]} x2={arm[0]} y2={arm[1]} stroke={gold} strokeWidth={2} />
          </g>
        );
      })}
      {/* Moving 3D Train */}
      <path
        d={poly3D([
          p3(-26, 38, trainZ - 64),
          p3(26, 38, trainZ - 64),
          p3(26, 38, trainZ + 64),
          p3(-26, 38, trainZ + 64),
        ])}
        fill={cream}
        stroke={teal}
        strokeWidth={1.5}
      />
      <path
        d={poly3D([
          p3(26, 4, trainZ - 64),
          p3(26, 38, trainZ - 64),
          p3(26, 38, trainZ + 64),
          p3(26, 4, trainZ + 64),
        ])}
        fill={teal}
        stroke={cream}
        strokeWidth={1.2}
      />
      <T x={88} y={204} size={13} color={gold} weight={800}>
        MÔ PHỎNG CẦU CẠN ĐIỆN KHÍ HÓA 1.435 MM
      </T>

      {/* Right Animated Spec Cards */}
      {specs.map((sp, i) => {
        const e = stagger(p * 1.5, i, 0.16, 0.35);
        const y = 162 + i * 158;
        return (
          <g key={sp.k} opacity={e} transform={`translate(${(1 - e) * 26} 0)`}>
            <rect x={766} y={y} width={450} height={138} rx={10} fill={panel} stroke={beat === i ? sp.c : borderCol} strokeWidth={beat === i ? 2.6 : 1.3} />
            <T x={792} y={y + 34} size={13} color={sp.c} weight={800}>
              {sp.k}
            </T>
            <T x={792} y={y + 82} size={34} color={cream} weight={800}>
              {sp.v}
            </T>
            <T x={792} y={y + 114} size={14} color={muted} weight={500}>
              {sp.s}
            </T>
          </g>
        );
      })}
    </Stage>
  );
}

// 16. Three Standard-Gauge Rail Lines + Verified Border/Train Photos
function RailNetworkScene({shot, beat, p, q}: SceneCtx) {
  return (
    <Stage
      title={shot.title}
      kicker="MẠNG LƯỚI 3 TUYẾN KHỔ CHUẨN PHÍA BẮC"
      note="19/12/2025: Khởi công 5 nhà ga thành phần 1 · Mục tiêu hoàn thành tuyến chính năm 2030"
      enterP={Math.min(1, p * 4)}
    >
      <PhotoCard
        name={beat === 0 ? 'laocai' : 'train'}
        p={q}
        x={64}
        y={162}
        w={640}
        h={454}
        caption={beat === 0 ? 'Cầu biên giới Lào Cai – Hà Khẩu (Việt Nam – Vân Nam)' : 'Tàu đường sắt khổ chuẩn 1.435 mm tại Trung Quốc'}
        mode="push"
      />
      {[
        ['01 · Lào Cai – Hà Nội – Hải Phòng', 'Khởi công 5 ga ngày 19/12/2025 · Mục tiêu 2030', gold],
        ['02 · Đồng Đăng – Hà Nội', 'Kết nối trực tiếp hành lang Lạng Sơn – Quảng Tây', teal],
        ['03 · Móng Cái – Hạ Long – Hải Phòng', 'Trục ven biển nối Quảng Ninh với cảng biển quốc tế', sky],
      ].map(([t, s, c], i) => {
        const e = stagger(p * 1.5, i, 0.16, 0.35);
        const y = 162 + i * 158;
        return (
          <g key={t} opacity={e} transform={`translate(${(1 - e) * 24} 0)`}>
            <rect x={734} y={y} width={482} height={138} rx={10} fill={panel} stroke={beat === i ? c : borderCol} strokeWidth={beat === i ? 2.5 : 1.2} />
            <T x={758} y={y + 52} size={20} color={c} weight={800}>
              {t}
            </T>
            <T x={758} y={y + 92} size={14.5} color={cream} weight={500}>
              {s}
            </T>
          </g>
        );
      })}
    </Stage>
  );
}

// 17. Port of Hai Phong / Lach Huyen Multimodal Link
function PortHaiPhongScene({shot, beat, p, q}: SceneCtx) {
  return (
    <FullPhotoScene
      title={shot.title}
      kicker="CẢNG NƯỚC SÂU LẠCH HUYỆN · HẢI PHÒNG"
      name="haiphong"
      p={q}
      q={q}
      mode="pull"
      note="Vận tải đa phương thức: Đường sắt điện khí hóa 1.435 mm nối thẳng bãi container ra tuyến tàu xuyên đại dương"
      badge={{
        big: beat === 0 ? 'Đích đến Lạch Huyện' : beat === 1 ? 'Đường sắt → Cảng biển' : 'Cửa ngõ khu vực',
        sub: 'Tây Nam Trung Quốc ↔ Miền Bắc Việt Nam ↔ Tuyến biển quốc tế',
      }}
    />
  );
}

// 18. Friendship Pass (Huu Nghi - Youyiguan) Verified Photo + Milestones
function BorderPhotoScene({shot, beat, p, q}: SceneCtx) {
  return (
    <Stage
      title={shot.title}
      kicker="CỬA KHẨU QUỐC TẾ HỮU NGHỊ – HỮU NGHỊ QUAN"
      note="Nguồn: Quyết định 865/QĐ-TTg · Cặp cửa khẩu đường bộ trọng điểm Lạng Sơn – Quảng Tây"
      enterP={Math.min(1, p * 4)}
    >
      <PhotoCard name="border" p={q} x={64} y={162} w={660} h={454} caption="Hữu Nghị Quan (Quảng Tây) đối diện cửa khẩu Hữu Nghị (Lạng Sơn)" mode="push" />
      <rect x={752} y={162} width={464} height={454} rx={12} fill={panel} stroke={borderCol} />
      <T x={780} y={208} size={18} color={gold} weight={800}>
        Lộ trình nâng cấp cửa khẩu
      </T>
      {[
        ['QĐ 865/QĐ-TTg', 'Phê duyệt thí điểm tại mốc 1119–1120 & 1088/2–1089'],
        ['Tháng 11/2025', 'Khai trương tuyến vận tải chuyên dụng 6 làn xe kết nối thông minh'],
        ['Tháng 8/2026', 'Áp dụng quy trình kiểm dịch & khai báo điện tử đồng bộ'],
        ['Cuối 11–12/2026', 'Thí điểm xe tự hành không người lái IGV khung 18h–20h'],
      ].map(([date, desc], i) => {
        const e = stagger(p * 1.5, i, 0.14, 0.35);
        const y = 248 + i * 90;
        return (
          <g key={date} opacity={e}>
            <rect x={780} y={y} width={144} height={26} rx={5} fill={i === 3 ? teal : '#23394e'} />
            <T x={792} y={y + 18} size={12.5} color={i === 3 ? cream : gold} weight={800}>
              {date}
            </T>
            <foreignObject x={780} y={y + 32} width={410} height={50}>
              <div style={{fontSize: 14, lineHeight: 1.4, color: cream}}>{desc}</div>
            </foreignObject>
          </g>
        );
      })}
    </Stage>
  );
}

// 19. Smart Border Gate & Unmanned IGV Flow Diagram (diagram-animation)
function SmartBorderScene({shot, beat, p, localFrame}: SceneCtx) {
  const igvX = 240 + ((localFrame * 3.8) % 740);
  const steps = [
    {x: 94, label: 'Khai báo điện tử & QR', sub: 'Kiểm dịch số hóa (8/2026)', col: sky},
    {x: 416, label: 'Cẩu thông minh & 5G', sub: 'Quét tự động tại mốc 1119–1120', col: gold},
    {x: 738, label: 'Làn xe tự hành IGV', sub: 'Thí điểm đêm 18h–20h (11–12/2026)', col: teal},
  ];
  return (
    <Stage
      title={shot.title}
      kicker="SƠ ĐỒ MINH HỌA · VẬN HÀNH CỬA KHẨU THÔNG MINH 24/7"
      note="Mục tiêu vận hành dài hạn: thông quan 24/7, đưa hàng từ Nam Ninh về Bắc Ninh trong vòng 24 giờ"
      enterP={Math.min(1, p * 4)}
    >
      {/* Top 3 Tech Nodes */}
      {steps.map((st, i) => {
        const e = stagger(p * 1.5, i, 0.16, 0.35);
        return (
          <g key={st.label} opacity={e}>
            <rect x={st.x} y={176} width={286} height={112} rx={10} fill={panel} stroke={beat === i ? st.col : borderCol} strokeWidth={beat === i ? 2.5 : 1.2} />
            <T x={st.x + 20} y={214} size={17} color={st.col} weight={800}>
              {st.label}
            </T>
            <T x={st.x + 20} y={248} size={14} color={cream} weight={500}>
              {st.sub}
            </T>
          </g>
        );
      })}
      <FlowPath d="M380 232 H416" progress={clamp01(p * 2)} loopT={localFrame / 24} color={gold} width={3.5} />
      <FlowPath d="M702 232 H738" progress={clamp01((p - 0.2) * 2)} loopT={localFrame / 24} color={teal} width={3.5} />

      {/* Animated Dedicated 6-Lane Autonomous IGV Corridor */}
      <rect x={94} y={334} width={1092} height={196} rx={12} fill="#101f2d" stroke={borderCol} />
      <T x={118} y={366} size={13} color={muted} weight={700}>
        HÀNH LANG CHUYÊN DỤNG 6 LÀN · XE TỰ HÀNH KHÔNG NGƯỜI LÁI (IGV)
      </T>
      <path d="M126 426 H1150" stroke={borderCol} strokeWidth={2} strokeDasharray="12 10" />
      <path d="M126 482 H1150" stroke={teal} strokeWidth={2} strokeDasharray="10 10" strokeDashoffset={-localFrame * 3} />

      {/* Moving IGV autonomous container trucks */}
      {[0, 360].map((offset) => {
        const tx = 130 + ((igvX + offset) % 880);
        return (
          <g key={offset} transform={`translate(${tx} 438)`}>
            <rect x={0} y={0} width={116} height={36} rx={5} fill={teal} stroke={cream} strokeWidth={1.5} />
            <rect x={86} y={4} width={24} height={28} rx={3} fill={gold} />
            <T x={44} y={23} size={12} color={cream} anchor="middle" weight={800}>
              IGV
            </T>
          </g>
        );
      })}

      {/* Bottom target banner */}
      <rect x={94} y={554} width={1092} height={58} rx={8} fill="#182e40" stroke={teal} strokeWidth={1.5} />
      <T x={640} y={589} size={18} color={gold} anchor="middle" weight={800}>
        Nam Ninh (Quảng Tây) ──── 24 giờ mục tiêu ────► Bắc Ninh / Bắc Giang (Việt Nam)
      </T>
    </Stage>
  );
}

// 20. Phu Quoc APEC 2027: Real OSM Map + Verified Aerial & Airport Photos
function PhuQuocScene({shot, beat, p, q, maps}: SceneCtx) {
  const pts = maps.phuquoc;
  const nx = 64,
    ny = 156;
  const scale = 0.68 + 0.05 * easeInOutCubic(p);
  const tx = 58;
  const ty = -24;
  const loc = (k: string): Point => [nx + pts[k][0] * scale + tx, ny + pts[k][1] * scale + ty];
  return (
    <Stage
      title={shot.title}
      kicker="CHỦ NHÀ APEC 2027 · ĐẶC KHU PHÚ QUỐC"
      note="Phú Quốc đẩy mạnh mở rộng sân bay quốc tế, nâng cấp trục giao thông & đường sắt nhẹ đón APEC 2027"
      enterP={Math.min(1, p * 4)}
    >
      <g clipPath="url(#map-window)">
        <image href={staticFile('map-phuquoc.webp')} x={nx + tx} y={ny + ty} width={1000 * scale} height={650 * scale} />
        {[
          ['duongdong', 'Dương Đông', -105, -10],
          ['airport', 'Sân bay quốc tế Phú Quốc', 14, 6],
          ['anthoi', 'An Thới', 14, 10],
        ].map(([k, lbl, dx, dy]) => {
          const [x, y] = loc(k as string);
          return (
            <g key={k as string}>
              <circle cx={x} cy={y} r={k === 'airport' ? 9 : 6} fill={k === 'airport' ? crimson : teal} stroke="#ffffff" strokeWidth={2} />
              <text x={x + (dx as number)} y={y + (dy as number)} fontSize={14.5} fontWeight={800} paintOrder="stroke" stroke="#f5f0e4" strokeWidth={4} fill={ink}>
                {lbl}
              </text>
            </g>
          );
        })}
        <rect x="614" y="582" width="276" height="28" rx="4" fill="#f5f0e4" opacity="0.9" />
        <T x={624} y={600} size={11.5} color={ink} weight={600}>
          © OpenStreetMap · OpenMapTiles · OpenFreeMap
        </T>
      </g>
      <PhotoCard name="phuquoc" p={q} x={926} y={156} w={290} h={220} caption="Đảo Phú Quốc — tâm điểm APEC 2027" mode="push" />
      <PhotoCard name="pqairport" p={q} x={926} y={396} w={290} h={226} caption="Sân bay quốc tế Phú Quốc mở rộng" mode="pull" />
    </Stage>
  );
}

// 21. Multilateral Balance Hub-and-Spoke Diagram
function MultilateralScene({shot, beat, p, localFrame}: SceneCtx) {
  const cx = 640,
    cy = 400;
  const partners = [
    {label: 'Trung Quốc', sub: 'APEC 2026 · Đối tác số 1', angle: -Math.PI * 0.78, col: gold},
    {label: 'RCEP', sub: 'Liên kết kinh tế khu vực', angle: -Math.PI * 0.22, col: teal},
    {label: 'CPTPP', sub: 'Thương mại tự do thế hệ mới', angle: Math.PI * 0.22, col: sky},
    {label: 'Hoa Kỳ & Đối tác', sub: 'Thị trường xuất khẩu lớn', angle: Math.PI * 0.78, col: crimson},
  ];
  return (
    <Stage
      title={shot.title}
      kicker="ĐỐI NGOẠI ĐỘC LẬP, TỰ CHỦ & ĐA PHƯƠNG HÓA"
      note="Bộ trưởng Ngoại giao Lê Hoài Trung: Chuyến công tác Thâm Quyến khẳng định vai trò điều phối ngày càng cao của Việt Nam"
      enterP={Math.min(1, p * 4)}
    >
      {partners.map((pt, i) => {
        const px = cx + Math.cos(pt.angle) * 340;
        const py = cy + Math.sin(pt.angle) * 165;
        const e = stagger(p * 1.4, i, 0.14, 0.35);
        return (
          <g key={pt.label} opacity={e}>
            <FlowPath d={`M${cx} ${cy} L${px} ${py}`} progress={e} loopT={localFrame / 24} color={pt.col} width={3} />
            <rect x={px - 126} y={py - 42} width={252} height={84} rx={10} fill={panel} stroke={pt.col} strokeWidth={2} />
            <T x={px} y={py - 6} size={19} color={pt.col} anchor="middle" weight={800}>
              {pt.label}
            </T>
            <T x={px} y={py + 22} size={13} color={cream} anchor="middle" weight={500}>
              {pt.sub}
            </T>
          </g>
        );
      })}
      {/* Center Vietnam Hub */}
      <circle cx={cx} cy={cy} r={82} fill={teal} stroke={gold} strokeWidth={4} />
      <T x={cx} y={cy - 6} size={23} color={cream} anchor="middle" weight={800}>
        VIỆT NAM
      </T>
      <T x={cx} y={cy + 22} size={13} color={cream} anchor="middle" weight={600}>
        Cầu nối APEC 2027
      </T>
    </Stage>
  );
}

// 22. Three Concrete Challenges Scorecard
function ChallengesScene({shot, beat, p}: SceneCtx) {
  const cards = [
    {
      n: '01',
      title: 'Cân bằng thương mại',
      metric: '134,94 tỷ USD nhập siêu',
      body: 'Nâng tỷ lệ nội địa hóa, mở rộng xuất khẩu công nghệ và nông sản chế biến sâu thay vì chỉ xuất thô.',
      col: crimson,
    },
    {
      n: '02',
      title: 'Thực thi hạ tầng 11 tỷ USD',
      metric: 'Giải phóng mặt bằng & vốn',
      body: 'Giữ đúng tiến độ giải phóng mặt bằng, tiêu chuẩn kỹ thuật và cơ chế vốn cho tuyến đường sắt tới 2030.',
      col: gold,
    },
    {
      n: '03',
      title: 'Điều phối APEC 2027',
      metric: '21 nền kinh tế tại Phú Quốc',
      body: 'Hoàn thiện hạ tầng sân bay, giao thông đảo và dẫn dắt đồng thuận giữa các nền kinh tế lớn.',
      col: teal,
    },
  ];
  return (
    <Stage
      title={shot.title}
      kicker="BA PHÉP THỬ THỰC TẾ · GIAI ĐOẠN 2027–2030"
      note="Ngoại giao thuận lợi là điều kiện cần — năng lực thực thi trong nước mới quyết định kết quả dài hạn"
      light
      enterP={Math.min(1, p * 4)}
    >
      {cards.map((c, i) => {
        const e = stagger(p * 1.5, i, 0.16, 0.35);
        const x = 64 + i * 394;
        const active = beat === i;
        return (
          <g key={c.n} opacity={e} transform={`translate(0 ${(1 - e) * 28})`}>
            <rect x={x} y={180} width={364} height={416} rx={12} fill="#ffffff" stroke={active ? c.col : '#d6cebc'} strokeWidth={active ? 3 : 1.5} />
            <T x={x + 28} y={248} size={52} color={c.col} weight={800} opacity={0.28}>
              {c.n}
            </T>
            <T x={x + 28} y={294} size={23} color={ink} weight={800}>
              {c.title}
            </T>
            <rect x={x + 28} y={316} width={308} height={34} rx={6} fill={c.col} opacity={0.14} />
            <T x={x + 42} y={338} size={14} color={c.col} weight={800}>
              {c.metric}
            </T>
            <foreignObject x={x + 28} y={372} width={308} height={190}>
              <div style={{fontSize: 16, lineHeight: 1.55, color: '#394b5c'}}>{c.body}</div>
            </foreignObject>
          </g>
        );
      })}
    </Stage>
  );
}

// 23. Recap: Return to Regional Map + 3 Verified Pillars
function RecapScene({shot, beat, p, q, maps, localFrame}: SceneCtx) {
  return (
    <RegionalMapScene
      shot={shot}
      beat={beat}
      p={p}
      q={q}
      maps={maps}
      localFrame={localFrame}
    />
  );
}

// 24. Editorial CTA (no shopping/affiliate prompts — pure educational viewer choice)
function CtaScene({shot, p}: SceneCtx) {
  const e0 = easeOutExpo(p * 3);
  const e1 = easeOutExpo((p - 0.25) * 3);
  return (
    <Stage
      title={shot.title}
      kicker="CHỌN CHỦ ĐỀ CHO TẬP TIẾP THEO"
      note="Bình luận lựa chọn của bạn bên dưới và đăng ký kênh để theo dõi các phân tích dữ liệu tiếp theo"
      enterP={Math.min(1, p * 4)}
    >
      <g opacity={e0}>
        <PhotoCard name="train" p={p} x={64} y={176} w={552} h={310} caption="Tập đề xuất A · Kỹ thuật tuyến đường sắt 11 tỷ USD" mode="push" />
        <rect x={64} y={498} width={552} height={106} rx={10} fill={panel} stroke={gold} strokeWidth={1.8} />
        <T x={90} y={538} size={20} color={gold} weight={800}>
          Lựa chọn 1: Đường sắt Lào Cai – Hải Phòng
        </T>
        <T x={90} y={572} size={15} color={cream} weight={500}>
          Phân tích chi tiết khổ ray 1.435 mm, vốn đầu tư và tác động logistics.
        </T>
      </g>
      <g opacity={e1}>
        <PhotoCard name="phuquoc" p={p} x={664} y={176} w={552} h={310} caption="Tập đề xuất B · Hạ tầng đảo Phú Quốc đón APEC 2027" mode="pull" />
        <rect x={664} y={498} width={552} height={106} rx={10} fill={panel} stroke={teal} strokeWidth={1.8} />
        <T x={690} y={538} size={20} color={teal} weight={800}>
          Lựa chọn 2: Cuộc lột xác hạ tầng Phú Quốc
        </T>
        <T x={690} y={572} size={15} color={cream} weight={500}>
          Mở rộng sân bay quốc tế, giao thông đô thị và cơ hội kinh tế APEC 2027.
        </T>
      </g>
    </Stage>
  );
}

const SCENES: Record<string, (ctx: SceneCtx) => ReactNode> = {
  hook: HookScene,
  scope: ScopeScene,
  shenzhen: ShenzhenScene,
  map_bridge: RegionalMapScene,
  summit: SummitScene,
  handover: HandoverScene,
  people: PeopleScene,
  trade_surge: TradeSurgeScene,
  trade_gap: TradeGapScene,
  supply_chain: SupplyChainScene,
  exports_vn: ExportsScene,
  gba_link: GbaScene,
  rail_bottleneck: RailBottleneckScene,
  rail_map: RailMapScene,
  rail_specs: RailSpecsScene,
  rail_network: RailNetworkScene,
  port_hai_phong: PortHaiPhongScene,
  border_photo: BorderPhotoScene,
  smart_border: SmartBorderScene,
  phu_quoc_map: PhuQuocScene,
  multilateral: MultilateralScene,
  challenges: ChallengesScene,
  recap: RecapScene,
  cta: CtaScene,
};

function ApecDocumentary({shots, maps}: Props) {
  const frame = useCurrentFrame();
  const shot = shots.find((s) => frame >= s.start && frame < s.start + s.frames) ?? shots[shots.length - 1];
  const localFrame = frame - shot.start;
  let beat = 0;
  for (let i = 0; i < shot.cues.length; i++) {
    if (localFrame >= shot.cues[i]) beat = i;
  }
  const beatStart = shot.cues[beat] ?? 0;
  const beatEnd = shot.cues[beat + 1] ?? shot.frames;
  const p = clamp01(localFrame / Math.max(1, shot.frames - 1));
  const q = clamp01((localFrame - beatStart) / Math.max(1, beatEnd - beatStart - 1));
  const Render = SCENES[shot.id] ?? HookScene;
  return <>{Render({shot, beat, p, q, localFrame, maps})}</>;
}

const DEFAULT_SHOTS: Shot[] = [{id: 'hook', title: 'APEC 2026', start: 0, frames: 14400, cues: [0, 4800, 9600]}];
const DEFAULT_MAPS: MapIndex = {
  region: {shenzhen: [700, 200], hanoi: [400, 260], haiphong: [440, 270], danang: [480, 400], phuquoc: [340, 560]},
  rail: {laocai: [180, 120], phutho: [400, 280], hanoi: [510, 320], bacninh: [560, 300], hungyen: [550, 370], haiphong: [670, 350], lachhuyen: [720, 355]},
  phuquoc: {duongdong: [450, 300], airport: [500, 360], anthoi: [520, 520]},
};

function Root() {
  return (
    <Composition
      id="Apec2026VietTrung"
      component={ApecDocumentary}
      durationInFrames={14400}
      fps={24}
      width={1920}
      height={1080}
      defaultProps={{shots: DEFAULT_SHOTS, maps: DEFAULT_MAPS}}
    />
  );
}

registerRoot(Root);
