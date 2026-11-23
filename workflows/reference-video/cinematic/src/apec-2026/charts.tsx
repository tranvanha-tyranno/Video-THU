import {T, WrappedText, clamp, easeInOutCubic, easeOutBack, easeOutCubic, palette, stagger, type Point} from './ui';

/**
 * Chart Animation #1: Vietnam's Historic $1 Trillion 10M-2026 Trade Milestone (NSO / VGP 05/11/2026)
 */
export function TradeMilestoneChart({p, beat, q}: {p: number; beat: number; q: number}) {
  const counterProgress = beat === 0 ? easeOutCubic(q * 1.15) : 1;
  const totalVal = 1010.55 * counterProgress;
  const expProgress = beat === 0 ? 0.15 : beat === 1 ? easeOutCubic(q * 1.25) : 1;
  const impProgress = beat < 2 ? (beat === 1 ? 0.35 * easeOutCubic(q) : 0.1) : easeOutCubic(q * 1.25);

  const maxBar = 540;
  const expW = (499.24 / 550) * maxBar * expProgress;
  const impW = (511.31 / 550) * maxBar * impProgress;
  const fdiExpW = (405.31 / 550) * maxBar * expProgress;
  const domExpW = (93.93 / 550) * maxBar * expProgress;
  const fdiImpW = (379.55 / 550) * maxBar * impProgress;
  const domImpW = (131.76 / 550) * maxBar * impProgress;

  return (
    <g>
      {/* Left hero counter panel */}
      <rect x="64" y="168" width="446" height="444" rx="10" fill={palette.bgPanel} stroke={palette.borderDark} strokeWidth="1.4" />
      <T x={94} y={214} size={14} color={palette.mint} weight={800}>
        TỔNG KIM NGẠCH 10 THÁNG NĂM 2026
      </T>
      <T x={94} y={308} size={74} color={palette.gold} weight={800}>
        {totalVal.toFixed(1)}
      </T>
      <T x={94} y={346} size={22} color={palette.cream} weight={700}>
        tỷ USD · Lần đầu vượt mốc 1.000 tỷ USD
      </T>

      <path d="M94 378h386" stroke={palette.borderDark} strokeWidth="1.2" />

      {/* Two key milestone callout stats */}
      <g opacity={stagger(beat === 0 ? q : 1, 1, 0.15, 0.4)}>
        <rect x="94" y="404" width="180" height="88" rx="7" fill={palette.bgPanelSoft} />
        <T x={112} y={442} size={30} color={palette.mint} weight={800}>
          37
        </T>
        <WrappedText x={112} y={466} size={13} lineHeight={18} color={palette.muted} lines={['mặt hàng xuất khẩu', 'trên 1 tỷ USD (94,9%)']} />
      </g>
      <g opacity={stagger(beat === 0 ? q : 1, 2, 0.15, 0.4)}>
        <rect x="292" y="404" width="188" height="88" rx="7" fill={palette.bgPanelSoft} />
        <T x={310} y={442} size={30} color={palette.gold} weight={800}>
          8 nhóm
        </T>
        <WrappedText x={310} y={466} size={13} lineHeight={18} color={palette.muted} lines={['mặt hàng xuất khẩu', 'vượt 10 tỷ USD (73,4%)']} />
      </g>

      <T x={94} y={536} size={14} color={palette.muted} weight={600}>
        Cán cân 10 tháng: Nhập siêu 12,07 tỷ USD
      </T>
      <T x={94} y={562} size={13} color="#8ba3a0" weight={600}>
        Nguồn: Cục Thống kê Việt Nam (NSO) · Báo Chính phủ 05/11/2026
      </T>
      <T x={94} y={584} size={12} color="#76918e" weight={600}>
        Phạm vi: Số liệu 10 tháng đầu năm, chưa bao gồm tháng 11–12/2026
      </T>

      {/* Right animated stacked horizontal bar comparison */}
      <rect x="536" y="168" width="680" height="444" rx="10" fill={palette.bgPanel} stroke={palette.borderDark} strokeWidth="1.4" />
      <T x={568} y={214} size={15} color={palette.cream} weight={800}>
        CƠ CẤU XUẤT – NHẬP KHẨU THEO KHU VỰC KINH TẾ (TỶ USD)
      </T>

      {/* Legend */}
      <rect x="568" y="234" width="14" height="14" rx="3" fill={palette.mint} />
      <T x={590} y={246} size={13} color={palette.muted} weight={600}>
        Khu vực FDI (kể cả dầu thô)
      </T>
      <rect x="790" y="234" width="14" height="14" rx="3" fill={palette.gold} />
      <T x={812} y={246} size={13} color={palette.muted} weight={600}>
        Khu vực kinh tế trong nước
      </T>

      {/* Export Bar */}
      <g transform="translate(568 292)">
        <T x={0} y={0} size={18} color={palette.cream} weight={800}>
          Xuất khẩu · 499,24 tỷ USD
        </T>
        <T x={616} y={0} size={16} color={palette.mint} anchor="end" weight={800}>
          +27,5% so với cùng kỳ
        </T>
        <rect x="0" y="16" width={maxBar + 76} height="52" rx="6" fill="#0f1f22" />
        <rect x="0" y="16" width={fdiExpW} height="52" rx="6" fill={palette.mint} />
        <rect x={fdiExpW} y="16" width={domExpW} height="52" rx="4" fill={palette.gold} />
        {expProgress > 0.5 && (
          <>
            <T x={14} y={48} size={15} color="#0d1e21" weight={800}>
              FDI: 405,31 tỷ (81,2%)
            </T>
            <T x={fdiExpW + 10} y={48} size={13} color="#0d1e21" weight={800}>
              93,93
            </T>
          </>
        )}
        <T x={0} y={90} size={13} color={palette.muted} weight={600}>
          FDI tăng +33,0% · Khu vực trong nước tăng +8,2%
        </T>
      </g>

      {/* Import Bar */}
      <g transform="translate(568 438)">
        <T x={0} y={0} size={18} color={palette.cream} weight={800}>
          Nhập khẩu · 511,31 tỷ USD
        </T>
        <T x={616} y={0} size={16} color={palette.gold} anchor="end" weight={800}>
          +37,4% so với cùng kỳ
        </T>
        <rect x="0" y="16" width={maxBar + 76} height="52" rx="6" fill="#0f1f22" />
        <rect x="0" y="16" width={fdiImpW} height="52" rx="6" fill="#469e98" />
        <rect x={fdiImpW} y="16" width={domImpW} height="52" rx="4" fill="#d99d45" />
        {impProgress > 0.5 && (
          <>
            <T x={14} y={48} size={15} color="#0d1e21" weight={800}>
              FDI: 379,55 tỷ (+43,2%)
            </T>
            <T x={fdiImpW + 10} y={48} size={13} color="#0d1e21" weight={800}>
              131,76
            </T>
          </>
        )}
        <T x={0} y={90} size={13} color={palette.muted} weight={600}>
          Nhu cầu nhập nguyên phụ liệu & linh kiện sản xuất tăng mạnh cho xuất khẩu
        </T>
      </g>

      {/* Scale axis ticks */}
      {[0, 150, 300, 450, 550].map((v) => {
        const x = 568 + (v / 550) * maxBar;
        return (
          <g key={v}>
            <path d={`M${x} 562v10`} stroke={palette.borderDark} strokeWidth="1.2" />
            <T x={x} y={590} size={12} color={palette.muted} anchor="middle" weight={600}>
              {v} tỷ
            </T>
          </g>
        );
      })}
    </g>
  );
}

