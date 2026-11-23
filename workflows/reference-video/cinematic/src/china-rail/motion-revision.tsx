import React from 'react';
import {AbsoluteFill, Easing, interpolate, staticFile} from 'remotion';

export type Point = [number, number];
export type MapChapter = 'overview' | 'regional' | 'stops' | 'distance' | 'recap';
const cream = '#f7f4e6';
const dark = '#10232c';
const yellow = '#ffd579';
const mint = '#8ae7cc';
const font = '"Economy Be Vietnam Pro", sans-serif';
export const straight = (n:number, start:number, end:number) => Math.min(1,Math.max(0,(n-start)/(end-start)));
export const motion = (n:number, start:number, end:number) => interpolate(n,[start,end],[0,1],{
  extrapolateLeft:'clamp',extrapolateRight:'clamp',easing:Easing.inOut(Easing.cubic),
});
const lerp = (a:number,b:number,p:number) => a+(b-a)*p;
const lerpPoint = (a:Point,b:Point,p:number):Point => [lerp(a[0],b[0],p),lerp(a[1],b[1],p)];
const names = ['Bắc Kinh Nam','Vũ Thanh','Thiên Tân'];

function MapText({x,y,size=20,fill=cream,children,anchor='start'}:{
  x:number;y:number;size?:number;fill?:string;children:React.ReactNode;anchor?:'start'|'middle'|'end';
}) {
  return <text x={x} y={y} fontSize={size} fontWeight="700" fill={fill} textAnchor={anchor}>{children}</text>;
}

function RailMarker({point,angle,paused}:{point:Point;angle:number;paused:boolean}) {
  return <g transform={`translate(${point[0]} ${point[1]})`}>
    <circle r="23" fill="#10252d" stroke={paused?mint:yellow} strokeWidth="2.5"/>
    <g transform={`rotate(${angle})`}>
      <path d="M-13-8H4l9 8-9 8h-17z" fill={paused?mint:yellow}/>
      <path d="M-10-4h5v8h-5zM-2-4h4l5 4-5 4h-4z" fill={dark}/>
    </g>
  </g>;
}

function TrainProgress({chapter,t}:{chapter:MapChapter;t:number}) {
  const stop=chapter==='stops';
  if(stop) {
    if(t<9.1) return .66*motion(t,6.05,9.1);
    if(t<10.05) return .66;
    return .66+.34*motion(t,10.05,13.8);
  }
  if(chapter==='regional') {
    return t<8.08?.66*straight(t,4.5,8.08):.66+.34*straight(t,8.08,9.25);
  }
  return straight(t,chapter==='distance'?3.7:1,chapter==='distance'?12.7:12.4);
}

function JourneyPanel({chapter,t,progress}:{chapter:MapChapter;t:number;progress:number}) {
  const stop=chapter==='stops';
  const distance=chapter==='distance';
  const recap=chapter==='recap';
  const status = stop
    ? t<6.05?'Ga trung gian':t<9.05?'Tàu giảm tốc':t<10.05?'Đón trả khách':'Tàu tăng tốc'
    : progress<.02?'Điểm xuất phát':progress<.65?'Đi về phía đông nam':progress<.99?'Qua Vũ Thanh':'Đến ga Thiên Tân';
  const active = stop&&t<6.05?1:(progress<.62?0:progress<.98?1:2);
  return <g transform="translate(943 0)">
    <rect width="337" height="720" fill="#10252e"/>
    <rect x="27" y="49" width="37" height="4" rx="2" fill={mint}/>
    <MapText x={27} y={100} size={31}>{stop?'Dừng ở Vũ Thanh':distance?'Chiều dài tuyến':recap?'Nhìn lại hành trình':'Theo chân đoàn tàu'}</MapText>
    <MapText x={27} y={136} size={16} fill="#a9c4cb">Bắc Kinh – Thiên Tân</MapText>
    <path d="M40 218v208" stroke="#42616b" strokeWidth="3"/>
    <path d={`M40 218v${208*progress}`} stroke={yellow} strokeWidth="3"/>
    {names.map((name,i)=><g key={name}>
      <circle cx="40" cy={218+104*i} r={active===i?10:6} fill={active===i?yellow:'#63848c'}/>
      <MapText x={61} y={225+104*i} size={22} fill={active===i?cream:'#a9c4cb'}>{name}</MapText>
      <MapText x={61} y={248+104*i} size={14} fill="#a9c4cb">{['Ga xuất phát','Ga trung gian','Ga đích'][i]}</MapText>
    </g>)}
    <rect x="27" y="484" width="282" height="133" rx="8" fill="#1e3d46"/>
    {distance&&t>=3.7 ? <>
      <MapText x={47} y={545} size={41} fill={yellow}>{(116.55*motion(t,3.7,5.3)).toFixed(2).replace('.',',')} km</MapText>
      <MapText x={47} y={581} size={16}>Đo dọc toàn tuyến đường sắt</MapText>
    </> : recap ? <>
      <MapText x={47} y={525} size={21} fill={yellow}>{t<5?'Đường ray':t<9.3?'Tín hiệu':'Thi công'}</MapText>
      <MapText x={47} y={563} size={16}>{t<5?'Cua thoải và tuyến riêng':t<9.3?'Dữ liệu vào buồng lái':'Lắp cầu theo từng nhịp'}</MapText>
    </> : <>
      <MapText x={47} y={535} size={23} fill={mint}>{status}</MapText>
      <MapText x={47} y={573} size={16}>{stop&&t>=9.1&&t<10.05?'Tàu đứng tại sân ga':stop&&t<6.05?'Nằm trong thành phố Thiên Tân':'Vị trí tàu minh họa'}</MapText>
    </>}
    <MapText x={27} y={668} size={14} fill="#9bb8be">Ảnh vệ tinh NASA / Blue Marble</MapText>
  </g>;
}

