import React from 'react';
import {AbsoluteFill, Img, staticFile, useCurrentFrame} from 'remotion';
import '../economy-story/fonts.css';
import {motion, straight, type MapChapter, type Point} from './motion-revision';

type Shot = {id: MapChapter; start: number; frames: number};
type Shield = {ref: string; point: Point};
export type RoadMapProps = {shots: Shot[]; stations: Point[]; shields: Shield[]; route: Point[][]};

const mapWidth = 965;
const dark = '#13282e';
const white = '#f6f5eb';
const quiet = '#baccc8';
const mint = '#86e9cd';
const rail = '#a01943';
const stationsNames = ['Bắc Kinh Nam', 'Vũ Thanh', 'Thiên Tân'];
const font = '"Economy Be Vietnam Pro", sans-serif';
const titles: Record<MapChapter, string> = {
  overview: 'Tuyến nằm ở đâu?',
  regional: 'Theo chân đoàn tàu',
  stops: 'Dừng ở Vũ Thanh',
  distance: 'Chiều dài tuyến',
  recap: 'Nhìn lại hành trình',
};

const places: {name: string; point: Point; main?: boolean; local?: boolean}[] = [
  {name: 'BẮC KINH', point: [218, 84], main: true},
  {name: 'Thông Châu', point: [329, 105]},
  {name: 'Đại Hưng', point: [206, 228]},
  {name: 'Lang Phường', point: [349, 357]},
  {name: 'QUẬN VŨ THANH', point: [545, 407], local: true},
  {name: 'THIÊN TÂN', point: [647, 633], main: true},
  {name: 'Bờ vịnh Bột Hải', point: [827, 672]},
];

function MapLabel({point, size = 17, fill = dark, children}: {
  point: Point; size?: number; fill?: string; children: React.ReactNode;
}) {
  return <text x={point[0]} y={point[1]} textAnchor="middle" fill={fill} fontSize={size}
    fontWeight={750} stroke="#f8f4e8" strokeWidth="5" strokeLinejoin="round" paintOrder="stroke">
    {children}
  </text>;
}

function Logo({x, y, angle, waiting, gold}: {x: number; y: number; angle: number; waiting: boolean; gold: boolean}) {
  const fill = gold ? '#ffd875' : 'white';
  const dot = waiting ? dark : rail;
  return <g transform={`translate(${x} ${y})`}>
    <circle r="19" fill={gold ? fill : dot} stroke={gold ? dark : 'white'} strokeWidth="3"/>
    <g transform={`rotate(${angle})`}>
      <path d="M-11-6H4l8 6-8 6h-15z" fill={gold ? dark : fill}/>
      <path d="M-8-3h3v6h-3zM-3-3h6l4 3-4 3h-6z" fill={gold ? fill : dot}/>
    </g>
  </g>;
}

function trainProgress(id: MapChapter, time: number) {
  if (id === 'stops') {
    return time <= 10.05 ? motion(time, 6.05, 9.1) : 1 + motion(time, 10.05, 13.8);
  }
  if (id === 'regional') {
    return time < 8.08 ? straight(time, 4.5, 8.08) : 1 + straight(time, 8.08, 9.25);
  }
  return 2 * straight(time, id === 'distance' ? 3.7 : 1.4, id === 'distance' ? 12.7 : 12.4);
}

function PlatformInset({time, cues}: {time: number; cues: Record<string, number>}) {
  const open = time >= cues.boarding && time < cues.depart;
  const door = open ? 10 * motion(time, cues.boarding, cues.boarding + .2) : 0;
  const traveler = straight(time, cues.boarding + .12, cues.depart);
  const trainX = -34 * (1 - straight(time, cues.brake, cues.boarding))
    + 98 * motion(time, cues.depart, cues.depart + .85);
  return <g transform="translate(28 475)">
    <defs><clipPath id="platform-cut"><rect x="12" y="35" width="246" height="71" rx="4"/></clipPath></defs>
    <rect width="270" height="142" rx="9" fill="#142e36" stroke="#fff8e7" strokeWidth="2"/>
    <text x="14" y="24" fill="#f6f5eb" fontSize="15" fontWeight="800">Sân ga Vũ Thanh</text>
    <g clipPath="url(#platform-cut)">
      <rect x="12" y="35" width="246" height="71" fill="#284d52"/>
      <path d="M12 93h246" stroke="#ffd875" strokeWidth="2"/>
      <g transform={`translate(${trainX} 0)`}>
        <path d="M30 48H208q20 4 36 29v11H30z" fill="#f6f5eb"/>
        <path d="M30 77h205l8 6H30z" fill="#ae3652"/>
        <path d="M53 56h26v10H53zm103 0h27v10h-27zm38 0h16l14 10h-30z" fill="#315961"/>
        <rect x="101" y="53" width="36" height="35" rx="3" fill="#193f48"/>
        <path d={`M${101-door} 55h17v31h-17zM${119+door} 55h17v31h-17z`} fill="#b2c4bd"/>
      </g>
      {open && [0,1].map((person)=><g key={person} transform={`translate(${person ? 119+36*traveler : 79+39*traveler} ${person ? 75+16*traveler : 87-14*traveler})`}>
        <circle cy="-6" r="4" fill={person?'#9be7ca':'#ffd875'}/>
        <path d="M0-1v9m-4-6h8m-4 5-4 6m4-6 4 6" stroke={person?'#9be7ca':'#ffd875'} strokeWidth="2.5" strokeLinecap="round"/>
      </g>)}
    </g>
    <text x="14" y="128" fill="#a8e9d0" fontSize="14" fontWeight="750">
      {time < cues.boarding ? 'Giảm tốc' : open ? 'Mở cửa đón trả khách' : 'Rời ga'}
    </text>
  </g>;
}