/**
 * Chart Animation #2: Trade Balance Divergence — China (Top Import Supplier) vs U.S. (Top Export Market)
 */
export function TradePartnersChart({p, beat, q}: {p: number; beat: number; q: number}) {
  const grow = easeOutCubic(beat === 0 ? q * 1.15 : 1);
  const items = [
    {label: 'Hoa Kỳ (Xuất siêu)', val: 140.1, sub: 'Xuất khẩu 159,40 tỷ USD · +26,2%', side: 'pos', highlight: beat === 2},
    {label: 'Liên minh Châu Âu (EU)', val: 40.84, sub: 'Xuất siêu +26,8%', side: 'pos', highlight: false},
    {label: 'Nhật Bản', val: 3.42, sub: 'Xuất siêu +110,4%', side: 'pos', highlight: false},
    {label: 'ASEAN', val: -16.93, sub: 'Nhập siêu +46,0%', side: 'neg', highlight: false},
    {label: 'Hàn Quốc', val: -48.63, sub: 'Nhập siêu +91,1%', side: 'neg', highlight: false},
    {label: 'Trung Quốc (Nhập siêu)', val: -134.94, sub: 'Nhập khẩu 212,46 tỷ USD · Nguồn cung số 1', side: 'neg', highlight: beat === 1},
  ];

  const centerX = 640;
  const maxHalf = 460;

  return (
    <g>
      <rect x="64" y="164" width="1152" height="456" rx="10" fill={palette.bgPanel} stroke={palette.borderDark} strokeWidth="1.4" />
      <T x={100} y={204} size={14} color={palette.vermilion} weight={800}>
        ← NHẬP SIÊU (TỶ USD)
      </T>
      <T x={640} y={204} size={14} color={palette.muted} anchor="middle" weight={800}>
        CÁN CÂN THƯƠNG MẠI 10 THÁNG 2026 · MỐC 0
      </T>
      <T x={1180} y={204} size={14} color={palette.mint} anchor="end" weight={800}>
        XUẤT SIÊU (TỶ USD) →
      </T>

      {/* Center zero axis */}
      <path d={`M${centerX} 222v354`} stroke={palette.gold} strokeWidth="2" strokeDasharray="5 5" opacity="0.7" />

      {items.map((item, idx) => {
        const y = 246 + idx * 55;
        const itemProg = stagger(grow, idx, 0.08, 0.45);
        const barW = (Math.abs(item.val) / 155) * maxHalf * itemProg;
        const isPos = item.val > 0;
        const barX = isPos ? centerX : centerX - barW;
        const barCol = item.highlight
          ? isPos
            ? palette.mint
            : palette.vermilion
          : isPos
            ? '#3c998e'
            : '#a64d3d';

        return (
          <g key={item.label} opacity={item.highlight || beat === 0 ? 1 : 0.65}>
            {item.highlight && (
              <rect x="82" y={y - 10} width="1116" height="48" rx="6" fill="#213b40" opacity="0.7" />
            )}
            <rect x={barX} y={y} width={Math.max(4, barW)} height="28" rx="5" fill={barCol} />
            {/* Label placed on opposite side of bar for zero overlap */}
            {isPos ? (
              <>
                <T x={centerX - 16} y={y + 13} size={15} color={palette.cream} anchor="end" weight={800}>
                  {item.label}
                </T>
                <T x={centerX - 16} y={y + 30} size={12} color={palette.muted} anchor="end" weight={600}>
                  {item.sub}
                </T>
                <T x={centerX + barW + 12} y={y + 20} size={16} color={palette.mint} weight={800}>
                  +{item.val.toFixed(2)} tỷ
                </T>
              </>
            ) : (
              <>
                <T x={centerX + 16} y={y + 13} size={15} color={palette.cream} anchor="start" weight={800}>
                  {item.label}
                </T>
                <T x={centerX + 16} y={y + 30} size={12} color={palette.muted} anchor="start" weight={600}>
                  {item.sub}
                </T>
                <T x={centerX - barW - 12} y={y + 20} size={16} color={palette.gold} anchor="end" weight={800}>
                  {item.val.toFixed(2)} tỷ
                </T>
              </>
            )}
          </g>
        );
      })}

      {/* Summary highlight banner at bottom of chart */}
      <rect x="96" y="576" width="1088" height="32" rx="5" fill="#102124" />
      <T x={640} y={597} size={14} color={palette.gold} anchor="middle" weight={700}>
        Trung Quốc cung ứng linh kiện & vật tư đầu vào (212,46 tỷ USD) ↔ Việt Nam sản xuất và xuất khẩu tới Mỹ, EU & toàn cầu
      </T>
    </g>
  );
}