function OverviewMap({overview,t}:{overview:Point;t:number}) {
  const zoom=1+.63*motion(t,1.12,5.8)+.43*motion(t,8.35,12.6);
  const center=lerpPoint([640,355],overview,motion(t,1.12,7));
  const pin=lerpPoint([640,355],[660,314],motion(t,1.12,7));
  const locate=(point:Point):Point=>[pin[0]+(point[0]-center[0])*zoom,pin[1]+(point[1]-center[1])*zoom];
  const target=locate(overview);
  return <g>
    <image href={staticFile('china-overview.jpg')} width="1280" height="720"
      transform={`translate(${pin[0]-center[0]*zoom} ${pin[1]-center[1]*zoom}) scale(${zoom})`}/>
    <rect width="1280" height="720" fill="#081222" opacity=".14"/>
    <g opacity={motion(t,1.25,1.85)}>
      <circle cx={target[0]} cy={target[1]} r={20+15*straight(t,1.2,6.9)} fill="none" stroke={mint} strokeWidth="3"/>
      <circle cx={target[0]} cy={target[1]} r="8" fill={yellow}/>
      <path d={`M${target.join(' ')}l69 -53h94`} fill="none" stroke={yellow} strokeWidth="2.5"/>
      <rect x={target[0]+66} y={target[1]-88} width="233" height="44" rx="6" fill={dark}/>
      <MapText x={target[0]+79} y={target[1]-59} size={19}>Bắc Kinh · Thiên Tân</MapText>
    </g>
    <rect x="64" y="62" width="330" height="97" rx="7" fill={dark}/>
    <MapText x={83} y={108} size={30}>{t<8.3?'Từ toàn cảnh Trung Quốc':'Phóng vào vùng Hoa Bắc'}</MapText>
    <MapText x={87} y={137} size={16} fill={mint}>{t<5.3?'Tìm vùng phía đông bắc':'Ven vịnh Bột Hải'}</MapText>
    <MapText x={1200} y={673} size={14} anchor="end">NASA / Blue Marble</MapText>
  </g>;
}

