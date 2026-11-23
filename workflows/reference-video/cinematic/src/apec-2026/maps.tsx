import {staticFile} from 'remotion';
import {PhotoFrame, T, WrappedText, easeInOutCubic, easeOutCubic, palette, type MapIndex, type Point} from './ui';

/**
 * Animated OSM Map #1: 4-Day Diplomatic Journey (Hanoi -> Shenzhen -> Kunming -> Phu Quoc 2027)
 */
export function RegionalRouteMap({maps, p, beat, q}: {maps: MapIndex; p: number; beat: number; q: number}) {
  const pts = maps.regional;
  const vx = 64;
  const vy = 152;
  const scale = 0.85 + 0.05 * easeInOutCubic(p);
  const tx = -42 - 14 * easeInOutCubic(p);
  const ty = -22 - 18 * easeInOutCubic(p);

  const pos = (k: string): Point => [vx + pts[k][0] * scale + tx, vy + pts[k][1] * scale + ty];

  const hanoi = pos('hanoi');
  const shenzhen = pos('shenzhen');
  const kunming = pos('kunming');
  const laocai = pos('laocai');
  const haiphong = pos('haiphong');
  const danang = pos('danang');
  const phuquoc = pos('phuquoc');

  const quadArc = (a: Point, b: Point, bend = -55) => {
    const mx = (a[0] + b[0]) / 2;
    const my = (a[1] + b[1]) / 2 + bend;
    return `M${a[0].toFixed(1)} ${a[1].toFixed(1)} Q${mx.toFixed(1)} ${my.toFixed(1)} ${b[0].toFixed(1)} ${b[1].toFixed(1)}`;
  };

  const leg1 = quadArc(hanoi, shenzhen, -54);
  const leg2 = quadArc(shenzhen, kunming, -62);
  const leg3 = quadArc(kunming, phuquoc, 28);

  const leg1P = beat === 0 ? easeOutCubic(q * 1.4) : 1;
  const leg2P = beat < 1 ? 0 : beat === 1 ? easeOutCubic(q * 1.35) : 1;
  const leg3P = beat < 2 ? 0 : easeOutCubic(q * 1.35);

  const stops: Array<{k: string; name: string; dx: number; dy: number; col: string; active: boolean}> = [
    {k: 'hanoi', name: 'Hà Nội', dx: -68, dy: 20, col: palette.cream, active: beat >= 0},
    {k: 'haiphong', name: 'Hải Phòng', dx: 12, dy: 16, col: palette.muted, active: beat >= 0},
    {k: 'laocai', name: 'Lào Cai', dx: -68, dy: -6, col: palette.muted, active: beat >= 1},
    {k: 'shenzhen', name: 'Thâm Quyến (APEC 2026)', dx: 14, dy: -10, col: palette.gold, active: beat >= 1},
    {k: 'kunming', name: 'Côn Minh (Vân Nam)', dx: 14, dy: -8, col: palette.vermilion, active: beat >= 2},
    {k: 'danang', name: 'Đà Nẵng (2017)', dx: 14, dy: 6, col: palette.muted, active: beat >= 2},
    {k: 'phuquoc', name: 'Phú Quốc (APEC 2027)', dx: 14, dy: 6, col: palette.mint, active: beat >= 2},
  ];

  const cards = [
    {step: 'KHỞI HÀNH · 17/11', city: 'Hà Nội → Thâm Quyến', desc: 'Đoàn cấp cao Việt Nam dự Tuần lễ Cấp cao APEC lần thứ 33'},
    {step: 'CHẶNG 1 · 17–19/11', city: 'Thâm Quyến (Quảng Đông)', desc: 'Hội đàm đầu tiên với Chủ tịch Tập Cận Bình & nhận chủ nhà APEC 2027'},
    {step: 'CHẶNG 2 · 19–20/11', city: 'Côn Minh → Phú Quốc 2027', desc: 'Kết nối Tây Nam Trung Quốc, đường sắt khổ tiêu chuẩn & hướng tới Phú Quốc'},
  ];

  return (
    <g>
      <g clipPath="url(#map-viewport)">
        <image
          href={staticFile('map-regional.webp')}
          x={vx + tx}
          y={vy + ty}
          width={1000 * scale}
          height={650 * scale}
        />
        <rect x="64" y="152" width="820" height="466" fill="#0d1e22" opacity="0.14" />

        {/* Animated route arcs */}
        <path
          d={leg1}
          fill="none"
          stroke={palette.gold}
          strokeWidth="3.6"
          pathLength={1}
          strokeDasharray="1"
          strokeDashoffset={1 - leg1P}
        />
        {leg2P > 0 && (
          <path
            d={leg2}
            fill="none"
            stroke={palette.vermilion}
            strokeWidth="3.4"
            pathLength={1}
            strokeDasharray="1"
            strokeDashoffset={1 - leg2P}
          />
        )}
        {leg3P > 0 && (
          <path
            d={leg3}
            fill="none"
            stroke={palette.mint}
            strokeWidth="3.2"
            strokeDasharray="8 6"
            opacity={leg3P}
          />
        )}

        {/* City beacons */}
        {stops.map((s) => {
          const [x, y] = pos(s.k);
          const isMajor = ['hanoi', 'shenzhen', 'kunming', 'phuquoc'].includes(s.k);
          return (
            <g key={s.k} opacity={s.active ? 1 : 0.4}>
              {isMajor && s.active && (
                <circle
                  cx={x}
                  cy={y}
                  r={10 + 7 * Math.sin(p * Math.PI * 5) ** 2}
                  fill="none"
                  stroke={s.col}
                  strokeWidth="1.8"
                  opacity="0.7"
                />
              )}
              <circle cx={x} cy={y} r={isMajor ? 6.5 : 4} fill={s.col} stroke="#0f1e22" strokeWidth="1.8" />
              <text
                x={x + s.dx}
                y={y + s.dy}
                fontSize={isMajor ? 14 : 11.5}
                fontWeight={isMajor ? 800 : 700}
                fill={s.col}
                stroke="#0f1e22"
                strokeWidth="3.5"
                paintOrder="stroke"
              >
                {s.name}
              </text>
            </g>
          );
        })}

        {/* North arrow & OSM attribution inside map */}
        <g transform="translate(838 184)">
          <circle r="18" fill="#102024" opacity="0.86" stroke={palette.borderDark} />
          <path d="M0 -10L5 6L0 2L-5 6Z" fill={palette.gold} />
          <T x={0} y={14} size={9} color={palette.cream} anchor="middle" weight={800}>
            B
          </T>
        </g>
        <rect x="76" y="586" width="248" height="22" rx="4" fill="#102024" opacity="0.84" />
        <T x={86} y={601} size={11} color={palette.muted} weight={600}>
          Bản đồ đường bộ: OpenStreetMap · OpenFreeMap
        </T>
      </g>
      <rect x="64" y="152" width="820" height="466" rx="8" fill="none" stroke={palette.borderDark} strokeWidth="1.8" />

      {/* Right itinerary sidebar synced to beats */}
      {cards.map((c, i) => {
        const y = 152 + i * 160;
        const active = beat === i;
        return (
          <g key={c.step} opacity={beat >= i ? 1 : 0.45}>
            <rect
              x="904"
              y={y}
              width="312"
              height="146"
              rx="9"
              fill={active ? palette.bgPanelSoft : palette.bgPanel}
              stroke={active ? palette.gold : palette.borderDark}
              strokeWidth={active ? 2.2 : 1.2}
            />
            <T x={924} y={y + 30} size={12} color={active ? palette.gold : palette.mint} weight={800}>
              {c.step}
            </T>
            <T x={924} y={y + 60} size={18} color={palette.cream} weight={800}>
              {c.city}
            </T>
            <WrappedText
              x={924}
              y={y + 88}
              size={13.5}
              lineHeight={20}
              color={palette.muted}
              lines={
                i === 0
                  ? ['Đoàn cấp cao Việt Nam dự', 'Tuần lễ Cấp cao APEC 33']
                  : i === 1
                    ? ['Hội đàm với Chủ tịch Tập Cận Bình', '& nhận chủ nhà APEC 2027']
                    : ['Kết nối Tây Nam Trung Quốc,', 'đường sắt & hướng tới Phú Quốc']
              }
            />
          </g>
        );
      })}
    </g>
  );
}