/**
 * Diagram Animation: Vietnam's Multi-Directional Diplomacy Hub at APEC 2026 Shenzhen
 */
export function BambooDiplomacyDiagram({p, beat, q}: {p: number; beat: number; q: number}) {
  const cx = 640;
  const cy = 388;
  const nodes: Array<{
    name: string;
    leader: string;
    note: string;
    angle: number;
    r: number;
    accent: string;
    group: number;
  }> = [
    {name: 'Trung Quốc', leader: 'Chủ tịch Tập Cận Bình', note: 'Hội đàm đầu tiên · Chủ nhà APEC 2026', angle: -90, r: 215, accent: palette.vermilion, group: 0},
    {name: 'Hoa Kỳ', leader: 'Tổng thống Donald Trump', note: 'Mời dự G20 · Đối tác Chiến lược Toàn diện', angle: -24, r: 275, accent: palette.sky, group: 1},
    {name: 'Liên bang Nga', leader: 'Tổng thống Vladimir Putin', note: 'Trao đổi song phương tại Thâm Quyến', angle: 28, r: 275, accent: palette.gold, group: 2},
    {name: 'Hàn Quốc', leader: 'Tổng thống Lee Jae-myung', note: 'Hợp tác công nghệ & chuỗi cung ứng', angle: 90, r: 215, accent: palette.mint, group: 2},
    {name: 'Singapore', leader: 'Thủ tướng Lawrence Wong', note: 'Kinh tế số & kết nối ASEAN', angle: 152, r: 275, accent: palette.mint, group: 2},
    {name: 'Philippines', leader: 'Tổng thống F. Marcos Jr.', note: 'An ninh lương thực & UNCLOS 1982', angle: 204, r: 275, accent: palette.gold, group: 2},
  ];

  return (
    <g>
      {/* Subtle concentric radar rings */}
      {[120, 215, 310].map((rad, i) => (
        <circle
          key={rad}
          cx={cx}
          cy={cy}
          r={rad}
          fill="none"
          stroke={palette.borderDark}
          strokeWidth="1.2"
          strokeDasharray={i === 1 ? '6 6' : undefined}
          opacity="0.65"
        />
      ))}

      {/* Connecting spokes */}
      {nodes.map((n, i) => {
        const rad = (n.angle * Math.PI) / 180;
        const x = cx + Math.cos(rad) * n.r;
        const y = cy + Math.sin(rad) * (n.r * 0.72);
        const active = beat >= n.group;
        const lineP = active ? easeOutCubic(beat === n.group ? q * 1.6 : 1) : 0.25;
        return (
          <g key={n.name} opacity={active ? 1 : 0.35}>
            <path
              d={`M${cx} ${cy}L${x.toFixed(1)} ${y.toFixed(1)}`}
              stroke={n.accent}
              strokeWidth={n.group === 0 ? 3.4 : 2.2}
              pathLength={1}
              strokeDasharray="1"
              strokeDashoffset={1 - lineP}
            />
            {/* Travelling diplomatic pulse dot */}
            {active && (
              <circle
                cx={cx + (x - cx) * ((p * 2.2 + i * 0.17) % 1)}
                cy={cy + (y - cy) * ((p * 2.2 + i * 0.17) % 1)}
                r="4"
                fill={n.accent}
              />
            )}
            <g transform={`translate(${x} ${y}) scale(${0.88 + 0.12 * easeOutBack(lineP)})`}>
              <rect x="-148" y="-40" width="296" height="80" rx="8" fill={palette.bgPanel} stroke={n.accent} strokeWidth={beat === n.group ? 2.4 : 1.3} />
              <T x={0} y={-14} size={16} color={n.accent} anchor="middle" weight={800}>
                {n.name}
              </T>
              <T x={0} y={8} size={14} color={palette.cream} anchor="middle" weight={700}>
                {n.leader}
              </T>
              <T x={0} y={28} size={11.5} color={palette.muted} anchor="middle" weight={600}>
                {n.note}
              </T>
            </g>
          </g>
        );
      })}

      {/* Center Vietnam node */}
      <g transform={`translate(${cx} ${cy})`}>
        <circle r={68 + 5 * Math.sin(p * Math.PI * 4) ** 2} fill="none" stroke={palette.gold} strokeWidth="2" opacity="0.5" />
        <circle r="58" fill="#a82c24" stroke={palette.gold} strokeWidth="3" />
        <T x={0} y={-4} size={19} color={palette.cream} anchor="middle" weight={800}>
          VIỆT NAM
        </T>
        <T x={0} y={18} size={12} color={palette.gold} anchor="middle" weight={700}>
          APEC 2026 → 2027
        </T>
      </g>
    </g>
  );
}