export function MovingMap({chapter,stations,overview,t}:{chapter:MapChapter;stations:Point[];overview:Point;t:number}) {
  if(chapter==='overview') return <AbsoluteFill style={{background:dark}}>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{fontFamily:font}}><OverviewMap overview={overview} t={t}/></svg>
  </AbsoluteFill>;
  const [origin,middle,end] = stations;
  const progress=TrainProgress({chapter,t});
  const waiting=chapter==='stops'&&t>=9.1&&t<10.05;
  const position=progress<.66?lerpPoint(origin,middle,progress/.66):lerpPoint(middle,end,(progress-.66)/.34);
  const actualPosition=chapter==='stops'&&t<6.05?middle:position;
  const focus=chapter==='stops'?motion(t,.2,3.5)*(1-motion(t,10.1,13.8)):0;
  const tracking=motion(t,4,12);
  const scale=1+.13*tracking+.31*focus;
  const dx=-40*tracking-136*focus;
  const dy=-18*tracking-115*focus;
  const project=([x,y]:Point):Point=>[x*scale+dx,y*scale+dy];
  const projected=stations.map(project);
  const route=projected.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');
  const pastPoints=progress<.66?[projected[0],project(position)]:[projected[0],projected[1],project(position)];
  const traced=pastPoints.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');
  const [a,b]=progress<.66?[origin,middle]:[middle,end];
  const angle=Math.atan2(b[1]-a[1],b[0]-a[0])*180/Math.PI;
  const showMarker=chapter!=='stops'||t>=6.05;
  return <AbsoluteFill style={{background:dark}}>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{fontFamily:font}}>
      <defs><clipPath id="route-window"><rect width="943" height="720"/></clipPath></defs>
      <g clipPath="url(#route-window)">
        <image href={staticFile('beijing-tianjin.jpg')} width="1280" height="720" transform={`translate(${dx} ${dy}) scale(${scale})`}/>
        <rect width="943" height="720" fill="#122327" opacity=".23"/>
        <path d={route} fill="none" stroke="#112832" strokeWidth="13" strokeLinecap="round"/>
        <path d={route} fill="none" stroke="#c6c8a6" strokeWidth="4" strokeDasharray="8 9" strokeLinecap="round"/>
        <path d={traced} fill="none" stroke={yellow} strokeWidth="7" strokeLinecap="round" strokeLinejoin="round"/>
        {projected.map(([x,y],i)=>{
          const picked=chapter==='stops'&&i===1;
          const highlight=picked?1:Math.max(.2,1-Math.abs(progress-[0,.66,1][i])*3);
          return <g key={names[i]}>
            <circle cx={x} cy={y} r={15+11*highlight} fill="none" stroke={mint} strokeWidth="2.5" opacity={highlight}/>
            <circle cx={x} cy={y} r="7" fill={cream} stroke={dark} strokeWidth="3"/>
            <rect x={x+(i===2?-154:15)} y={y+(i===2?-48:-27)} width={[182,126,139][i]} height="33" rx="4" fill={dark}/>
            <MapText x={x+(i===2?-143:27)} y={y+(i===2?-26:-5)} size={18}>{names[i]}</MapText>
          </g>;
        })}
        {showMarker&&<RailMarker point={project(actualPosition)} angle={angle} paused={waiting}/>}
        {chapter==='stops'&&waiting&&<g transform={`translate(${project(middle)[0]-138} ${project(middle)[1]+25})`}>
          <rect width="123" height="31" rx="15" fill={mint}/><MapText x={61} y={21} anchor="middle" size={15} fill={dark}>Đón trả khách</MapText>
        </g>}
        <rect x="51" y="51" width="259" height="42" rx="5" fill={dark}/>
        <MapText x={67} y={79} size={18} fill={mint}>TUYẾN LIÊN THÀNH PHỐ</MapText>
        <g transform="translate(854 59)"><path d="M0 30 11 0l11 30-11-6z" fill={cream}/><MapText x={11} y={52} size={15} anchor="middle">Bắc</MapText></g>
        <rect x="51" y="626" width="340" height="48" rx="5" fill={dark}/>
        <path d="M68 649h34" stroke={yellow} strokeWidth="5" strokeLinecap="round"/>
        <MapText x={113} y={654} size={15}>Hướng tuyến minh họa qua các ga</MapText>
        <g transform="translate(823 267)">
          <path d="M-26-26l47 47m-19-3 19 3-3-19" stroke={mint} fill="none" strokeWidth="3"/>
          <MapText x={-41} y={52} size={15}>Đông nam</MapText>
        </g>
        <g transform="translate(755 653)">
          <path d={`M0-6v7h${115*scale}v-7`} stroke={cream} fill="none" strokeWidth="2"/>
          <MapText x={0} y={22} size={13}>≈ 20 km</MapText>
        </g>
      </g>
      <JourneyPanel chapter={chapter} t={t} progress={progress}/>
    </svg>
  </AbsoluteFill>;
}