/**
 * Animated OSM Map #2: Greater Bay Area (Guangdong - Hong Kong - Macao) + Shenzhen Bay Photo Inset
 */
export function GreaterBayMap({maps, p, beat, q}: {maps: MapIndex; p: number; beat: number; q: number}) {
  const pts = maps.gba;
  const vx = 64;
  const vy = 152;
  const scale = 0.86 + 0.08 * easeInOutCubic(p);
  const tx = -22 - 36 * easeInOutCubic(p);
  const ty = -42 - 34 * easeInOutCubic(p);
  const pos = (k: string): Point => [vx + pts[k][0] * scale + tx, vy + pts[k][1] * scale + ty];

  const marks: Array<{k: string; name: string; dx: number; dy: number; col: string}> = [
    {k: 'guangzhou', name: 'Quảng Châu', dx: 12, dy: -6, col: '#8d3625'},
    {k: 'dongguan', name: 'Đông Hoản', dx: 12, dy: -4, col: '#5a4a36'},
    {k: 'shenzhen', name: 'Thâm Quyến (Phúc Điền)', dx: 14, dy: -12, col: '#b82e1d'},
    {k: 'yantian', name: 'Cảng Diêm Điền', dx: 12, dy: 14, col: '#1f645b'},
    {k: 'hongkong', name: 'Hồng Kông', dx: 12, dy: 16, col: '#31546b'},
    {k: 'zhuhai', name: 'Chu Hải · Ma Cao', dx: -130, dy: 14, col: '#5a4a36'},
  ];

  const sz = pos('shenzhen');
  const gz = pos('guangzhou');
  const hk = pos('hongkong');

  return (
    <g>
      <g clipPath="url(#map-viewport)">
        <image
          href={staticFile('map-gba.webp')}
          x={vx + tx}
          y={vy + ty}
          width={1000 * scale}
          height={650 * scale}
        />
        {/* Corridor links inside Greater Bay Area */}
        <path
          d={`M${gz[0]} ${gz[1]} L${sz[0]} ${sz[1]} L${hk[0]} ${hk[1]}`}
          fill="none"
          stroke="#b82e1d"
          strokeWidth="3.2"
          strokeDasharray="7 5"
          opacity={0.75}
        />
        {marks.map((m) => {
          const [x, y] = pos(m.k);
          const isSz = m.k === 'shenzhen';
          return (
            <g key={m.k}>
              {isSz && (
                <circle
                  cx={x}
                  cy={y}
                  r={12 + 8 * Math.sin(p * Math.PI * 4) ** 2}
                  fill="none"
                  stroke="#b82e1d"
                  strokeWidth="2.2"
                />
              )}
              <circle cx={x} cy={y} r={isSz ? 7.5 : 5} fill={m.col} stroke="#fbf7ee" strokeWidth="2" />
              <text
                x={x + m.dx}
                y={y + m.dy}
                fontSize={isSz ? 15 : 13}
                fontWeight={800}
                fill={m.col}
                stroke="#f5efe1"
                strokeWidth="3.8"
                paintOrder="stroke"
              >
                {m.name}
              </text>
            </g>
          );
        })}
        <rect x="76" y="586" width="268" height="22" rx="4" fill="#162528" opacity="0.86" />
        <T x={86} y={601} size={11} color={palette.cream} weight={600}>
          Vùng Vịnh Lớn · Bản đồ OpenStreetMap
        </T>
      </g>
      <rect x="64" y="152" width="820" height="466" rx="8" fill="none" stroke={palette.borderLight} strokeWidth="2" />

      {/* Right column: Shenzhen Bay Bridge verified photo + Guangdong bilateral highlights */}
      <PhotoFrame
        name="shenzhen_bay"
        x={904}
        y={152}
        w={312}
        h={212}
        p={p}
        radius={8}
        caption="Cầu Vịnh Thâm Quyến"
      />

      <rect x="904" y="382" width="312" height="236" rx="8" fill={palette.bgLightCard} stroke={palette.borderLight} strokeWidth="1.5" />
      <T x={924} y={416} size={12.5} color={palette.vermilion} weight={800}>
        GẶP BÍ THƯ TỈNH ỦY QUẢNG ĐÔNG · 17/11
      </T>
      <T x={924} y={446} size={19} color={palette.ink} weight={800}>
        Hoàng Khôn Minh · Thâm Quyến
      </T>
      <WrappedText
        x={924}
        y={478}
        size={14}
        lineHeight={22}
        color={palette.inkMuted}
        lines={[
          '• Bảo tồn di tích cách mạng Chủ tịch',
          '  Hồ Chí Minh tại Quảng Đông',
          '• Mở rộng nhập khẩu nông sản &',
          '  trái cây Việt Nam',
          '• Kết nối doanh nghiệp công nghệ cao',
          '  đầu tư vào Việt Nam',
        ]}
        opacity={easeOutCubic(beat >= 1 ? (beat === 1 ? q * 1.5 : 1) : 0.5)}
      />
    </g>
  );
}