/**
 * Animated Infographic: 5 Pillars of Vietnam – Southwest China Connectivity (Kunming Forum, 20 Nov 2026)
 */
export function FivePillarsInfographic({p, beat, q}: {p: number; beat: number; q: number}) {
  const pillars = [
    {num: '01', title: 'Chính sách', desc: 'Đồng bộ cơ chế hợp tác địa phương & biên giới'},
    {num: '02', title: 'Hạ tầng', desc: 'Đường sắt khổ tiêu chuẩn · Cảng biển · Lưới điện'},
    {num: '03', title: 'Kinh tế & KHCN', desc: 'Chuỗi cung ứng công nghệ cao & thương mại số'},
    {num: '04', title: 'Nhân văn', desc: 'Giáo dục · Đào tạo · Trao đổi sinh viên'},
    {num: '05', title: 'Giao lưu nhân dân', desc: 'Thanh niên · Du lịch di sản 2026–2027'},
  ];

  return (
    <g>
      {/* Top 5-pillar horizontal flow */}
      <path
        d="M140 242H1140"
        stroke={palette.gold}
        strokeWidth="2.5"
        strokeDasharray="6 6"
        opacity="0.55"
      />
      {pillars.map((item, i) => {
        const x = 64 + i * 234;
        const enter = stagger(beat === 0 ? q * 1.25 : 1, i, 0.1, 0.42);
        const active = beat === 0 || (beat === 1 && i >= 3) || (beat === 2 && i === 4);
        return (
          <g key={item.num} transform={`translate(${x} ${186 + (1 - enter) * 20})`} opacity={enter * (active ? 1 : 0.65)}>
            <rect
              width="214"
              height="208"
              rx="9"
              fill={palette.bgPanel}
              stroke={active ? palette.gold : palette.borderDark}
              strokeWidth={active ? 2 : 1.2}
            />
            <circle cx="34" cy="36" r="18" fill={active ? palette.vermilion : palette.bgPanelSoft} />
            <T x={34} y={42} size={14} color={palette.cream} anchor="middle" weight={800}>
              {item.num}
            </T>
            <T x={18} y={88} size={19} color={palette.cream} weight={800}>
              {item.title}
            </T>
            <WrappedText
              x={18}
              y={118}
              size={13.5}
              lineHeight={21}
              color={palette.muted}
              lines={item.desc.split(' · ')}
            />
          </g>
        );
      })}

      {/* Bottom dual highlight cards for Beat 1 (Red Journey Youth) and Beat 2 (2026-2027 Tourism Year) */}
      <g transform="translate(64 426)" opacity={easeOutCubic(beat >= 1 ? (beat === 1 ? q * 1.8 : 1) : 0.25)}>
        <rect width="560" height="178" rx="9" fill={palette.bgPanelSoft} stroke={beat === 1 ? palette.vermilion : palette.borderDark} strokeWidth="2" />
        <T x={26} y={38} size={13} color={palette.gold} weight={800}>
          CẦU NỐI THẾ HỆ TRẺ · CÔN MINH 20/11/2026
        </T>
        <T x={26} y={74} size={23} color={palette.cream} weight={800}>
          Hành trình đỏ nghiên cứu, học tập
        </T>
        <WrappedText
          x={26}
          y={108}
          size={15}
          lineHeight={23}
          color={palette.muted}
          lines={[
            'Tổng Bí thư, Chủ tịch nước Tô Lâm gặp gỡ thanh niên',
            'Việt Nam – Trung Quốc tại Vân Nam, khuyến khích trao đổi',
            'sinh viên và tăng cường hiểu biết giữa thế hệ trẻ hai nước.',
          ]}
        />
      </g>

      <g transform="translate(656 426)" opacity={easeOutCubic(beat >= 2 ? q * 1.8 : 0.25)}>
        <rect width="560" height="178" rx="9" fill={palette.bgPanelSoft} stroke={beat === 2 ? palette.mint : palette.borderDark} strokeWidth="2" />
        <T x={26} y={38} size={13} color={palette.mint} weight={800}>
          KẾT NỐI DI SẢN & DU LỊCH XUYÊN BIÊN GIỚI
        </T>
        <T x={26} y={74} size={23} color={palette.cream} weight={800}>
          Năm Hợp tác Du lịch 2026–2027
        </T>
        <WrappedText
          x={26}
          y={108}
          size={15}
          lineHeight={23}
          color={palette.muted}
          lines={[
            'Tận dụng đà Năm Hợp tác Du lịch Việt Nam – Trung Quốc',
            '2026–2027 để mở tuyến du lịch di sản giữa Vân Nam,',
            'Quảng Đông với các trung tâm du lịch và Phú Quốc.',
          ]}
        />
      </g>
    </g>
  );
}

