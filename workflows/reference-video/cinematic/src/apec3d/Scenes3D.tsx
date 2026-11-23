import React, { useEffect, useMemo } from 'react';
import { AbsoluteFill, useCurrentFrame } from 'remotion';
import * as THREE from 'three';
import { photoCredits } from '../apec-models';
import {
  CinematicStage,
  EarthGlobe3D,
  ExtrudedLabel3D,
  FloatingHUD,
  PALETTE,
  PhotoFrame3D,
  easeInOutCubic,
  easeOutCubic,
  lerpVec3,
  usePhotoTexture,
  type HubId,
  type Vec3,
} from './World3D';

export type Point2D = [number, number];

export interface ShotData {
  id: string;
  title: string;
  start: number;
  frames: number;
  cues: number[];
}

export interface MapIndexData {
  region: Record<string, Point2D>;
  rail: Record<string, Point2D>;
  phuquoc: Record<string, Point2D>;
}

export interface Scene3DCtx {
  shot: ShotData;
  beat: number;
  p: number;
  q: number;
  localFrame: number;
  maps: MapIndexData;
}

const clamp01 = (t: number): number => Math.max(0, Math.min(1, t));

/* -------------------------------------------------------------------------- */
/*  Shared 3D Environment Helpers (Reflective Grid Floor, Volumetric Beams,   */
/*  Corrugated Shipping Containers, Glowing Spline Tubes)                     */
/* -------------------------------------------------------------------------- */

const ReflectiveGridFloor: React.FC<{
  y?: number;
  size?: number;
  divisions?: number;
  lineColor?: string;
  subColor?: string;
}> = ({
  y = -2.2,
  size = 46,
  divisions = 34,
  lineColor = '#28527a',
  subColor = '#14273d',
}) => {
  return (
    <group position={[0, y, 0]}>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[size, size]} />
        <meshPhysicalMaterial
          color="#07101c"
          metalness={0.78}
          roughness={0.28}
          clearcoat={0.65}
          clearcoatRoughness={0.22}
        />
      </mesh>
      <gridHelper args={[size, divisions, lineColor, subColor]} position={[0, 0.005, 0]} />
    </group>
  );
};

const VolumetricBeam: React.FC<{
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  opacity?: number;
  radius?: number;
  height?: number;
}> = ({
  position,
  rotation = [0, 0, -0.22],
  color = PALETTE.cyan,
  opacity = 0.055,
  radius = 2.6,
  height = 14,
}) => (
  <mesh position={position} rotation={rotation}>
    <coneGeometry args={[radius, height, 24, 1, true]} />
    <meshBasicMaterial
      color={color}
      transparent
      opacity={opacity}
      side={THREE.DoubleSide}
      depthWrite={false}
    />
  </mesh>
);

const CorrugatedContainer3D: React.FC<{
  position: Vec3;
  rotation?: Vec3;
  color?: string;
  scale?: number;
}> = ({ position, rotation = [0, 0, 0], color = PALETTE.cyan, scale = 1 }) => {
  const ribs = [-0.72, -0.54, -0.36, -0.18, 0, 0.18, 0.36, 0.54, 0.72];
  return (
    <group position={position} rotation={rotation} scale={scale}>
      <mesh>
        <boxGeometry args={[1.9, 0.78, 0.76]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.55}
          roughness={0.38}
          clearcoat={0.35}
        />
      </mesh>
      {ribs.map((rx) => (
        <React.Fragment key={rx}>
          <mesh position={[rx, 0, 0.39]}>
            <boxGeometry args={[0.045, 0.68, 0.03]} />
            <meshStandardMaterial color="#182536" metalness={0.6} roughness={0.4} />
          </mesh>
          <mesh position={[rx, 0, -0.39]}>
            <boxGeometry args={[0.045, 0.68, 0.03]} />
            <meshStandardMaterial color="#182536" metalness={0.6} roughness={0.4} />
          </mesh>
        </React.Fragment>
      ))}
      {/* Metallic top/bottom frame rails */}
      <mesh position={[0, 0.395, 0]}>
        <boxGeometry args={[1.94, 0.04, 0.8]} />
        <meshStandardMaterial color="#9fb3ca" metalness={0.85} roughness={0.25} />
      </mesh>
      <mesh position={[0, -0.395, 0]}>
        <boxGeometry args={[1.94, 0.04, 0.8]} />
        <meshStandardMaterial color="#9fb3ca" metalness={0.85} roughness={0.25} />
      </mesh>
    </group>
  );
};

