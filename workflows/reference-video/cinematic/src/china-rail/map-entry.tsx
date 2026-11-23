import React from 'react';
import {AbsoluteFill, Composition, Easing, Img, interpolate, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import '../economy-story/fonts.css';

type Point = [number, number];
type MapProps = {overview: Point; stations: [Point, Point, Point]; gulf: Point; frames: number};
const gold = '#ffc35d';
const paper = '#fff5da';
const defaults: MapProps = {overview: [840, 285], stations: [[292, 138], [605, 456], [705,608]], gulf: [1060, 550], frames: 308};

function ease(frame: number, start: number, end: number) {
  return interpolate(frame, [start, end], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  });
}

function Label({point, dx, dy, children, size = 26, color = paper}: {
  point: Point; dx: number; dy: number; children: React.ReactNode; size?: number; color?: string;
}) {
  return <text x={point[0] + dx} y={point[1] + dy} paintOrder="stroke" stroke="#101e26" strokeWidth="6"
    strokeLinejoin="round" fill={color} fontSize={size} fontWeight="700">{children}</text>;
}

function RailMap({overview, stations, gulf}: MapProps) {
  const frame = useCurrentFrame();
  const focus = ease(frame, 64, 94);
  const zoom = ease(frame, 47, 107);
  const draw = ease(frame, 105, 166);
  const [beijing, wuqing, tianjin] = stations;
  const line = stations.map(([x,y], i) => `${i ? 'L' : 'M'}${x} ${y}`).join(' ');
  const marker = ease(frame, 156, 255);
  const lengths = [
    Math.hypot(wuqing[0] - beijing[0], wuqing[1] - beijing[1]),
    Math.hypot(tianjin[0] - wuqing[0], tianjin[1] - wuqing[1]),
  ];
  const distance = marker * (lengths[0] + lengths[1]);
  const [a, b, t] = distance < lengths[0]
    ? [beijing, wuqing, distance / lengths[0]] as const
    : [wuqing, tianjin, (distance - lengths[0]) / lengths[1]] as const;
  const train: Point = [a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t];
  return <AbsoluteFill style={{backgroundColor: '#10232d', fontFamily: '"Economy Be Vietnam Pro", Arial, sans-serif'}}>
    <AbsoluteFill style={{transform: `scale(${1+zoom*3.1})`, transformOrigin: `${overview[0]/12.8}% ${overview[1]/7.2}%`}}>
      <Img src={staticFile('china-overview.jpg')} style={{width: '100%', height: '100%'}}/>
      <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0}}>
        <rect width="1280" height="720" fill="#10232d" opacity=".15"/>
        <text x="470" y="350" fill={paper} fontSize="50" fontWeight="700" letterSpacing="5"
          paintOrder="stroke" stroke="#10232d" strokeWidth="8">TRUNG QUỐC</text>
        <circle cx={overview[0]} cy={overview[1]} r="22" fill="none" stroke={gold} strokeWidth="3"/>
        <circle cx={overview[0]} cy={overview[1]} r="7" fill={gold} stroke="#142833" strokeWidth="3"/>
      </svg>
    </AbsoluteFill>
    <AbsoluteFill style={{opacity: focus}}>
      <Img src={staticFile('beijing-tianjin.jpg')} style={{width: '100%', height: '100%'}}/>
      <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0}}>
        <rect width="1280" height="720" fill="#10232d" opacity=".11"/>
        <Label point={gulf} dx={-18} dy={0} size={24} color="#c5e4e9">Vịnh Bột Hải</Label>
        <path d={line} fill="none" stroke="#11232b" strokeWidth="14" strokeLinecap="round" strokeLinejoin="round"/>
        <path d={line} fill="none" stroke={gold} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"
          pathLength="1" strokeDasharray="1 1" strokeDashoffset={1 - draw}/>
        {stations.map(([x,y], i) => <circle key={x} cx={x} cy={y} r={i === 1 ? 6 : 9} fill={paper} stroke="#101e26" strokeWidth="4"/>)}
        <Label point={beijing} dx={20} dy={-13} size={34}>Bắc Kinh</Label>
        <Label point={beijing} dx={21} dy={13} size={16}>Ga Bắc Kinh Nam</Label>
        <Label point={wuqing} dx={20} dy={-12} size={22}>Vũ Thanh</Label>
        <Label point={tianjin} dx={20} dy={13} size={34}>Thiên Tân</Label>
        <g opacity={ease(frame, 153, 170)}><circle cx={train[0]} cy={train[1]} r="13" fill="#ed604c" stroke={paper} strokeWidth="4"/></g>
        <g opacity={ease(frame, 167, 204)} transform="translate(65 527)">
          <rect width="235" height="94" rx="12" fill="#122832"/>
          <text x="17" y="39" fill={gold} fontSize="31" fontWeight="700">350 km/h</text>
          <text x="17" y="67" fill={paper} fontSize="17" fontWeight="700">Tốc độ thiết kế</text>
        </g>
        <g opacity={ease(frame, 90, 124)}>
          <text x="1207" y="81" textAnchor="end" fill={paper} paintOrder="stroke" stroke="#101e26" strokeWidth="6" fontSize="22" fontWeight="700">Khai trương năm 2008</text>
        </g>
        <text x="66" y="652" fill={paper} paintOrder="stroke" stroke="#101e26" strokeWidth="5" fontSize="16">Đường tàu minh họa qua các ga</text>
      </svg>
    </AbsoluteFill>
    <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{position: 'absolute', inset: 0}}>
      <rect x="53" y="48" width="312" height="53" rx="10" fill="#10242d" opacity=".94"/>
      <text x="72" y="81" fill={paper} fontSize="22" fontWeight="700">BẮC KINH – THIÊN TÂN</text>
      <text x="1217" y="679" textAnchor="end" fill={paper} fontSize="14" paintOrder="stroke" stroke="#101e26" strokeWidth="4">Ảnh nền NASA / Blue Marble</text>
    </svg>
  </AbsoluteFill>;
}

function Root() {
  return <Composition id="ChinaRailMap" component={RailMap} width={1920} height={1080} fps={30}
    durationInFrames={308} defaultProps={defaults} calculateMetadata={({props}) => ({durationInFrames: props.frames})}/>;
}

registerRoot(Root);