/**
 * Animated Infographic: 3 Priorities Grid (reusable for Shenzhen 2026, Plenary Proposals, Phu Quoc 2027)
 */
export function ThreePillarsCards({
  items,
  beat,
  q,
  light = false,
  y = 212,
}: {
  items: Array<{tag: string; title: string; lines: string[]; accent: string}>;
  beat: number;
  q: number;
  light?: boolean;
  y?: number;
}) {
  return (
    <g>
      {items.map((item, i) => {
        const x = 64 + i * 394;
        const isCurrent = beat === i;
        const enter = stagger(beat === 0 ? q * 1.3 : 1, i, 0.12, 0.45);
        return (
          <g
            key={item.title}
            transform={`translate(${x} ${y + (1 - enter) * 18})`}
            opacity={enter * (beat >= i ? 1 : 0.52)}
          >
            <rect
              width="364"
              height="368"
              rx="10"
              fill={light ? palette.bgLightCard : palette.bgPanel}
              stroke={isCurrent ? item.accent : light ? palette.borderLight : palette.borderDark}
              strokeWidth={isCurrent ? 2.5 : 1.3}
            />
            <rect x="0" y="0" width="364" height="7" rx="3" fill={item.accent} />
            <T x={28} y={48} size={13} color={item.accent} weight={800}>
              {item.tag}
            </T>
            <T x={28} y={92} size={25} color={light ? palette.ink : palette.cream} weight={800}>
              {item.title}
            </T>
            <path d="M28 118h308" stroke={light ? palette.borderLight : palette.borderDark} strokeWidth="1.2" />
            <WrappedText
              x={28}
              y={156}
              size={16.5}
              lineHeight={27}
              color={light ? palette.inkMuted : palette.muted}
              lines={item.lines}
            />
          </g>
        );
      })}
    </g>
  );
}