function lerpPoint(a: Point, b: Point, t: number): Point {
  return [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
}

function line(points: Point[]) {
  return points.map(([x, y]) => `${x},${y}`).join(' ');
}

function followTrack(points: Point[], progress: number) {
  const lengths = points.slice(1).map(([x, y], index) => Math.hypot(x - points[index][0], y - points[index][1]));
  let remaining = lengths.reduce((total, length) => total + length, 0) * progress;
  let segment = 0;
  while (segment < lengths.length - 1 && remaining > lengths[segment]) {
    remaining -= lengths[segment++];
  }
  const [a, b] = [points[segment], points[segment + 1]];
  const point = lerpPoint(a, b, Math.min(1, remaining / lengths[segment]));
  const angle = Math.atan2(b[1] - a[1], b[0] - a[0]) * 180 / Math.PI;
  return {point, angle, covered: [...points.slice(0, segment + 1), point]};
}

function Panel({id, time, progress, cues}: {id: MapChapter; time: number; progress: number; cues?: Record<string, number>}) {
  const focused = id === 'stops' && time < (cues?.approach ?? 6.05);
  const waiting = id === 'stops' && time >= (cues?.boarding ?? 9.1) && time < (cues?.depart ?? 10.05);
  const active = focused ? 1 : progress < .93 ? 0 : progress < 1.98 ? 1 : 2;
  const distance = id === 'distance' && time >= (cues?.number ?? 3.7);
  let note = id === 'overview' ? 'Vùng Hoa Bắc, Trung Quốc' : 'Hướng đi về phía đông nam';
  if (focused) note = 'Đường quanh ga Vũ Thanh';
  else if (waiting) note = 'Đón trả khách tại Vũ Thanh';
  else if (cues && id === 'stops' && time >= cues.depart) note = 'Tăng tốc rời ga Vũ Thanh';
  else if (cues && id === 'stops' && time >= cues.brake) note = 'Giảm tốc vào ga Vũ Thanh';
  else if (id === 'recap') note = time < 5 ? 'Đường ray và cua thoải' : time < 9.3 ? 'Tín hiệu trong buồng lái' : 'Thi công cầu cạn theo nhịp';
  else if (progress >= 1.98) note = 'Đến ga Thiên Tân';
  return <g transform={`translate(${mapWidth} 0)`}>
    <rect width="315" height="720" fill={dark}/>
    <path d="M25 49h30" stroke={mint} strokeWidth="4" strokeLinecap="round"/>
    <text x="25" y="86" fill={white} fontSize="26" fontWeight="800">{titles[id]}</text>
    <text x="25" y="121" fill={quiet} fontSize="15" fontWeight="600">Bắc Kinh → Thiên Tân</text>
    <path d="M35 186V358" stroke="#52716e" strokeWidth="2"/>
    <path d={`M35 186v${86 * progress}`} stroke={mint} strokeWidth="3"/>
    {stationsNames.map((name, i) => <g key={name} transform={`translate(35 ${186 + 86 * i})`}>
      <circle r={active === i ? 9 : 5.5} fill={active === i ? mint : '#799992'}/>
      <text x="22" y="6" fill={active === i ? white : quiet} fontSize="21" fontWeight="800">{name}</text>
      <text x="22" y="29" fill={quiet} fontSize="13">{['Ga xuất phát', 'Ga trung gian', 'Ga đích'][i]}</text>
    </g>)}
    <rect x="25" y="422" width="265" height="92" rx="9" fill="#214148"/>
    {distance ? <>
      <text x="42" y="467" fill={mint} fontSize="33" fontWeight="800">
        {cues ? '116,55' : (116.55 * motion(time, 3.7, 5.25)).toFixed(2).replace('.', ',')} km
      </text>
      <text x="42" y="491" fill={white} fontSize="13">Chiều dài toàn tuyến công bố</text>
    </> : <text x="42" y="474" fill={mint} fontSize="15" fontWeight="750">{note}</text>}
    <g transform="translate(26 563)" fill={white} fontSize="14" fontWeight="600">
      <path d="M0 0h30" stroke={cues && id === 'distance' ? '#ffd875' : '#ff9ab5'} strokeWidth="4" strokeLinecap="round"/>
      <text x="43" y="5">Tuyến đường sắt cao tốc</text>
      <path d="M0 30h30" stroke="#ecc17b" strokeWidth="4" strokeLinecap="round"/>
      <text x="43" y="35">Cao tốc và đường trục</text>
      <path d="M0 60h30" stroke="#eee8d5" strokeWidth="3" strokeLinecap="round"/>
      <text x="43" y="65">Đường địa phương</text>
    </g>
    <text x="25" y="677" fill={quiet} fontSize="11">© OpenStreetMap · © OpenMapTiles · OpenFreeMap</text>
    <text x="25" y="696" fill={quiet} fontSize="11">openstreetmap.org/copyright</text>
  </g>;
}

export const roadMapDefaults: RoadMapProps = {shots: [], stations: [], shields: [], route: []};

export function RoadMap({shots, stations, shields, route, cues}: RoadMapProps & {cues?: Record<string, number>}) {
  const frame = useCurrentFrame();
  const shot = shots.find(({start, frames}) => frame >= start && frame < start + frames);
  if (!shot || stations.length !== 3 || route.length !== 2) return <AbsoluteFill style={{background: dark}}/>;
  const id = shot.id;
  const time = (frame - shot.start) / 24;
  const focus = id === 'stops' ? motion(time, cues?.focus ?? .25, cues?.city ?? 4) *
    (1 - motion(time, cues?.depart ?? 8.7, shot.frames / 24 - .3)) : 0;
  const drift = cues && id === 'regional' ? motion(time, cues.zoom, cues.origin) : motion(time, .2, shot.frames / 24 - .1);
  const scale = 1 + .12 * drift + 1.1 * focus;
  const tx = -8 - 74 * drift - 576 * focus;
  const ty = -12 - 33 * drift - 547 * focus;
  const project = ([x, y]: Point): Point => [tx + x * scale, ty + y * scale];
  const projectedStations = stations.map(project);
  const track = route.flat().map(project);
  let progress = trainProgress(id, time);
  if (cues) {
    if (id === 'overview') progress = 0;
    if (id === 'regional') progress = straight(time, cues.southeast, cues.wuqing) + straight(time, cues.wuqing, cues.tianjin);
    if (id === 'distance') progress = 2 * straight(time, cues.measure, cues.route);
    if (id === 'recap') progress = 2 * straight(time, cues.beijing, cues.tianjin);
    if (id === 'stops') {
      const approach = straight(time, cues.approach, cues.brake);
      const braking = straight(time, cues.brake, cues.boarding);
      const brakingDistance = .11*(cues.boarding-cues.brake)/(2*(cues.brake-cues.approach));
      progress = time < cues.approach ? 0 : (1-.11-brakingDistance) + .11 * approach
        + brakingDistance * (1 - (1 - braking)**2)
        + .29 * motion(time, cues.depart, cues.depart + 2.3);
    }
  }
  const leg = progress < 1 ? 0 : 1;
  const {point, angle, covered} = followTrack(route[leg], progress - leg);
  const train = project(point);
  const past = [...(leg === 1 ? route[0] : []), ...covered].map(project);
  const waiting = id === 'stops' && time >= (cues?.boarding ?? 9.1) && time < (cues?.depart ?? 10.05);
  const highlighted = cues && id === 'overview' ? time >= cues.tianjin ? 2 : time >= cues.beijing ? 0 : -1 : -1;
  const mapDistances = focus > .6 ? 10 : 20;
  const bar = 5.68 * mapDistances * scale;

  return <AbsoluteFill style={{background: '#f3f0e6'}}>
    <div style={{position: 'absolute', width: 1447.5, height: 1080, overflow: 'hidden'}}>
      <Img src={staticFile('roads-beijing-tianjin.webp')} style={{position: 'absolute',
        left: tx * 1.5, top: ty * 1.5, width: 1500 * scale, height: 1140 * scale}}/>
    </div>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position: 'absolute', inset: 0, fontFamily: font}}>
      <defs><clipPath id="basemap-extent"><rect width={mapWidth} height="720"/></clipPath></defs>
      <g clipPath="url(#basemap-extent)">
        <polyline points={line(track)} fill="none" stroke="#fffbf3" strokeWidth="10" strokeLinejoin="round"/>
        <polyline points={line(track)} fill="none" stroke="#bd5973" strokeWidth="4"
          strokeDasharray="7 6" strokeLinejoin="round" strokeLinecap="round"/>
        <polyline points={line(past)} fill="none" stroke={rail} strokeWidth="5"
          strokeLinejoin="round" strokeLinecap="round"/>
        {cues && id === 'distance' && <polyline points={line(past)} fill="none" stroke="#f6c951"
          strokeWidth="3" strokeLinejoin="round" strokeLinecap="round"/>}
        {places.map(({name, point, main, local}) => (
          <g key={name} opacity={local ? motion(focus, .15, .65) : 1}>
            <MapLabel point={project(point)} size={main ? 25 : local ? 17 : 15}
              fill={main ? '#254751' : '#536868'}>{name}</MapLabel>
          </g>
        ))}
        {shields.map(({ref, point}, index) => {
          const [x, y] = project(point);
          const nearStation = projectedStations.some(([sx, sy]) => Math.abs(y - sy + 23) < 35 && Math.abs(x - sx) < 100);
          const width = 14 + ref.length * 7;
          return <g key={index} transform={`translate(${x} ${y})`} opacity={nearStation ? 0 : 1}>
            <rect x={-width / 2} y="-10" width={width} height="20" rx="4"
              fill="#fff1d4" stroke="#96622c" strokeWidth="1.2"/>
            <text textAnchor="middle" y="4.5" fill="#664320" fontSize="12" fontWeight="850">{ref}</text>
          </g>;
        })}
        {projectedStations.map(([x, y], index) => {
          const selected = index === 1 ? focus : 0;
          const labelWidth = [146, 109, 113][index];
          const left = index === 1 ? x + 16 : x - labelWidth / 2;
          const top = index === 1 ? y - 18 : y - 48;
          return <g key={stationsNames[index]}>
            {highlighted === index && <circle cx={x} cy={y} r={16 + 4 * Math.sin(time * 4)} fill="none"
              stroke={rail} strokeWidth="2.5"/>}
            {selected > 0 && <circle cx={x} cy={y} r={21 + 4 * Math.sin(time * 3)} fill="none"
              stroke={rail} strokeWidth="1.5" opacity={selected * .85}/>}
            <circle cx={x} cy={y} r="8" fill="#fffbf3" stroke={rail} strokeWidth="3.4"/>
            <rect x={left} y={top} width={labelWidth} height="31" rx="5" fill={dark}
              stroke="#fffbf3" strokeWidth="1.5"/>
            <text x={left + labelWidth / 2} y={top + 20} textAnchor="middle"
              fill={white} fontWeight="800" fontSize="15">{stationsNames[index]}</text>
          </g>;
        })}
        {(id !== 'stops' || time >= (cues?.approach ?? 6.05)) &&
          (progress > .012 || (cues && id === 'regional' && time >= cues.origin)) &&
          <Logo x={train[0]} y={train[1]} angle={angle} waiting={waiting} gold={Boolean(cues)}/>}
        {waiting && <MapLabel point={[train[0], train[1] + 44]} fill={rail}>Dừng tại ga</MapLabel>}
        {cues && id === 'stops' && time >= cues.brake && time < cues.depart + .95 &&
          <PlatformInset time={time} cues={cues}/>}
        {cues && id === 'overview' && time >= cues.sea && time < cues.terrain && <g>
          <path d="M800 605l72 58 60-12" fill="none" stroke="#216b91" strokeWidth="2.5"/>
          <circle cx="932" cy="651" r="6" fill="#216b91"/>
          <MapLabel point={[777, 599]} fill="#216b91">Vịnh Bột Hải</MapLabel>
        </g>}
        <g transform="translate(906 47)" fill={dark}>
          <path d="M0 0l9 27-9-6-9 6z"/>
          <text y="46" textAnchor="middle" fontSize="14" fontWeight="800">Bắc</text>
        </g>
        <g transform="translate(700 28)">
          <rect width="170" height="37" rx="6" fill="#fdfbf2" stroke="#b7b9aa"/>
          <text x="14" y="24" fill={dark} fontSize="15" fontWeight="800">Hoa Bắc · Trung Quốc</text>
        </g>
        <g transform="translate(28 656)" fill={dark}>
          <rect width={bar + 24} height="42" rx="5" fill="#fdfbf2" opacity=".96"/>
          <path d={`M12 11v6h${bar}v-6`} fill="none" stroke={dark} strokeWidth="1.6"/>
          <text x="12" y="34" fontSize="12" fontWeight="800">≈ {mapDistances} km</text>
        </g>
      </g>
      <Panel id={id} time={time} progress={progress} cues={cues}/>
    </svg>
  </AbsoluteFill>;
}