const GlowingFlowTube: React.FC<{
  points: Vec3[];
  color: string;
  radius?: number;
  packetCount?: number;
  speed?: number;
}> = ({ points, color, radius = 0.04, packetCount = 3, speed = 0.014 }) => {
  const frame = useCurrentFrame();
  const { curve, tubeGeo } = useMemo(() => {
    const vecs = points.map((pt) => new THREE.Vector3(pt[0], pt[1], pt[2]));
    const c = new THREE.CatmullRomCurve3(vecs);
    const geo = new THREE.TubeGeometry(c, 64, radius, 10, false);
    return { curve: c, tubeGeo: geo };
  }, [points, radius]);

  useEffect(() => {
    return () => {
      tubeGeo.dispose();
    };
  }, [tubeGeo]);

  return (
    <group>
      <mesh geometry={tubeGeo}>
        <meshBasicMaterial color={color} transparent opacity={0.55} />
      </mesh>
      {Array.from({ length: packetCount }, (_, i) => {
        const t = (frame * speed + i / packetCount) % 1;
        const pos = curve.getPoint(t);
        return (
          <group key={i} position={[pos.x, pos.y, pos.z]}>
            <mesh>
              <sphereGeometry args={[radius * 2.4, 12, 12]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
            <mesh>
              <sphereGeometry args={[radius * 4.2, 12, 12]} />
              <meshBasicMaterial color={color} transparent opacity={0.42} />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

/* -------------------------------------------------------------------------- */
/*  1. GlobeCorridorScene3D (`map_bridge`, `recap`)                           */
/* -------------------------------------------------------------------------- */

export const GlobeCorridorScene3D: React.FC<Scene3DCtx> = ({ shot, beat, p, q }) => {
  const isRecap = shot.id === 'recap';
  const eBeat = easeInOutCubic(q);

  const camPos: Vec3 =
    beat === 0
      ? lerpVec3([3.8, 2.4, 10.6], [2.4, 1.55, 9.2], eBeat)
      : beat === 1
        ? lerpVec3([2.4, 1.55, 9.2], [-0.85, 1.15, 8.9], eBeat)
        : lerpVec3([-0.85, 1.15, 8.9], [-2.1, 0.15, 9.8], eBeat);

  const lookAt: Vec3 =
    beat === 0
      ? lerpVec3([0, 0.0, 0], [0.35, 0.15, 0], eBeat)
      : beat === 1
        ? lerpVec3([0.35, 0.15, 0], [-0.1, 0.05, 0], eBeat)
        : lerpVec3([-0.1, 0.05, 0], [0.0, -0.05, 0], eBeat);

  const activeRoute =
    beat === 0 ? 'shenzhen-hanoi' : beat === 1 ? 'corridor' : 'all';
  const highlightHub: HubId | 'all' =
    beat === 0 ? 'shenzhen' : beat === 1 ? 'hanoi' : 'phuquoc';

  const hud = isRecap
    ? {
        kicker: 'TỔNG KẾT HÀNH LANG · APEC 2026 → 2027',
        caption:
          beat === 0
            ? 'Ba trụ cột sau cái bắt tay Thâm Quyến'
            : beat === 1
              ? 'Thương mại ~350 tỷ USD đi kèm hạ tầng khổ chuẩn 1.435 mm'
              : 'Phú Quốc 2027: Năng lực thực thi trong nước quyết định tầm vóc',
        subcaption:
          beat === 0
            ? 'Ngoại giao cấp cao ổn định · Chuyển giao trực tiếp vai trò chủ nhà APEC'
            : beat === 1
              ? 'Đường sắt Lào Cai – Hải Phòng & cửa khẩu thông minh giảm chi phí logistics'
              : 'Trả lời câu hỏi mở đầu: Thực chất nhưng đi kèm ba phép thử cải cách rõ rệt',
      }
    : {
        kicker: 'TRỤC ĐỊA CHIẾN LƯỢC · THÂM QUYẾN – HÀ NỘI – PHÚ QUỐC',
        caption:
          beat === 0
            ? 'Thâm Quyến · Chủ nhà APEC 2026 & trung tâm Vùng Vịnh Lớn'
            : beat === 1
              ? 'Hà Nội – Hải Phòng · Đầu mối ngoại giao, đường sắt & cảng biển'
              : 'Đảo Phú Quốc · Điểm hẹn Tuần lễ Cấp cao APEC 2027',
        subcaption:
          'Trục kết nối địa kinh tế và chuyển giao quyền chủ nhà APEC giữa hai nền kinh tế láng giềng',
      };

  return (
    <AbsoluteFill>
      <CinematicStage
        camPos={camPos}
        lookAt={lookAt}
        fov={36}
        accentColor={PALETTE.cyan}
        rimColor={PALETTE.gold}
        background="radial-gradient(ellipse at 54% 44%, #132948 0%, #071122 56%, #02060e 100%)"
        particleCount={320}
      >
        <EarthGlobe3D
          position={[0, 0.35, 0]}
          radius={2.55}
          spinSpeed={0.0005}
          activeRoute={activeRoute}
          highlightHub={highlightHub}
          showAtmosphere
          showRings
        />

        {/* 3D Floating Orbital Milestone Markers (kept well inside 16:9 safe area) */}
        <ExtrudedLabel3D
          text="2026"
          position={[2.95, 1.95, 0.25]}
          rotation={[0, -0.25, 0]}
          size={0.48}
          depth={0.14}
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={0.28}
          revealFrame={6}
          subtleFloat
        />
        <ExtrudedLabel3D
          text="2027"
          position={[-2.75, -0.25, 0.45]}
          rotation={[0, 0.28, 0]}
          size={0.48}
          depth={0.14}
          color={PALETTE.cyan}
          emissive={PALETTE.cyan}
          emissiveIntensity={0.28}
          revealFrame={18}
          subtleFloat
        />

        {isRecap && (
          <ExtrudedLabel3D
            text="$350B"
            position={[0.05, 2.7, -1.2]}
            size={0.44}
            depth={0.13}
            color={PALETTE.white}
            emissive={PALETTE.coral}
            emissiveIntensity={0.24}
            revealFrame={30}
            subtleFloat
          />
        )}

        {/* Background parallax documentary photo accents kept fully inside viewport */}
        <PhotoFrame3D
          src="shenzhen.webp"
          position={[4.25, 0.55, -2.8]}
          rotation={[0, -0.45, 0]}
          width={2.55}
          height={1.45}
          accentColor={PALETTE.gold}
          floatPhase={0.4}
        />
        <PhotoFrame3D
          src="phuquoc.webp"
          position={[-4.25, 0.95, -2.6]}
          rotation={[0, 0.45, 0]}
          width={2.55}
          height={1.45}
          accentColor={PALETTE.cyan}
          floatPhase={2.2}
        />
      </CinematicStage>

      <FloatingHUD
        kicker={hud.kicker}
        caption={hud.caption}
        subcaption={hud.subcaption}
        credit="Dữ liệu địa lý · Trục APEC 2026–2027"
        accentColor={beat === 2 ? PALETTE.cyan : PALETTE.gold}
        progress={p}
      />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  2. PhotoGalleryFlythrough3D (9 documentary photo-led 3D gallery scenes)   */
/* -------------------------------------------------------------------------- */

interface GalleryBeatSpec {
  photo: string;
  stat3D: string;
  statColor: string;
  caption: string;
  subcaption: string;
}

interface GalleryShotConfig {
  kicker: string;
  accent: string;
  beats: [GalleryBeatSpec, GalleryBeatSpec, GalleryBeatSpec];
}

const GALLERY_CONFIGS: Record<string, GalleryShotConfig> = {
  hook: {
    kicker: 'TÀI LIỆU PHÂN TÍCH · THÂM QUYẾN 11/2026',
    accent: PALETTE.gold,
    beats: [
      {
        photo: 'shenzhen',
        stat3D: 'APEC 2026',
        statColor: PALETTE.gold,
        caption: 'Thâm Quyến đón Tuần lễ Cấp cao APEC lần thứ 33',
        subcaption: '18–19/11/2026 · Tâm điểm ngoại giao kinh tế châu Á – Thái Bình Dương',
      },
      {
        photo: 'apec2026',
        stat3D: '21 / 21',
        statColor: PALETTE.cyan,
        caption: 'Việt Nam tiếp nhận trọng trách chủ nhà APEC 2027',
        subcaption: 'Chuyển giao trực tiếp từ Thâm Quyến tới đảo Phú Quốc',
      },
      {
        photo: 'civic',
        stat3D: '2026 -> 2027',
        statColor: PALETTE.coral,
        caption: 'Cái bắt tay này thực chất đến đâu và bài toán nào chờ phía trước?',
        subcaption: 'Ba trụ cột: Ngoại giao · Thương mại ~350 tỷ USD · Hạ tầng xuyên biên giới',
      },
    ],
  },
  shenzhen: {
    kicker: 'CHỦ NHÀ APEC 2026 · THÂM QUYẾN',
    accent: PALETTE.cyan,
    beats: [
      {
        photo: 'civic',
        stat3D: '21 / 21',
        statColor: PALETTE.gold,
        caption: 'Đầy đủ 21 nền kinh tế thành viên hội tụ tại Thâm Quyến',
        subcaption: 'Trung tâm công nghệ, tài chính và đổi mới sáng tạo miền nam Trung Quốc',
      },
      {
        photo: 'shenzhen',
        stat3D: '18-19/11',
        statColor: PALETTE.cyan,
        caption: 'Tuyên bố “Triển vọng Thâm Quyến” định hình chương trình nghị sự',
        subcaption: 'Chủ đề: Xây dựng cộng đồng châu Á – Thái Bình Dương cùng thịnh vượng',
      },
      {
        photo: 'gba',
        stat3D: 'FTAAP',
        statColor: PALETTE.gold,
        caption: 'Kinh tế số, AI, chuyển đổi xanh và tiến tới FTAAP',
        subcaption: 'Mở đường cho Việt Nam kế thừa và dẫn dắt nghị sự năm 2027',
      },
    ],
  },
  summit: {
    kicker: 'HỘI ĐÀM CẤP CAO · NGÀY 17/11/2026',
    accent: PALETTE.gold,
    beats: [
      {
        photo: 'apec2026',
        stat3D: '17/11/2026',
        statColor: PALETTE.gold,
        caption: 'Hội đàm Tô Lâm – Tập Cận Bình bên lề APEC 33',
        subcaption: 'Nguồn: Báo Chính phủ, TTXVN / VietnamPlus (11/2026)',
      },
      {
        photo: 'greathall',
        stat3D: '2ND / 2026',
        statColor: PALETTE.cyan,
        caption: 'Chuyến thăm Trung Quốc thứ hai trong cùng năm 2026',
        subcaption: 'Duy trì nhịp tiếp xúc chiến lược dày đặc ở cấp cao nhất hai Đảng, hai Nhà nước',
      },
      {
        photo: 'palace',
        stat3D: '3 PILLARS',
        statColor: PALETTE.gold,
        caption: 'Tin cậy chiến lược · Thương mại cân bằng · Kết nối Vùng Vịnh Lớn',
        subcaption: 'Khẳng định ủng hộ Việt Nam tổ chức thành công Năm APEC 2027',
      },
    ],
  },
  people: {
    kicker: 'NGOẠI GIAO HAI KÊNH · LÃNH ĐẠO & VĂN HÓA',
    accent: PALETTE.cyan,
    beats: [
      {
        photo: 'palace',
        stat3D: 'TRACK 01',
        statColor: PALETTE.gold,
        caption: 'Kênh cấp cao giữ ổn định tổng thể và định hướng chiến lược',
        subcaption: 'Tạo khung tin cậy chính trị cho hợp tác kinh tế và địa phương',
      },
      {
        photo: 'hanoi',
        stat3D: 'TRACK 02',
        statColor: PALETTE.cyan,
        caption: 'Ngoại giao văn hóa & giao lưu nhân dân bồi đắp nền tảng tin cậy',
        subcaption: 'Hoạt động giao lưu giữa Phu nhân Ngô Phương Ly và Phu nhân Bành Lệ Viên',
      },
      {
        photo: 'civic',
        stat3D: 'STABILITY',
        statColor: PALETTE.gold,
        caption: 'Vùng đệm đối thoại cho doanh nghiệp và chuỗi cung ứng hai nước',
        subcaption: 'Kết hợp mềm dẻo giữa ngoại giao nhà nước và gắn kết xã hội',
      },
    ],
  },
  exports_vn: {
    kicker: 'XUẤT KHẨU VIỆT NAM SANG TRUNG QUỐC · 10T/2026',
    accent: PALETTE.cyan,
    beats: [
      {
        photo: 'haiphong',
        stat3D: '$77.5B',
        statColor: PALETTE.cyan,
        caption: 'Xuất khẩu 10 tháng 2026 đạt 77,52 tỷ USD (+36,2%)',
        subcaption: 'Máy tính, linh kiện điện tử và điện thoại dẫn dắt đà tăng hai chữ số',
      },
      {
        photo: 'durian',
        stat3D: '+36.2%',
        statColor: PALETTE.gold,
        caption: 'Nông sản chính ngạch mở rộng thị phần qua nghị định thư',
        subcaption: 'Sầu riêng, rau quả, thủy sản và gạo đi thẳng vào hệ thống phân phối lớn',
      },
      {
        photo: 'border',
        stat3D: 'OFFICIAL',
        statColor: PALETTE.cyan,
        caption: 'Chuyển từ tiểu ngạch sang chính ngạch để giảm rủi ro biên giới',
        subcaption: 'Động lực thực tế giúp kéo dần cán cân thương mại song phương',
      },
    ],
  },
  gba_link: {
    kicker: 'VÙNG VỊNH LỚN QUẢNG ĐÔNG – HỒNG KÔNG – MA CAO',
    accent: PALETTE.blue,
    beats: [
      {
        photo: 'gba',
        stat3D: 'GBA LINK',
        statColor: PALETTE.cyan,
        caption: 'Kết nối trực tiếp miền Bắc Việt Nam với cụm Vùng Vịnh Lớn',
        subcaption: 'Quảng Đông – Hồng Kông – Ma Cao: Đầu tàu công nghệ & tài chính khu vực',
      },
      {
        photo: 'shenzhen',
        stat3D: 'AI & TECH',
        statColor: PALETTE.gold,
        caption: 'Liên kết kinh tế số, bán dẫn, đổi mới sáng tạo và tài chính xanh',
        subcaption: 'Trọng tâm mới được nhấn mạnh trong hội đàm ngày 17/11/2026',
      },
      {
        photo: 'haiphong',
        stat3D: 'CORRIDOR',
        statColor: PALETTE.cyan,
        caption: 'Liên thông chuỗi cung ứng từ sản xuất tới cảng biển nước sâu',
        subcaption: 'Rút ngắn khoảng cách giữa cụm công nghiệp miền Bắc và thị trường Hoa Nam',
      },
    ],
  },
  port_hai_phong: {
    kicker: 'CẢNG NƯỚC SÂU LẠCH HUYỆN · HẢI PHÒNG',
    accent: PALETTE.cyan,
    beats: [
      {
        photo: 'haiphong',
        stat3D: 'LACH HUYEN',
        statColor: PALETTE.cyan,
        caption: 'Từ biên giới đất liền Lào Cai ra thẳng cảng nước sâu Lạch Huyện',
        subcaption: 'Mắt xích cuối cùng hoàn thiện hành lang vận tải đa phương thức phía Bắc',
      },
      {
        photo: 'train',
        stat3D: '1,435mm',
        statColor: PALETTE.gold,
        caption: 'Đường sắt điện khí hóa 1.435 mm nối trực tiếp bãi container cảng biển',
        subcaption: 'Đón tàu mẹ xuyên đại dương, giảm mạnh chi phí trung chuyển hàng hóa',
      },
      {
        photo: 'laocai',
        stat3D: 'GATEWAY',
        statColor: PALETTE.cyan,
        caption: 'Cửa ngõ ra biển gần nhất cho khu vực Tây Nam Trung Quốc',
        subcaption: 'Tăng năng lực cạnh tranh logistics cho cả chuỗi xuất nhập khẩu Việt Nam',
      },
    ],
  },
  border_photo: {
    kicker: 'CỬA KHẨU HỮU NGHỊ – HỮU NGHỊ QUAN · QĐ 865/QĐ-TTg',
    accent: PALETTE.gold,
    beats: [
      {
        photo: 'border',
        stat3D: '6 LANES',
        statColor: PALETTE.gold,
        caption: 'Hữu Nghị – Hữu Nghị Quan: Cửa ngõ đường bộ trọng điểm Lạng Sơn',
        subcaption: 'Tháng 11/2025: Khai trương tuyến vận tải chuyên dụng 6 làn xe thông minh',
      },
      {
        photo: 'laocai',
        stat3D: '08 / 2026',
        statColor: PALETTE.cyan,
        caption: 'Đồng bộ kiểm dịch số hóa và khai báo điện tử xuyên biên giới',
        subcaption: 'Thí điểm tại mốc 1119–1120 và 1088/2–1089 theo Quyết định 865/QĐ-TTg',
      },
      {
        photo: 'haiphong',
        stat3D: 'IGV 18-20H',
        statColor: PALETTE.gold,
        caption: 'Cuối 11–12/2026: Thí điểm xe tự hành không người lái IGV ban đêm',
        subcaption: 'Tiến tới thông quan tự động 24/7, xóa điểm nghẽn ùn tắc nông sản mùa vụ',
      },
    ],
  },
  cta: {
    kicker: 'CHỌN CHỦ ĐỀ CHO TẬP PHÂN TÍCH TIẾP THEO',
    accent: PALETTE.gold,
    beats: [
      {
        photo: 'train',
        stat3D: '$11.4B RAIL',
        statColor: PALETTE.gold,
        caption: 'Lựa chọn 1: Giải mã tuyến đường sắt 11 tỷ USD Lào Cai – Hải Phòng',
        subcaption: 'Phân tích kỹ thuật khổ ray 1.435 mm, vốn đầu tư và tác động logistics',
      },
      {
        photo: 'phuquoc',
        stat3D: 'APEC 2027',
        statColor: PALETTE.cyan,
        caption: 'Lựa chọn 2: Cuộc lột xác hạ tầng đảo Phú Quốc đón APEC 2027',
        subcaption: 'Mở rộng sân bay quốc tế, giao thông đảo và cú hích kinh tế du lịch',
      },
      {
        photo: 'pqairport',
        stat3D: '2027',
        statColor: PALETTE.gold,
        caption: 'Bình luận lựa chọn của bạn và đăng ký kênh để đón xem tập tiếp theo',
        subcaption: 'Cảm ơn bạn đã theo dõi phân tích dữ liệu & hạ tầng Việt – Trung',
      },
    ],
  },
};

const GALLERY_SLOTS: { pos: Vec3; rot: Vec3; cam: Vec3; look: Vec3; statPos: Vec3 }[] = [
  {
    pos: [-4.1, 0.45, 0.6],
    rot: [0, 0.22, 0],
    cam: [-2.7, 0.75, 8.6],
    look: [-3.8, 0.45, 0.6],
    statPos: [-4.1, 2.32, 0.72],
  },
  {
    pos: [0.35, 0.55, -2.8],
    rot: [0, -0.05, 0],
    cam: [0.95, 0.85, 5.2],
    look: [0.35, 0.55, -2.8],
    statPos: [0.35, 2.42, -2.68],
  },
  {
    pos: [4.75, 0.45, -5.6],
    rot: [0, -0.24, 0],
    cam: [3.35, 0.75, 2.4],
    look: [4.45, 0.45, -5.6],
    statPos: [4.75, 2.32, -5.48],
  },
];

export const PhotoGalleryFlythrough3D: React.FC<Scene3DCtx> = ({ shot, beat, p, q }) => {
  const cfg = GALLERY_CONFIGS[shot.id] ?? GALLERY_CONFIGS.hook;
  const activeIdx = Math.min(2, beat);
  const nextIdx = Math.min(2, activeIdx + 1);

  // Smooth continuous 3D camera dolly across the 3 angled spatial frames
  const sweep = easeInOutCubic(q);
  const slotA = GALLERY_SLOTS[activeIdx];
  const slotB = GALLERY_SLOTS[nextIdx];

  // Gentle orbital push within each beat + smooth glide toward next frame at beat end
  const glideMix = activeIdx < 2 ? clamp01((q - 0.78) / 0.22) : 0;
  const orbitDriftX = Math.sin(p * Math.PI * 1.4) * 0.38;
  const orbitDriftY = Math.cos(p * Math.PI * 1.1) * 0.12;
  const pushZ = -0.45 * sweep;

  const baseCam = lerpVec3(slotA.cam, slotB.cam, easeInOutCubic(glideMix));
  const camPos: Vec3 = [baseCam[0] + orbitDriftX, baseCam[1] + orbitDriftY, baseCam[2] + pushZ];
  const lookAt = lerpVec3(slotA.look, slotB.look, easeInOutCubic(glideMix));

  const currentBeat = cfg.beats[activeIdx];

  return (
    <AbsoluteFill>
      <CinematicStage
        camPos={camPos}
        lookAt={lookAt}
        fov={36}
        accentColor={cfg.accent}
        rimColor={PALETTE.gold}
        fogNear={14}
        fogFar={38}
        background="radial-gradient(ellipse at 52% 38%, #162a45 0%, #0a1424 58%, #040810 100%)"
      >
        <ReflectiveGridFloor y={-2.05} lineColor="#24476b" subColor="#101f33" />

        {/* Volumetric architectural light shafts */}
        <VolumetricBeam position={[-4.0, 3.8, 0.2]} rotation={[0, 0, -0.18]} color={PALETTE.gold} opacity={0.055} />
        <VolumetricBeam position={[0.4, 4.1, -3.0]} rotation={[0, 0, 0.14]} color={PALETTE.cyan} opacity={0.05} />
        <VolumetricBeam position={[4.7, 3.8, -5.8]} rotation={[0, 0, -0.15]} color={PALETTE.blue} opacity={0.055} />

        {/* 3 Angled 3D Glass/Metal Photo Frames + Clean Centered 3D Metallic Stat Above Active Frame */}
        {cfg.beats.map((b, i) => {
          const slot = GALLERY_SLOTS[i];
          const isFocus = i === activeIdx;
          return (
            <group key={`${shot.id}-${i}`}>
              <PhotoFrame3D
                src={`${b.photo}.webp`}
                position={slot.pos}
                rotation={slot.rot}
                width={4.85}
                height={2.72}
                scale={isFocus ? 1.02 : 0.92}
                accentColor={isFocus ? b.statColor : '#4b6584'}
                floatAmplitude={0.04}
                floatPhase={i * 1.9}
                glow={isFocus}
              />
              {isFocus && (
                <ExtrudedLabel3D
                  text={b.stat3D}
                  position={slot.statPos}
                  rotation={[0, slot.rot[1], 0]}
                  size={0.38}
                  depth={0.11}
                  color={b.statColor}
                  emissive={b.statColor}
                  emissiveIntensity={0.34}
                  revealFrame={shot.cues[i] ?? 0}
                  subtleFloat
                />
              )}
            </group>
          );
        })}
      </CinematicStage>

      <FloatingHUD
        kicker={cfg.kicker}
        caption={currentBeat.caption}
        subcaption={currentBeat.subcaption}
        credit={`Ảnh · ${photoCredits[currentBeat.photo] ?? 'Wikimedia Commons'}`}
        accentColor={currentBeat.statColor}
        progress={p}
      />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  3. TradeMonuments3D (`trade_surge`, `trade_gap`, `supply_chain`)          */
/* -------------------------------------------------------------------------- */

const TradeBar3D: React.FC<{
  x: number;
  z?: number;
  width?: number;
  depth?: number;
  height: number;
  color: string;
  projected?: boolean;
  labelTop: string;
  labelBottom: string;
  floorY: number;
}> = ({
  x,
  z = 0,
  width = 0.96,
  depth = 0.96,
  height,
  color,
  projected = false,
  labelTop,
  labelBottom,
  floorY,
}) => {
  const h = Math.max(0.08, height);
  return (
    <group position={[x, floorY, z]}>
      {/* Metallic base plinth */}
      <mesh position={[0, 0.06, 0]}>
        <boxGeometry args={[width + 0.22, 0.12, depth + 0.22]} />
        <meshPhysicalMaterial color="#18273b" metalness={0.85} roughness={0.25} />
      </mesh>
      {/* Extruded 3D bar monument */}
      <mesh position={[0, h * 0.5 + 0.12, 0]}>
        <boxGeometry args={[width, h, depth]} />
        <meshPhysicalMaterial
          color={color}
          metalness={0.62}
          roughness={0.22}
          clearcoat={0.95}
          emissive={color}
          emissiveIntensity={projected ? 0.32 : 0.16}
          transparent={projected}
          opacity={projected ? 0.78 : 1}
        />
      </mesh>
      {/* Glowing crown cap */}
      <mesh position={[0, h + 0.15, 0]}>
        <boxGeometry args={[width + 0.06, 0.06, depth + 0.06]} />
        <meshBasicMaterial color="#ffffff" />
      </mesh>
      {/* Floating 3D extruded value above bar */}
      <ExtrudedLabel3D
        text={labelTop}
        position={[0, h + 0.62, 0.1]}
        size={0.32}
        depth={0.09}
        color={color}
        emissive={color}
        emissiveIntensity={0.28}
      />
      {/* Year label at plinth front */}
      <ExtrudedLabel3D
        text={labelBottom}
        position={[0, 0.24, depth * 0.5 + 0.52]}
        rotation={[-0.35, 0, 0]}
        size={0.24}
        depth={0.06}
        color={PALETTE.white}
        emissive={PALETTE.blue}
        emissiveIntensity={0.12}
      />
    </group>
  );
};

export const TradeMonuments3D: React.FC<Scene3DCtx> = ({ shot, beat, p }) => {
  const floorY = -1.25;
  const orbitAngle = -0.32 + p * 0.64;
  const camRadius = shot.id === 'supply_chain' ? 12.2 : 11.6;
  const camPos: Vec3 = [
    Math.sin(orbitAngle) * camRadius,
    2.45 + Math.sin(p * Math.PI) * 0.55,
    Math.cos(orbitAngle) * camRadius,
  ];
  const lookAt: Vec3 = [0, -0.15, -0.3];

  if (shot.id === 'trade_surge') {
    const bars = [
      { year: '2024', val: 205.2, top: '$205.2B', col: PALETTE.blue, proj: false },
      { year: '2025', val: 256.4, top: '$256.4B', col: PALETTE.cyan, proj: false },
      { year: '10M/26', val: 290.0, top: '$290B', col: PALETTE.gold, proj: false },
      { year: '2026E', val: 350.0, top: '>$350B', col: PALETTE.coral, proj: true },
    ];
    return (
      <AbsoluteFill>
        <CinematicStage camPos={camPos} lookAt={lookAt} fov={35} accentColor={PALETTE.cyan} rimColor={PALETTE.gold}>
          <ReflectiveGridFloor y={floorY} />
          <VolumetricBeam position={[2.8, 4.2, -1.5]} color={PALETTE.gold} opacity={0.055} />

          {bars.map((b, i) => {
            const grow = easeOutCubic(clamp01((p * 1.65 - i * 0.14) / 0.35));
            const h = (b.val / 350) * 3.35 * grow;
            return (
              <TradeBar3D
                key={b.year}
                x={-3.15 + i * 2.1}
                height={h}
                color={b.col}
                projected={b.proj}
                labelTop={b.top}
                labelBottom={b.year}
                floorY={floorY}
              />
            );
          })}

          {/* 3D Corrugated Shipping Containers in foreground */}
          <CorrugatedContainer3D position={[-4.8, floorY + 0.42, 2.3]} rotation={[0, 0.38, 0]} color={PALETTE.cyan} scale={0.78} />
          <CorrugatedContainer3D position={[-4.55, floorY + 1.05, 2.15]} rotation={[0, 0.22, 0]} color={PALETTE.gold} scale={0.78} />
          <CorrugatedContainer3D position={[4.75, floorY + 0.42, 2.1]} rotation={[0, -0.42, 0]} color={PALETTE.coral} scale={0.78} />

          {/* Background Port Photo in 3D depth */}
          <PhotoFrame3D
            src="haiphong.webp"
            position={[0.4, 1.35, -5.6]}
            rotation={[0, -0.08, 0]}
            width={5.4}
            height={3.05}
            accentColor={PALETTE.gold}
            floatAmplitude={0.03}
          />
        </CinematicStage>

        <FloatingHUD
          kicker="KIM NGẠCH THƯƠNG MẠI VIỆT – TRUNG · TỔNG CỤC HẢI QUAN"
          caption={
            beat === 0
              ? 'Từ 205,2 tỷ (2024) lên 256,4 tỷ USD (2025)'
              : beat === 1
                ? '10 tháng đầu 2026 chạm ~290 tỷ USD (+39,3%)'
                : 'Cả năm 2026 dự báo vượt mốc 350 tỷ USD'
          }
          subcaption="Trung Quốc duy trì vị thế đối tác thương mại lớn nhất của Việt Nam"
          credit={`Ảnh · ${photoCredits.haiphong}`}
          accentColor={PALETTE.gold}
          progress={p}
        />
      </AbsoluteFill>
    );
  }

  if (shot.id === 'trade_gap') {
    const groups = [
      { yr: '2024', exp: 61.2, imp: 144.0, def: '-$82.8B' },
      { yr: '2025', exp: 70.4, imp: 186.0, def: '-$115.6B' },
      { yr: '10M/26', exp: 77.5, imp: 212.5, def: '-$134.9B' },
    ];
    return (
      <AbsoluteFill>
        <CinematicStage camPos={camPos} lookAt={lookAt} fov={35} accentColor={PALETTE.coral} rimColor={PALETTE.cyan}>
          <ReflectiveGridFloor y={floorY} lineColor="#59333a" subColor="#1d1826" />
          <VolumetricBeam position={[2.6, 4.0, -1.0]} color={PALETTE.coral} opacity={0.06} />

          {groups.map((g, i) => {
            const grow = easeOutCubic(clamp01((p * 1.6 - i * 0.16) / 0.35));
            const gx = -3.3 + i * 3.3;
            const hExp = (g.exp / 220) * 3.7 * grow;
            const hImp = (g.imp / 220) * 3.7 * grow;
            return (
              <group key={g.yr}>
                <TradeBar3D
                  x={gx - 0.56}
                  z={0.2}
                  width={0.78}
                  depth={0.78}
                  height={hExp}
                  color={PALETTE.cyan}
                  labelTop={`$${g.exp.toFixed(1)}B`}
                  labelBottom={g.yr}
                  floorY={floorY}
                />
                <TradeBar3D
                  x={gx + 0.56}
                  z={-0.2}
                  width={0.78}
                  depth={0.78}
                  height={hImp}
                  color={PALETTE.coral}
                  labelTop={`$${g.imp.toFixed(1)}B`}
                  labelBottom={g.def}
                  floorY={floorY}
                />
              </group>
            );
          })}

          <ExtrudedLabel3D
            text="-$134.9B"
            position={[0.2, 2.75, -3.4]}
            size={0.68}
            depth={0.18}
            color={PALETTE.coral}
            emissive={PALETTE.coral}
            emissiveIntensity={0.34}
            revealFrame={12}
            subtleFloat
          />
        </CinematicStage>

        <FloatingHUD
          kicker="MẶT TRÁI CỦA KỶ LỤC · BÀI TOÁN NHẬP SIÊU"
          caption={
            beat === 0
              ? 'Nhập khẩu tăng nhanh hơn xuất khẩu qua 3 năm liên tiếp'
              : beat === 1
                ? 'Thâm hụt 10 tháng 2026 lên tới 134,94 tỷ USD'
                : 'Yêu cầu cấp thiết: Đưa thương mại song phương về thế cân bằng hơn'
          }
          subcaption="Cột xanh: Việt Nam xuất khẩu · Cột đỏ: Nhập khẩu từ Trung Quốc (Nguồn: Tổng cục Hải quan)"
          accentColor={PALETTE.coral}
          progress={p}
        />
      </AbsoluteFill>
    );
  }

  // supply_chain: 3D industrial hubs + corrugated containers + glowing supply-chain flow tubes
  const hubPos: Vec3[] = [
    [-4.3, floorY + 0.2, 0.6],
    [0.0, floorY + 0.2, -0.8],
    [4.3, floorY + 0.2, 0.6],
  ];
  const hubMeta = [
    { tag: 'CHINA INPUTS', col: PALETTE.coral, h: 1.65 },
    { tag: 'VIETNAM MFG', col: PALETTE.gold, h: 2.1 },
    { tag: 'GLOBAL EXPORT', col: PALETTE.cyan, h: 1.85 },
  ];

  return (
    <AbsoluteFill>
      <CinematicStage camPos={camPos} lookAt={[0, 0.1, 0]} fov={36} accentColor={PALETTE.gold} rimColor={PALETTE.cyan}>
        <ReflectiveGridFloor y={floorY} />
        <VolumetricBeam position={[0, 4.2, -0.8]} color={PALETTE.gold} opacity={0.055} />

        {hubPos.map((pos, i) => {
          const meta = hubMeta[i];
          const isFocus = beat === i;
          return (
            <group key={meta.tag} position={pos}>
              {/* Hexagonal platform base */}
              <mesh position={[0, 0.12, 0]}>
                <cylinderGeometry args={[1.45, 1.62, 0.24, 6]} />
                <meshPhysicalMaterial
                  color="#16263b"
                  metalness={0.82}
                  roughness={0.25}
                  emissive={meta.col}
                  emissiveIntensity={isFocus ? 0.22 : 0.05}
                />
              </mesh>
              {/* Glowing ring rim */}
              <mesh position={[0, 0.26, 0]} rotation={[-Math.PI / 2, 0, 0]}>
                <ringGeometry args={[1.38, 1.52, 32]} />
                <meshBasicMaterial color={meta.col} side={THREE.DoubleSide} />
              </mesh>
              {/* Central industrial core tower */}
              <mesh position={[0, meta.h * 0.5 + 0.24, 0]}>
                <boxGeometry args={[0.92, meta.h, 0.92]} />
                <meshPhysicalMaterial
                  color={meta.col}
                  metalness={0.68}
                  roughness={0.24}
                  clearcoat={0.9}
                  emissive={meta.col}
                  emissiveIntensity={isFocus ? 0.28 : 0.12}
                />
              </mesh>
              {/* Stacked corrugated containers around hub */}
              <CorrugatedContainer3D position={[-0.7, 0.52, 0.95]} rotation={[0, 0.25, 0]} color={meta.col} scale={0.48} />
              <CorrugatedContainer3D position={[0.72, 0.52, 0.85]} rotation={[0, -0.3, 0]} color={PALETTE.white} scale={0.44} />

              <ExtrudedLabel3D
                text={meta.tag}
                position={[0, meta.h + 0.85, 0]}
                size={0.28}
                depth={0.08}
                color={meta.col}
                emissive={meta.col}
                emissiveIntensity={0.25}
              />
            </group>
          );
        })}

        {/* Glowing 3D Supply-Chain Flow Tubes with animated cargo packets */}
        <GlowingFlowTube
          points={[
            [-3.4, floorY + 1.5, 0.5],
            [-2.1, floorY + 2.7, -0.3],
            [-0.7, floorY + 1.8, -0.7],
          ]}
          color={PALETTE.coral}
          radius={0.055}
          packetCount={4}
          speed={0.015}
        />
        <GlowingFlowTube
          points={[
            [0.7, floorY + 1.8, -0.7],
            [2.1, floorY + 2.8, -0.2],
            [3.4, floorY + 1.6, 0.5],
          ]}
          color={PALETTE.cyan}
          radius={0.055}
          packetCount={4}
          speed={0.015}
        />
      </CinematicStage>

      <FloatingHUD
        kicker="CƠ CHẾ CHUỖI CUNG ỨNG · VÌ SAO NHẬP KHẨU LỚN?"
        caption={
          beat === 0
            ? 'Bước 1: Máy móc, linh kiện điện tử & nguyên liệu từ Trung Quốc'
            : beat === 1
              ? 'Bước 2: Lắp ráp & hoàn thiện tại Bắc Ninh, Hải Phòng, TP.HCM'
              : 'Bước 3: Xuất khẩu thành phẩm công nghiệp sang Mỹ, EU và toàn cầu'
        }
        subcaption="Nhập siêu chủ yếu phục vụ đầu vào sản xuất — ổn định biên giới quyết định nhịp nhà máy mỗi ngày"
        accentColor={beat === 0 ? PALETTE.coral : beat === 1 ? PALETTE.gold : PALETTE.cyan}
        progress={p}
      />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  4. RailViaduct3D (`rail_bottleneck`, `rail_map`, `rail_specs`, `rail_network`) */
/* -------------------------------------------------------------------------- */

const RailTrackAssembly3D: React.FC<{
  x: number;
  gaugeWidth: number;
  accent: string;
  length?: number;
}> = ({ x, gaugeWidth, accent, length = 14 }) => {
  const sleeperCount = 22;
  const sleepers = useMemo(
    () => Array.from({ length: sleeperCount }, (_, i) => -length / 2 + (i + 0.5) * (length / sleeperCount)),
    [length],
  );
  const half = gaugeWidth * 0.5;
  return (
    <group position={[x, 0, 0]}>
      {/* Gravel ballast bed */}
      <mesh position={[0, -0.24, 0]}>
        <boxGeometry args={[gaugeWidth + 1.15, 0.32, length]} />
        <meshStandardMaterial color="#1d2b3c" roughness={0.92} metalness={0.12} />
      </mesh>
      {/* Concrete sleepers */}
      {sleepers.map((z, idx) => (
        <mesh key={idx} position={[0, -0.02, z]}>
          <boxGeometry args={[gaugeWidth + 0.65, 0.12, 0.24]} />
          <meshStandardMaterial color="#58697c" roughness={0.72} metalness={0.18} />
        </mesh>
      ))}
      {/* Dual gleaming steel rails */}
      {[-half, half].map((rx, idx) => (
        <group key={idx} position={[rx, 0.14, 0]}>
          <mesh>
            <boxGeometry args={[0.09, 0.18, length]} />
            <meshPhysicalMaterial
              color={accent}
              metalness={0.92}
              roughness={0.16}
              clearcoat={1}
              emissive={accent}
              emissiveIntensity={0.22}
            />
          </mesh>
        </group>
      ))}
      {/* Glowing caliper beam showing exact gauge */}
      <mesh position={[0, 0.68, 1.4]}>
        <boxGeometry args={[gaugeWidth, 0.045, 0.045]} />
        <meshBasicMaterial color={PALETTE.gold} />
      </mesh>
      {[-half, half].map((rx, idx) => (
        <mesh key={`cap-${idx}`} position={[rx, 0.45, 1.4]}>
          <boxGeometry args={[0.04, 0.48, 0.04]} />
          <meshBasicMaterial color={PALETTE.gold} />
        </mesh>
      ))}
    </group>
  );
};

const ArticulatedTrain3D: React.FC<{ zPos: number; x?: number; y?: number }> = ({
  zPos,
  x = 0,
  y = 0.25,
}) => {
  const cars = [0, -3.55, -7.1, -10.65];
  return (
    <group position={[x, y, zPos]}>
      {cars.map((cz, i) => (
        <group key={i} position={[0, 0, cz]}>
          {/* Main sleek car body */}
          <mesh position={[0, 0.56, 0]}>
            <boxGeometry args={[1.18, 0.92, 3.3]} />
            <meshPhysicalMaterial
              color="#eef3fa"
              metalness={0.58}
              roughness={0.18}
              clearcoat={1}
            />
          </mesh>
          {/* Teal aerodynamic stripe */}
          <mesh position={[0, 0.38, 0]}>
            <boxGeometry args={[1.21, 0.16, 3.32]} />
            <meshPhysicalMaterial
              color={PALETTE.cyan}
              metalness={0.5}
              roughness={0.2}
              emissive={PALETTE.cyan}
              emissiveIntensity={0.35}
            />
          </mesh>
          {/* Dark tinted ribbon windows */}
          <mesh position={[0, 0.68, 0]}>
            <boxGeometry args={[1.2, 0.26, 2.95]} />
            <meshPhysicalMaterial color="#0b1524" metalness={0.85} roughness={0.08} clearcoat={1} />
          </mesh>
          {/* Bogie undercarriage */}
          <mesh position={[0, 0.06, 0]}>
            <boxGeometry args={[1.02, 0.18, 2.9]} />
            <meshStandardMaterial color="#1f2c3d" metalness={0.7} roughness={0.45} />
          </mesh>
          {/* Aerodynamic nose cone + glowing headlights on lead car */}
          {i === 0 && (
            <group position={[0, 0.48, 1.98]}>
              <mesh rotation={[Math.PI / 2, 0, 0]}>
                <coneGeometry args={[0.64, 1.15, 6]} />
                <meshPhysicalMaterial color="#eef3fa" metalness={0.62} roughness={0.16} clearcoat={1} />
              </mesh>
              <mesh position={[-0.32, -0.05, 0.25]}>
                <sphereGeometry args={[0.075, 10, 10]} />
                <meshBasicMaterial color="#fff3c4" />
              </mesh>
              <mesh position={[0.32, -0.05, 0.25]}>
                <sphereGeometry args={[0.075, 10, 10]} />
                <meshBasicMaterial color="#fff3c4" />
              </mesh>
            </group>
          )}
          {/* Roof pantograph on car 1 */}
          {i === 1 && (
            <group position={[0, 1.18, 0]}>
              <mesh rotation={[0.45, 0, 0]}>
                <boxGeometry args={[0.06, 0.55, 0.06]} />
                <meshStandardMaterial color={PALETTE.gold} metalness={0.85} roughness={0.25} />
              </mesh>
              <mesh position={[0, 0.25, 0]}>
                <boxGeometry args={[0.68, 0.04, 0.08]} />
                <meshBasicMaterial color={PALETTE.gold} />
              </mesh>
            </group>
          )}
        </group>
      ))}
    </group>
  );
};

const TiltedRailMap3D: React.FC<{ maps: MapIndexData }> = ({ maps }) => {
  const mapTex = usePhotoTexture('map-rail.webp');
  const planeW = 9.2;
  const planeH = 6.0;

  const order = ['laocai', 'phutho', 'hanoi', 'bacninh', 'hungyen', 'haiphong', 'lachhuyen'];
  const splinePts: Vec3[] = useMemo(() => {
    return order.map((k) => {
      const pt = maps.rail[k] ?? [500, 325];
      const u = pt[0] / 1000 - 0.5;
      const v = pt[1] / 650 - 0.5;
      return [u * planeW, 0.22, v * planeH];
    });
  }, [maps.rail]);

  return (
    <group rotation={[0.44, -0.18, 0]} position={[0, -0.35, 0]}>
      {/* Metallic architectural terrain table base */}
      <mesh position={[0, -0.16, 0]}>
        <boxGeometry args={[planeW + 0.35, 0.24, planeH + 0.35]} />
        <meshPhysicalMaterial color="#132236" metalness={0.84} roughness={0.26} clearcoat={0.7} />
      </mesh>
      {/* OpenStreetMap texture plane */}
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial map={mapTex} toneMapped={false} />
      </mesh>
      {/* Glowing elevated 3D railway spline above the OSM map */}
      <GlowingFlowTube points={splinePts} color={PALETTE.coral} radius={0.065} packetCount={5} speed={0.016} />
      {/* Pulsing 3D station pillars */}
      {splinePts.map((pt, i) => (
        <group key={i} position={[pt[0], 0, pt[2]]}>
          <mesh position={[0, 0.24, 0]}>
            <cylinderGeometry args={[0.06, 0.1, 0.48, 12]} />
            <meshBasicMaterial color={i === 0 || i === splinePts.length - 1 ? PALETTE.gold : PALETTE.coral} />
          </mesh>
          <mesh position={[0, 0.52, 0]}>
            <sphereGeometry args={[0.11, 12, 12]} />
            <meshBasicMaterial color="#ffffff" />
          </mesh>
        </group>
      ))}
    </group>
  );
};

export const RailViaduct3D: React.FC<Scene3DCtx> = ({ shot, beat, p, q, maps }) => {
  // Mode A: 1,000 mm vs 1,435 mm 3D gauge cutaway comparison
  if (shot.id === 'rail_bottleneck') {
    const camPos: Vec3 =
      beat === 0
        ? lerpVec3([-3.2, 2.3, 6.8], [-1.6, 1.7, 5.4], easeInOutCubic(q))
        : beat === 1
          ? lerpVec3([-1.6, 1.7, 5.4], [2.4, 1.85, 5.6], easeInOutCubic(q))
          : lerpVec3([2.4, 1.85, 5.6], [0.0, 2.7, 7.6], easeInOutCubic(q));
    return (
      <AbsoluteFill>
        <CinematicStage camPos={camPos} lookAt={[0, 0.3, -0.6]} fov={36} accentColor={PALETTE.cyan} rimColor={PALETTE.coral}>
          <ReflectiveGridFloor y={-0.65} />
          <RailTrackAssembly3D x={-2.25} gaugeWidth={1.12} accent={PALETTE.coral} />
          <RailTrackAssembly3D x={2.25} gaugeWidth={1.62} accent={PALETTE.cyan} />

          <ExtrudedLabel3D
            text="1,000 mm"
            position={[-2.25, 1.55, 0.8]}
            size={0.42}
            depth={0.12}
            color={PALETTE.coral}
            emissive={PALETTE.coral}
            emissiveIntensity={0.3}
          />
          <ExtrudedLabel3D
            text="1,435 mm"
            position={[2.25, 1.55, 0.8]}
            size={0.42}
            depth={0.12}
            color={PALETTE.cyan}
            emissive={PALETTE.cyan}
            emissiveIntensity={0.3}
          />
          <ExtrudedLabel3D
            text="GAP 435 mm"
            position={[0, 2.35, -1.6]}
            size={0.38}
            depth={0.11}
            color={PALETTE.gold}
            emissive={PALETTE.gold}
            emissiveIntensity={0.28}
            revealFrame={shot.cues[2] ?? 320}
          />
        </CinematicStage>

        <FloatingHUD
          kicker="MÔ PHỎNG KỸ THUẬT 3D · SO SÁNH KHỔ ĐƯỜNG RAY"
          caption={
            beat === 0
              ? 'Nút thắt lịch sử: Khổ ray 1.000 mm hiện hữu tại miền Bắc'
              : beat === 1
                ? 'Khổ tiêu chuẩn quốc tế 1.435 mm của mạng lưới Trung Quốc'
                : 'Lệch 435 mm buộc tàu hàng phải dừng chuyển tải tại biên giới'
          }
          subcaption="Minh họa nguyên lý kỹ thuật giải thích vì sao cần đầu tư tuyến đường sắt khổ chuẩn mới"
          accentColor={beat === 1 ? PALETTE.cyan : PALETTE.coral}
          progress={p}
        />
      </AbsoluteFill>
    );
  }

  // Mode B: 3D Tilted OpenStreetMap Terrain Slab + Elevated Glowing Rail Spline
  if (shot.id === 'rail_map') {
    const camPos: Vec3 = lerpVec3([-1.4, 5.2, 7.6], [1.6, 4.1, 6.4], easeInOutCubic(p));
    return (
      <AbsoluteFill>
        <CinematicStage camPos={camPos} lookAt={[0, 0.0, 0]} fov={36} accentColor={PALETTE.coral} rimColor={PALETTE.gold}>
          <ReflectiveGridFloor y={-2.3} />
          <TiltedRailMap3D maps={maps} />
          <ExtrudedLabel3D
            text="391 km"
            position={[-3.3, 2.15, -1.8]}
            rotation={[0, 0.25, 0]}
            size={0.58}
            depth={0.15}
            color={PALETTE.gold}
            emissive={PALETTE.gold}
            emissiveIntensity={0.28}
            subtleFloat
          />
          <PhotoFrame3D
            src="laocai.webp"
            position={[4.6, 1.85, -3.4]}
            rotation={[0, -0.42, 0]}
            width={3.4}
            height={1.92}
            accentColor={PALETTE.coral}
          />
        </CinematicStage>

        <FloatingHUD
          kicker="BẢN ĐỒ HÀNH LANG 3D · LÀO CAI – HÀ NỘI – HẢI PHÒNG"
          caption={
            beat === 0
              ? 'Đấu nối trực tiếp tại Lào Cai với mạng lưới đường sắt Vân Nam'
              : beat === 1
                ? 'Đi qua 6 địa phương: Phú Thọ, Hà Nội, Bắc Ninh, Hưng Yên'
                : 'Chiều dài ~391 km nối thẳng ra cảng nước sâu Lạch Huyện'
          }
          subcaption="Bản đồ OpenStreetMap định vị hướng tuyến hành lang · © OpenStreetMap contributors"
          credit={`Ảnh · ${photoCredits.laocai}`}
          accentColor={PALETTE.coral}
          progress={p}
        />
      </AbsoluteFill>
    );
  }

  // Mode C: Full 3D Electrified Railway Viaduct + Gliding Articulated Train (`rail_specs` & `rail_network`)
  const isNetwork = shot.id === 'rail_network';
  const trainZ = -10 + ((p * 1.45) % 1) * 28;
  const camPos: Vec3 = [
    5.6 - p * 1.6,
    2.65 + Math.sin(p * Math.PI) * 0.65,
    trainZ * 0.42 + 6.4,
  ];
  const lookAt: Vec3 = [0, 1.05, trainZ * 0.42 - 1.2];

  const piers = [-14, -7, 0, 7, 14];
  const poles = [-12, -6, 0, 6, 12];

  return (
    <AbsoluteFill>
      <CinematicStage camPos={camPos} lookAt={lookAt} fov={37} accentColor={PALETTE.cyan} rimColor={PALETTE.gold}>
        <ReflectiveGridFloor y={-2.8} size={60} divisions={44} />
        <VolumetricBeam position={[-2.4, 4.5, 0]} color={PALETTE.cyan} opacity={0.055} />

        {/* Concrete Viaduct Piers & Flared Caps */}
        {piers.map((pz) => (
          <group key={pz} position={[0, -1.65, pz]}>
            <mesh>
              <boxGeometry args={[0.92, 2.3, 0.85]} />
              <meshStandardMaterial color="#2a3d52" roughness={0.78} metalness={0.2} />
            </mesh>
            <mesh position={[0, 1.15, 0]}>
              <boxGeometry args={[2.55, 0.34, 1.15]} />
              <meshStandardMaterial color="#3c536c" roughness={0.68} metalness={0.25} />
            </mesh>
          </group>
        ))}

        {/* Continuous Box-Girder Viaduct Deck */}
        <mesh position={[0, -0.22, 0]}>
          <boxGeometry args={[3.0, 0.42, 40]} />
          <meshPhysicalMaterial color="#2e445c" metalness={0.4} roughness={0.55} />
        </mesh>
        {/* Glowing Side Safety Parapets */}
        {[-1.46, 1.46].map((px, i) => (
          <mesh key={i} position={[px, 0.16, 0]}>
            <boxGeometry args={[0.12, 0.34, 40]} />
            <meshPhysicalMaterial color="#6e89a6" metalness={0.72} roughness={0.3} />
          </mesh>
        ))}

        {/* Dual Standard-Gauge 1,435 mm Steel Rails */}
        <RailTrackAssembly3D x={0} gaugeWidth={1.18} accent={PALETTE.cyan} length={38} />

        {/* Overhead Electrified Catenary Masts & Contact Wire */}
        {poles.map((pz) => (
          <group key={pz} position={[-1.38, 0.0, pz]}>
            <mesh position={[0, 1.45, 0]}>
              <boxGeometry args={[0.1, 2.9, 0.1]} />
              <meshStandardMaterial color="#8fa6bf" metalness={0.85} roughness={0.25} />
            </mesh>
            <mesh position={[0.78, 2.55, 0]}>
              <boxGeometry args={[1.65, 0.07, 0.07]} />
              <meshStandardMaterial color={PALETTE.gold} metalness={0.85} roughness={0.22} />
            </mesh>
          </group>
        ))}
        {/* Overhead Contact Wire */}
        <mesh position={[0, 2.46, 0]}>
          <boxGeometry args={[0.03, 0.03, 38]} />
          <meshBasicMaterial color={PALETTE.gold} />
        </mesh>

        {/* Sleek Articulated 3D Electrified Train Gliding Along Viaduct */}
        <ArticulatedTrain3D zPos={trainZ} />

        {/* Floating 3D Extruded Specs clearly above the catenary wire & inside safe area */}
        {!isNetwork ? (
          <>
            <ExtrudedLabel3D text="1,435 mm" position={[-0.4, 3.35, -3.4]} rotation={[0, 0.36, 0]} size={0.44} depth={0.13} color={PALETTE.cyan} emissive={PALETTE.cyan} emissiveIntensity={0.3} />
            <ExtrudedLabel3D text="160 km/h" position={[-0.4, 3.35, 1.8]} rotation={[0, 0.36, 0]} size={0.44} depth={0.13} color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.3} />
            <ExtrudedLabel3D text="$11.4B" position={[-0.4, 3.35, 7.2]} rotation={[0, 0.36, 0]} size={0.48} depth={0.14} color={PALETTE.coral} emissive={PALETTE.coral} emissiveIntensity={0.32} />
          </>
        ) : (
          <>
            <ExtrudedLabel3D text="3 LINES" position={[-0.4, 3.35, -2.5]} rotation={[0, 0.36, 0]} size={0.46} depth={0.13} color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.3} />
            <ExtrudedLabel3D text="2025 -> 2030" position={[-0.4, 3.35, 3.6]} rotation={[0, 0.36, 0]} size={0.42} depth={0.12} color={PALETTE.cyan} emissive={PALETTE.cyan} emissiveIntensity={0.3} />
            <PhotoFrame3D src="train.webp" position={[-4.5, 1.55, 1.2]} rotation={[0, 0.52, 0]} width={3.4} height={1.92} accentColor={PALETTE.cyan} />
          </>
        )}
      </CinematicStage>

      <FloatingHUD
        kicker={
          isNetwork
            ? 'MẠNG LƯỚI 3 TUYẾN KHỔ CHUẨN PHÍA BẮC · 2025–2030'
            : 'MÔ PHỎNG CẦU CẠN ĐIỆN KHÍ HÓA 3D · LÀO CAI – HẢI PHÒNG'
        }
        caption={
          isNetwork
            ? beat === 0
              ? '19/12/2025: Khởi công 5 nhà ga thành phần 1, mục tiêu hoàn thành 2030'
              : beat === 1
                ? 'Tuyến số 2: Đồng Đăng – Hà Nội nối hành lang Lạng Sơn – Quảng Tây'
                : 'Tuyến số 3: Móng Cái – Hạ Long – Hải Phòng dọc hành lang ven biển'
            : beat === 0
              ? 'Khổ tiêu chuẩn 1.435 mm, điện khí hóa, chạy chung tàu khách & tàu hàng'
              : beat === 1
                ? 'Tốc độ thiết kế 160 km/h tuyến chính · 120 km/h khu vực đầu mối Hà Nội'
                : 'Tổng mức đầu tư điều chỉnh (2026): 289,34 nghìn tỷ (~11,1–11,4 tỷ USD)'
        }
        subcaption="Nguồn: Nghị quyết Quốc hội, SGGP, Lao Động · Hình ảnh cầu cạn là mô phỏng kỹ thuật 3D minh họa"
        credit={isNetwork ? `Ảnh · ${photoCredits.train}` : undefined}
        accentColor={PALETTE.cyan}
        progress={p}
      />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  5. SmartBorder3D (`smart_border`)                                         */
/* -------------------------------------------------------------------------- */

const AutonomousIGVTruck3D: React.FC<{
  x: number;
  z: number;
  containerColor: string;
}> = ({ x, z, containerColor }) => (
  <group position={[x, 0, z]}>
    {/* Autonomous IGV low-profile flatbed chassis */}
    <mesh position={[0, 0.24, 0]}>
      <boxGeometry args={[1.05, 0.22, 3.1]} />
      <meshPhysicalMaterial
        color={PALETTE.gold}
        metalness={0.72}
        roughness={0.28}
        clearcoat={0.7}
      />
    </mesh>
    {/* Front LiDAR / 5G Autonomous Sensor Dome */}
    <mesh position={[0, 0.44, 1.32]}>
      <cylinderGeometry args={[0.14, 0.18, 0.2, 16]} />
      <meshBasicMaterial color={PALETTE.cyan} />
    </mesh>
    {/* LED Autonomous Guide Strip */}
    <mesh position={[0, 0.24, 1.56]}>
      <boxGeometry args={[0.88, 0.08, 0.04]} />
      <meshBasicMaterial color={PALETTE.cyan} />
    </mesh>
    {/* Wheels */}
    {[-1.05, 0.95].map((wz, i) => (
      <React.Fragment key={i}>
        <mesh position={[-0.54, 0.14, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.14, 14]} />
          <meshStandardMaterial color="#101824" roughness={0.85} />
        </mesh>
        <mesh position={[0.54, 0.14, wz]} rotation={[0, 0, Math.PI / 2]}>
          <cylinderGeometry args={[0.14, 0.14, 0.14, 14]} />
          <meshStandardMaterial color="#101824" roughness={0.85} />
        </mesh>
      </React.Fragment>
    ))}
    {/* Corrugated Container Mounted on IGV */}
    <CorrugatedContainer3D
      position={[0, 0.78, -0.1]}
      rotation={[0, Math.PI / 2, 0]}
      color={containerColor}
      scale={1.15}
    />
  </group>
);

export const SmartBorder3D: React.FC<Scene3DCtx> = ({ beat, p, localFrame }) => {
  // Smooth camera sweep from establishing 3/4 view down to heroic scanner gantry tracking
  const camPos: Vec3 = lerpVec3([6.8, 4.2, 10.6], [4.0, 2.4, 7.2], easeInOutCubic(p));
  const lookAt: Vec3 = lerpVec3([0, 1.25, -1.0], [0, 1.35, 0.2], easeInOutCubic(p));

  const scanPulse = Math.sin(localFrame * 0.11);
  const scanZ = scanPulse * 0.95;

  const trucks = [
    { x: -2.4, offset: 0.0, col: PALETTE.cyan, speed: 0.11 },
    { x: -0.8, offset: 11.5, col: PALETTE.blue, speed: 0.13 },
    { x: 0.8, offset: 5.2, col: PALETTE.coral, speed: 0.105 },
    { x: 2.4, offset: 16.4, col: PALETTE.cyan, speed: 0.125 },
  ];

  return (
    <AbsoluteFill>
      <CinematicStage camPos={camPos} lookAt={lookAt} fov={37} accentColor={PALETTE.cyan} rimColor={PALETTE.gold}>
        <ReflectiveGridFloor y={-0.08} size={56} divisions={38} />

        {/* 6-Lane Smart Highway Deck */}
        <mesh position={[0, -0.02, 0]}>
          <boxGeometry args={[9.4, 0.12, 36]} />
          <meshStandardMaterial color="#141f2e" roughness={0.82} metalness={0.2} />
        </mesh>
        {/* Illuminated 6-Lane Guide Markings */}
        {[-3.2, -1.6, 0, 1.6, 3.2].map((lx, i) => (
          <mesh key={i} position={[lx, 0.05, 0]}>
            <boxGeometry args={[0.06, 0.015, 34]} />
            <meshBasicMaterial color={i === 2 ? PALETTE.gold : PALETTE.cyan} transparent opacity={0.68} />
          </mesh>
        ))}

        {/* Monumental 3D Smart Scanner Gantry Arch */}
        <group position={[0, 0, 0]}>
          {[-4.85, 4.85].map((gx, i) => (
            <mesh key={i} position={[gx, 2.1, 0]}>
              <boxGeometry args={[0.45, 4.2, 0.95]} />
              <meshPhysicalMaterial color="#1e3148" metalness={0.82} roughness={0.26} clearcoat={0.7} />
            </mesh>
          ))}
          {/* Top Gantry Truss Beam */}
          <mesh position={[0, 4.05, 0]}>
            <boxGeometry args={[10.2, 0.56, 1.15]} />
            <meshPhysicalMaterial color="#17273b" metalness={0.86} roughness={0.22} clearcoat={0.85} />
          </mesh>
          {/* Glowing Cyan Scanner Light Bar */}
          <mesh position={[0, 3.74, 0]}>
            <boxGeometry args={[9.3, 0.09, 0.25]} />
            <meshBasicMaterial color={PALETTE.cyan} />
          </mesh>
          {/* Moving Translucent Laser Scan Sheet */}
          <mesh position={[0, 1.85, scanZ]}>
            <planeGeometry args={[9.1, 3.65]} />
            <meshBasicMaterial
              color={PALETTE.cyan}
              transparent
              opacity={0.18 + 0.08 * Math.abs(scanPulse)}
              side={THREE.DoubleSide}
              depthWrite={false}
            />
          </mesh>
        </group>

        {/* Animated 3D Autonomous IGV Container Trucks */}
        {trucks.map((tr, i) => {
          const z = -14 + ((localFrame * tr.speed + tr.offset) % 28);
          return <AutonomousIGVTruck3D key={i} x={tr.x} z={z} containerColor={tr.col} />;
        })}

        {/* Floating 3D Metallic Telemetry Labels cleanly above gantry top beam + Real Border Gate Photo */}
        <ExtrudedLabel3D
          text="IGV 24/7"
          position={[-2.25, 4.82, 0.35]}
          size={0.46}
          depth={0.13}
          color={PALETTE.cyan}
          emissive={PALETTE.cyan}
          emissiveIntensity={0.34}
        />
        <ExtrudedLabel3D
          text="24H TARGET"
          position={[2.45, 4.82, 0.35]}
          size={0.44}
          depth={0.13}
          color={PALETTE.gold}
          emissive={PALETTE.gold}
          emissiveIntensity={0.3}
        />
        <PhotoFrame3D
          src="border.webp"
          position={[-5.4, 2.55, -8.5]}
          rotation={[0, 0.36, 0]}
          width={4.6}
          height={2.58}
          accentColor={PALETTE.gold}
        />
      </CinematicStage>

      <FloatingHUD
        kicker="MÔ PHỎNG 3D · CỬA KHẨU THÔNG MINH & XE TỰ HÀNH IGV"
        caption={
          beat === 0
            ? 'Khai báo điện tử, mã QR & cổng quét 5G tự động tại mốc 1119–1120'
            : beat === 1
              ? 'Làn chuyên dụng 6 làn cho xe tự hành không người lái (IGV)'
              : 'Mục tiêu dài hạn: Thông quan 24/7, Nam Ninh → Bắc Ninh trong 24 giờ'
        }
        subcaption="Mô phỏng kỹ thuật minh họa cơ chế vận hành cửa khẩu thông minh Hữu Nghị – Hữu Nghị Quan"
        credit={`Ảnh · ${photoCredits.border}`}
        accentColor={PALETTE.cyan}
        progress={p}
      />
    </AbsoluteFill>
  );
};

/* -------------------------------------------------------------------------- */
/*  6. DiplomacyConstellation3D (`scope`, `handover`, `phu_quoc_map`,         */
/*     `multilateral`, `challenges`)                                          */
/* -------------------------------------------------------------------------- */

const TiltedPhuQuocMap3D: React.FC<{ maps: MapIndexData }> = ({ maps }) => {
  const mapTex = usePhotoTexture('map-phuquoc.webp');
  const planeW = 7.4;
  const planeH = 4.9;
  const beacons = [
    { key: 'duongdong', col: PALETTE.cyan },
    { key: 'airport', col: PALETTE.coral },
    { key: 'anthoi', col: PALETTE.gold },
  ];
  return (
    <group rotation={[0.48, 0.22, 0]} position={[-0.75, -0.55, 0.4]}>
      <mesh position={[0, -0.15, 0]}>
        <boxGeometry args={[planeW + 0.3, 0.22, planeH + 0.3]} />
        <meshPhysicalMaterial color="#132236" metalness={0.84} roughness={0.26} clearcoat={0.7} />
      </mesh>
      <mesh rotation={[-Math.PI / 2, 0, 0]} position={[0, -0.02, 0]}>
        <planeGeometry args={[planeW, planeH]} />
        <meshBasicMaterial map={mapTex} toneMapped={false} />
      </mesh>
      {beacons.map((b) => {
        const pt = maps.phuquoc[b.key] ?? [450, 400];
        const x = (pt[0] / 1000 - 0.5) * planeW;
        const z = (pt[1] / 650 - 0.5) * planeH;
        return (
          <group key={b.key} position={[x, 0, z]}>
            <mesh position={[0, 0.32, 0]}>
              <cylinderGeometry args={[0.05, 0.09, 0.64, 12]} />
              <meshBasicMaterial color={b.col} />
            </mesh>
            <mesh position={[0, 0.68, 0]}>
              <sphereGeometry args={[0.12, 14, 14]} />
              <meshBasicMaterial color="#ffffff" />
            </mesh>
          </group>
        );
      })}
    </group>
  );
};

export const DiplomacyConstellation3D: React.FC<Scene3DCtx> = ({ shot, beat, p, localFrame, maps }) => {
  // Mode A: Phu Quoc APEC 2027 3D Tilted Map + Hovering Photo Frames
  if (shot.id === 'phu_quoc_map') {
    const camPos: Vec3 = lerpVec3([-2.4, 3.6, 8.6], [2.2, 2.5, 7.2], easeInOutCubic(p));
    return (
      <AbsoluteFill>
        <CinematicStage camPos={camPos} lookAt={[0.4, 0.35, -0.5]} fov={36} accentColor={PALETTE.cyan} rimColor={PALETTE.gold}>
          <ReflectiveGridFloor y={-2.3} />
          <TiltedPhuQuocMap3D maps={maps} />
          <PhotoFrame3D
            src="phuquoc.webp"
            position={[3.6, 1.85, -2.5]}
            rotation={[0, -0.34, 0]}
            width={4.1}
            height={2.3}
            accentColor={PALETTE.cyan}
            floatPhase={0.5}
          />
          <PhotoFrame3D
            src="pqairport.webp"
            position={[4.65, -0.35, -1.55]}
            rotation={[0, -0.44, 0]}
            width={3.5}
            height={1.96}
            accentColor={PALETTE.gold}
            floatPhase={2.4}
          />
          <ExtrudedLabel3D
            text="APEC 2027"
            position={[-2.2, 2.35, -2.2]}
            rotation={[0, 0.22, 0]}
            size={0.58}
            depth={0.16}
            color={PALETTE.cyan}
            emissive={PALETTE.cyan}
            emissiveIntensity={0.3}
            subtleFloat
          />
        </CinematicStage>

        <FloatingHUD
          kicker="CHỦ NHÀ APEC 2027 · ĐẶC KHU PHÚ QUỐC"
          caption={
            beat === 0
              ? 'Phú Quốc bước vào giai đoạn tăng tốc hạ tầng đón 21 nền kinh tế'
              : beat === 1
                ? 'Mở rộng sân bay quốc tế Phú Quốc & trục giao thông kết nối đảo'
                : 'Cơ hội nâng tầm vị thế du lịch, đầu tư và điều phối đa phương'
          }
          subcaption="Bản đồ định vị Dương Đông – Sân bay Quốc tế – An Thới · © OpenStreetMap contributors"
          credit={`Ảnh · ${photoCredits.phuquoc}`}
          accentColor={PALETTE.cyan}
          progress={p}
        />
      </AbsoluteFill>
    );
  }

  // Mode B: Handover 2026 -> 2027 Twin 3D Orbital Platforms + Glowing Energy Arc
  if (shot.id === 'handover') {
    const camPos: Vec3 = lerpVec3([-2.8, 1.4, 9.6], [2.6, 1.25, 9.2], easeInOutCubic(p));
    return (
      <AbsoluteFill>
        <CinematicStage camPos={camPos} lookAt={[0, 0.35, -0.6]} fov={36} accentColor={PALETTE.gold} rimColor={PALETTE.cyan}>
          <ReflectiveGridFloor y={-2.1} />
          <VolumetricBeam position={[-3.2, 3.8, 0]} color={PALETTE.gold} opacity={0.06} />
          <VolumetricBeam position={[3.2, 3.8, 0]} color={PALETTE.cyan} opacity={0.06} />

          {/* Left 2026 Shenzhen Orbital Platform */}
          <group position={[-3.4, -0.35, 0]}>
            <mesh rotation={[Math.PI / 2, 0, localFrame * 0.012]}>
              <torusGeometry args={[1.65, 0.04, 12, 64]} />
              <meshBasicMaterial color={PALETTE.gold} />
            </mesh>
            <ExtrudedLabel3D text="2026" position={[0, 0.25, 0]} size={0.78} depth={0.2} color={PALETTE.gold} emissive={PALETTE.gold} emissiveIntensity={0.34} />
            <PhotoFrame3D src="shenzhen.webp" position={[-0.3, 1.95, -2.2]} rotation={[0, 0.24, 0]} width={3.6} height={2.02} accentColor={PALETTE.gold} />
          </group>

          {/* Right 2027 Phu Quoc Orbital Platform */}
          <group position={[3.4, -0.35, 0]}>
            <mesh rotation={[Math.PI / 2, 0, -localFrame * 0.012]}>
              <torusGeometry args={[1.65, 0.04, 12, 64]} />
              <meshBasicMaterial color={PALETTE.cyan} />
            </mesh>
            <ExtrudedLabel3D text="2027" position={[0, 0.25, 0]} size={0.78} depth={0.2} color={PALETTE.cyan} emissive={PALETTE.cyan} emissiveIntensity={0.34} />
            <PhotoFrame3D src="phuquoc.webp" position={[0.3, 1.95, -2.2]} rotation={[0, -0.24, 0]} width={3.6} height={2.02} accentColor={PALETTE.cyan} />
          </group>

          {/* Sweeping Handover Energy Arc */}
          <GlowingFlowTube
            points={[
              [-2.2, 0.25, 0],
              [0, 2.05, 0.65],
              [2.2, 0.25, 0],
            ]}
            color={PALETTE.gold}
            radius={0.06}
            packetCount={5}
            speed={0.016}
          />
        </CinematicStage>

        <FloatingHUD
          kicker="NGHI LỄ CHUYỂN GIAO QUYỀN CHỦ NHÀ · 2026 → 2027"
          caption={
            beat === 0
              ? 'Thâm Quyến 2026: Tuyên bố Triển vọng Thâm Quyến & kinh tế số'
              : beat === 1
                ? 'Chuyển giao trực tiếp sang Phú Quốc 2027 với 3 ưu tiên chiến lược'
                : 'Trung Quốc khẳng định ủng hộ mạnh mẽ Việt Nam tổ chức APEC 2027'
          }
          subcaption="Năng suất · Thương mại tự do · Chất lượng sống trong kỷ nguyên tự cường & đổi mới sáng tạo"
          accentColor={beat === 0 ? PALETTE.gold : PALETTE.cyan}
          progress={p}
        />
      </AbsoluteFill>
    );
  }

  // Mode C: Multilateral 3D Crystalline Hub & Orbiting Partner Nodes
  if (shot.id === 'multilateral') {
    const orbit = -0.35 + p * 0.85;
    const camPos: Vec3 = [Math.sin(orbit) * 10.2, 2.35, Math.cos(orbit) * 10.2];
    const satellites: { label: string; pos: Vec3; col: string }[] = [
      { label: 'CHINA', pos: [-3.9, 0.9, 1.4], col: PALETTE.gold },
      { label: 'RCEP', pos: [3.9, 1.0, 1.3], col: PALETTE.cyan },
      { label: 'CPTPP', pos: [3.4, -0.5, -2.8], col: PALETTE.blue },
      { label: 'US & EU', pos: [-3.4, -0.4, -2.8], col: PALETTE.coral },
    ];
    return (
      <AbsoluteFill>
        <CinematicStage camPos={camPos} lookAt={[0, 0.2, -0.3]} fov={36} accentColor={PALETTE.cyan} rimColor={PALETTE.gold}>
          <ReflectiveGridFloor y={-2.2} />

          {/* Central Vietnam Crystalline Hub + Gyroscope Orbital Rings */}
          <group position={[0, 0.35, 0]}>
            <mesh rotation={[localFrame * 0.014, localFrame * 0.02, 0]}>
              <octahedronGeometry args={[1.05, 0]} />
              <meshPhysicalMaterial
                color={PALETTE.cyan}
                metalness={0.75}
                roughness={0.14}
                clearcoat={1}
                emissive={PALETTE.cyan}
                emissiveIntensity={0.28}
              />
            </mesh>
            <mesh rotation={[Math.PI / 2 - 0.3, localFrame * 0.01, 0]}>
              <torusGeometry args={[1.75, 0.032, 12, 80]} />
              <meshBasicMaterial color={PALETTE.gold} transparent opacity={0.75} />
            </mesh>
            <mesh rotation={[0.45, -localFrame * 0.012, 0.3]}>
              <torusGeometry args={[2.15, 0.024, 12, 80]} />
              <meshBasicMaterial color={PALETTE.cyan} transparent opacity={0.5} />
            </mesh>
            <ExtrudedLabel3D text="VIETNAM" position={[0, 1.65, 0]} size={0.44} depth={0.12} color={PALETTE.white} emissive={PALETTE.gold} emissiveIntensity={0.25} />
          </group>

          {/* 4 Orbiting Multilateral Partner Nodes + Glowing Energy Beams */}
          {satellites.map((s) => (
            <group key={s.label}>
              <GlowingFlowTube points={[[0, 0.35, 0], s.pos]} color={s.col} radius={0.038} packetCount={3} speed={0.016} />
              <group position={s.pos}>
                <mesh rotation={[localFrame * 0.02, localFrame * 0.025, 0]}>
                  <octahedronGeometry args={[0.42, 0]} />
                  <meshPhysicalMaterial color={s.col} metalness={0.7} roughness={0.2} emissive={s.col} emissiveIntensity={0.3} />
                </mesh>
                <ExtrudedLabel3D text={s.label} position={[0, 0.78, 0]} size={0.34} depth={0.09} color={s.col} emissive={s.col} emissiveIntensity={0.28} />
              </group>
            </group>
          ))}
        </CinematicStage>

        <FloatingHUD
          kicker="ĐỐI NGOẠI ĐỘC LẬP, TỰ CHỦ & ĐA PHƯƠNG HÓA"
          caption={
            beat === 0
              ? 'Việt Nam cân bằng chiến lược giữa các hiệp định và đối tác lớn'
              : beat === 1
                ? 'Kết nối đồng thời Trung Quốc (APEC 2026), RCEP, CPTPP và Mỹ – EU'
                : 'Vai trò điều phối ngày càng cao trên bàn cờ kinh tế khu vực'
          }
          subcaption="Bộ trưởng Ngoại giao Lê Hoài Trung: Chuyến công tác Thâm Quyến khẳng định vị thế cầu nối của Việt Nam"
          accentColor={PALETTE.cyan}
          progress={p}
        />
      </AbsoluteFill>
    );
  }

  // Mode D: `scope` & `challenges` — 3 Sculpted 3D Orbital Monoliths in an Arc
  const isChallenges = shot.id === 'challenges';
  const pillars = isChallenges
    ? [
        { num: '01', metric: '-$134.9B', col: PALETTE.coral, photo: 'haiphong' },
        { num: '02', metric: '$11.4B', col: PALETTE.gold, photo: 'train' },
        { num: '03', metric: '2027', col: PALETTE.cyan, photo: 'phuquoc' },
      ]
    : [
        { num: '01', metric: 'DATA', col: PALETTE.cyan, photo: 'apec2026' },
        { num: '02', metric: 'MAPS', col: PALETTE.gold, photo: 'shenzhen' },
        { num: '03', metric: '3D SIM', col: PALETTE.blue, photo: 'train' },
      ];

  const camTargets: Vec3[] = [
    [-3.1, 1.35, 7.6],
    [0.0, 1.45, 7.8],
    [3.1, 1.35, 7.6],
  ];
  const activeIdx = Math.min(2, beat);
  const camPos = lerpVec3(camTargets[0], camTargets[2], easeInOutCubic(p));
  const lookAt: Vec3 = [lerpVec3([-2.6, 0.3, 0], [2.6, 0.3, 0], easeInOutCubic(p))[0], 0.35, -0.4];

  return (
    <AbsoluteFill>
      <CinematicStage camPos={camPos} lookAt={lookAt} fov={36} accentColor={PALETTE.gold} rimColor={PALETTE.cyan}>
        <ReflectiveGridFloor y={-2.1} />

        {pillars.map((pl, i) => {
          const px = (i - 1) * 3.8;
          const isFocus = i === activeIdx;
          return (
            <group key={pl.num} position={[px, 0, i === 1 ? -0.9 : 0.2]}>
              {/* Sculpted 3D Orbital Ring */}
              <mesh position={[0, 0.2, 0]} rotation={[0.42, localFrame * 0.015 * (i % 2 ? -1 : 1), 0]}>
                <torusGeometry args={[1.38, 0.036, 12, 64]} />
                <meshBasicMaterial color={pl.col} transparent opacity={isFocus ? 0.9 : 0.35} />
              </mesh>
              {/* Glass Monolith Core */}
              <mesh position={[0, -0.25, 0]}>
                <boxGeometry args={[1.1, 2.35, 0.55]} />
                <meshPhysicalMaterial
                  color="#122136"
                  metalness={0.78}
                  roughness={0.22}
                  clearcoat={0.95}
                  emissive={pl.col}
                  emissiveIntensity={isFocus ? 0.24 : 0.06}
                />
              </mesh>
              <ExtrudedLabel3D
                text={pl.metric}
                position={[0, 1.35, 0.35]}
                size={0.44}
                depth={0.12}
                color={pl.col}
                emissive={pl.col}
                emissiveIntensity={isFocus ? 0.35 : 0.14}
              />
              <PhotoFrame3D
                src={`${pl.photo}.webp`}
                position={[0, 0.2, -2.6]}
                rotation={[0, (1 - i) * 0.22, 0]}
                width={3.1}
                height={1.75}
                accentColor={pl.col}
                floatPhase={i * 1.7}
              />
            </group>
          );
        })}
      </CinematicStage>

      <FloatingHUD
        kicker={
          isChallenges
            ? 'BA PHÉP THỬ THỰC TẾ · GIAI ĐOẠN 2027–2030'
            : 'PHẠM VI TƯ LIỆU & PHƯƠNG PHÁP PHÂN TÍCH'
        }
        caption={
          isChallenges
            ? beat === 0
              ? 'Phép thử 1: Giảm nhập siêu 134,94 tỷ USD bằng nội địa hóa & chế biến sâu'
              : beat === 1
                ? 'Phép thử 2: Giải phóng mặt bằng, vốn & tiến độ tuyến đường sắt 11 tỷ USD'
                : 'Phép thử 3: Hoàn thiện hạ tầng Phú Quốc & điều phối đồng thuận APEC 2027'
            : beat === 0
              ? 'Số liệu thực tế từ Tổng cục Hải quan & Văn kiện APEC 2026'
              : 'Kết hợp bản đồ định vị OpenStreetMap và mô phỏng kỹ thuật 3D minh họa'
        }
        subcaption={
          isChallenges
            ? 'Ngoại giao thuận lợi là điều kiện cần — năng lực thực thi trong nước quyết định kết quả dài hạn'
            : 'Mọi số liệu đã ghi nhận được tách bạch rõ với mục tiêu kế hoạch và mô phỏng kỹ thuật'
        }
        accentColor={pillars[activeIdx]?.col ?? PALETTE.gold}
        progress={p}
      />
    </AbsoluteFill>
  );
};
