import type {ReactNode} from 'react';
import {AbsoluteFill} from 'remotion';
import {motion, straight} from './motion-revision';
import type {Cues} from './sync-editorial';
import {aqua, block, car, gold, pier, project, track, train, type Camera, type Face, type Vec} from './engineering-mesh';

const paper = '#f2f2e5';
const quiet = '#a6bbbe';
const orange: [string,string,string] = ['#f6ac69','#c96b40','#df8e54'];
const asphalt: [string,string,string] = ['#46595e','#2b4049','#354a54'];
const deck: [string,string,string] = ['#a8bbb7','#506e74','#688487'];
const foundation: [string,string,string] = ['#243e43','#192d36','#1e363d'];
const font = '"Economy Be Vietnam Pro", sans-serif';

type Beat = {id: string; t: number; c: Cues};
const clampMove = (t:number, from:number, to:number) => motion(t,from,to);
export const engineeringIds = ['speed','profile','curve','radius','land','tunnel','signal','brake','cab','factory','girder','station'];

function Caption({x, y, children, color = paper, size = 17}: {
  x: number; y: number; children: ReactNode; color?: string; size?: number;
}) {
  return <text x={x} y={y} fill={color} fontSize={size} fontWeight="740">{children}</text>;
}

function Stage({title, label, children, footer}: {
  title: string; label?: string; children: ReactNode; footer?: string;
}) {
  return <AbsoluteFill>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{fontFamily:font}}>
      <defs>
        <radialGradient id="engineering-bg" cx="56%" cy="53%" r="74%">
          <stop stopColor="#223e45"/><stop offset="1" stopColor="#08141d"/>
        </radialGradient>
        <pattern id="engineering-grid" width="32" height="32" patternUnits="userSpaceOnUse">
          <path d="M0 32V0H32" fill="none" stroke="#8bcabd" strokeWidth=".6" opacity=".11"/>
        </pattern>
        <linearGradient id="engineering-vignette" x2="0" y2="1">
          <stop stopColor="#091721" stopOpacity=".92"/>
          <stop offset=".24" stopColor="#091721" stopOpacity="0"/>
          <stop offset=".8" stopColor="#091721" stopOpacity="0"/>
          <stop offset="1" stopColor="#091721" stopOpacity=".88"/>
        </linearGradient>
      </defs>
      <rect width="1280" height="720" fill="url(#engineering-bg)"/>
      <rect x="38" y="30" width="1204" height="660" fill="url(#engineering-grid)"/>
      {children}
      <rect width="1280" height="720" fill="url(#engineering-vignette)" pointerEvents="none"/>
      <path d="M65 74h32" stroke={aqua} strokeWidth="3" strokeLinecap="round"/>
      <Caption x={65} y={122} size={37}>{title}</Caption>
      {label && <Caption x={66} y={151} size={13} color={quiet}>{label}</Caption>}
      {footer && <Caption x={65} y={665} size={19} color={aqua}>{footer}</Caption>}
    </svg>
  </AbsoluteFill>;
}

function World({camera, faces, ground, children}: {
  camera:Camera; faces:Face[]; ground?:Face[]; children?:ReactNode;
}) {
  function polygon(face:Face) {
    return face.points.map(point=>project(point,camera).slice(0,2).map(n=>n.toFixed(1)).join(',')).join(' ');
  }
  const ordered=faces.map((face,index)=>({
    face,index, depth:face.points.reduce((total,point)=>total + project(point,camera)[2],0)/face.points.length,
  })).sort((a,b)=>a.depth-b.depth || a.index-b.index);
  return <g>
    {ground?.map((face,i)=><polygon key={i} points={polygon(face)} fill={face.fill}/>)}
    {ordered.map(({face,index})=><polygon key={index} points={polygon(face)} fill={face.fill}
      stroke={face.edge??face.fill} strokeWidth={face.edge?1:.55} strokeLinejoin="round"/>)}
    {children}
  </g>;
}

function Callout({at, camera, x, y, text, color = aqua}: {
  at:Vec; camera:Camera; x:number; y:number; text:string; color?:string;
}) {
  const [px,py] = project(at,camera);
  const side = px > x ? 1 : -1;
  const elbow = x + side * 22;
  return <g>
    <path d={`M${px} ${py} L${elbow} ${y+15} H${x}`} stroke={color} strokeWidth="1.4" fill="none" opacity=".84"/>
    <circle cx={px} cy={py} r="4" fill={color}/>
    <Caption x={x} y={y} size={16} color={color}>{text}</Caption>
  </g>;
}

function Wire({from,to,camera,color = quiet, width = 1.5}: {
  from:Vec;to:Vec;camera:Camera;color?:string;width?:number;
}) {
  const [x,y] = project(from,camera), [u,v] = project(to,camera);
  return <path d={`M${x} ${y}L${u} ${v}`} stroke={color} strokeWidth={width} fill="none"/>;
}

function Speed({t,c}:Beat) {
  const elapsed = straight(t,c.advance,c.advance+1);
  const detail = clampMove(t,c.wheels,c.wheels+.63);
  const nose = -4.8 + 9.7 * elapsed;
  const camera:Camera = {yaw:.28-.19*detail,pitch:.46-.17*detail,zoom:83+46*detail,
    x:648-260*detail,y:414+30*detail,aim:[-.8+2.5*detail,0,0]};
  const faces=[...track(-1.3,0,0,15.4,true),...train(nose,.108,0,2)];
  const [startX,startY]=project([-4.8,-.07,1.23],camera);
  const [endX,endY]=project([5.2,-.07,1.23],camera);
  return <Stage title="Một giây ở 350 km/h" label="Minh họa quãng đường theo tỷ lệ"
    footer={t<c.advance?'Mốc đo bên cạnh đường ray':t<c.wheels?'Đầu tàu đi 97 m trong một giây':'Bánh tàu dẫn chuyển động dọc theo ray'}>
    <World camera={camera} faces={faces} ground={block([-1.1,-.52,0],[16,.3,4],foundation)}>
      <g opacity={1-detail}>
        <path d={`M${startX} ${startY}L${endX} ${endY}`} stroke="#668488" strokeWidth="2"/>
        <Wire from={[-4.8,-.07,1.23]} to={[nose,-.07,1.23]} camera={camera} color={gold} width={4}/>
        {[0,20,40,60,80,100].map(value=>{
          const x=-4.8+value/10;
          const [sx,sy]=project([x,-.07,1.25],camera);
          return <g key={value}>
            <path d={`M${sx} ${sy-7}v14`} stroke="#d3e4dc" strokeWidth="1.2"/>
            <Caption x={sx-8} y={sy+28} size={14}>{value} m</Caption>
          </g>;
        })}
      </g>
      <g opacity={detail}><Callout at={[nose-.68,.09,.39]} camera={camera} x={955} y={505} text="Bánh và mặt ray"/></g>
    </World>
    <g opacity={1-detail}>
      <Caption x={940} y={178} size={69} color={gold}>{(Math.round(elapsed*10)/10).toFixed(1).replace('.',',')}</Caption>
      <Caption x={1071} y={177} size={20} color={quiet}>GIÂY</Caption>
      {elapsed===1 && <Caption x={944} y={220} size={26}>97 m</Caption>}
    </g>
  </Stage>;
}

function Overpass({t,c}:Beat) {
  const lift=.18+1.65*clampMove(t,c.raise,c.raise+1.13);
  const railY=lift+.083;
  const camera: Camera = {yaw:.57+.06*t/13,pitch:.45,zoom:76,x:637,y:451,aim:[-.45,0,0]};
  const road = block([.2,-.11,.1],[2.65,.19,7.3],asphalt);
  const visibleRoad=t>=c.road;
  const trainX=-6+13*straight(t,c.train-.25,c.both+2.2);
  const faces: Face[] = [
    ...(visibleRoad?road:[]),
    ...[-4,-2.05,2.25,4.2].flatMap(x=>pier(x,Math.max(.05,lift-.37))),
    ...Array.from({length:10},(_,i)=>(i-4.5)*1.16).flatMap(x=>block([x,lift-.15,0],[1.16,.30,1.84],deck)),
    ...track(0,lift+.016,0,11.5),
    ...(t>=c.train-.25?train(trainX,railY+.03,0):[]),
    ...(t>=c.cars?[...car(-.38,3.76-((t-c.cars)*.54)%7.8,'#e3a26e',-1),
      ...car(.71,3.8-((t-c.cars+.45)*1.4)%8,'#b3c9cc',-1)]:[]),
  ];
  return <Stage title="Hai luồng giao thông, hai cao độ" label="Mặt cắt cầu cạn"
    footer={t<c.raise?'Tuyến đường bộ chạy ngang vị trí giao cắt':t<c.both?'Đường ray nằm trên kết cấu cầu cạn':'Tàu và xe đi qua cùng vị trí ở hai cao độ'}>
    <World camera={camera} ground={block([0,-.39,0],[13.3,.4,8.9],foundation)} faces={faces}>
      {visibleRoad && <Wire from={[.2,.005,-3.58]} to={[.2,.005,-1.05]} color="#abaca0" camera={camera}/>}
      {visibleRoad && <Wire from={[.2,.005,1.05]} to={[.2,.005,3.63]} color="#abaca0" camera={camera}/>}
      {t>=c.cars && <Callout at={[.9,-.02,2.3]} camera={camera} x={196} y={562} text="Đường bộ"/>}
      {t>=c.raise && <Callout at={[2.5,lift,.86]} camera={camera} x={960} y={296} text="Mặt cầu và ray"/>}
    </World>
  </Stage>;
}

const hillProfile: [number,number][] = [[-5.9,.05],[-4.65,1.28],[-3.24,2.15],[-1.7,3.35],[-.15,3.93],
  [1.3,3.37],[2.55,2.82],[3.85,1.9],[5.3,1.05],[6.1,.05]];

function hillside():Face[] {
  const lanes = [-2.85,-1.8,-.75,.5];
  const peaks = [0.75,1,.9,.76];
  const paints = ['#4d6d63','#5c7b68','#708a72'];
  const layers = lanes.map((z,index)=>hillProfile.map(([x,y]):Vec=>[x,y*peaks[index],z]));
  const surfaces:Face[] = [];
  for(let band=0;band<3;band++) {
    for(let i=0;i<hillProfile.length-1;i++) {
      surfaces.push({points:[layers[band][i],layers[band][i+1],layers[band+1][i+1],layers[band+1][i]],fill:paints[band]});
    }
  }
  const front = layers[3];
  for(let i=0;i<front.length-1;i++) {
    const a=front[i],b=front[i+1];
    const floor = .96;
    if(Math.min(a[1],b[1])>=floor) surfaces.push({points:[a,b,[b[0],floor,.5],[a[0],floor,.5]],fill:'#839084'});
    if(Math.max(a[1],b[1])>floor) {
      const highA = Math.max(a[1],floor), highB = Math.max(b[1],floor);
      surfaces.push({points:[[a[0],floor,.51],[b[0],floor,.51],[b[0],floor+.19*(highB-floor),.51],
        [a[0],floor+.19*(highA-floor),.51]],fill:'#aa9380'});
    }
  }
  return surfaces;
}
const terrain=hillside();

function tunnelPortal(x: number): Face[] {
  const arch = (radius: number, i: number, side: number): Vec => {
    const angle = Math.PI*i/12;
    return [x+side*.11,.56+radius*Math.sin(angle),.42+radius*Math.cos(angle)];
  };
  const pieces = [
    ...block([x,.24,-.31],[.22,.60,.22],deck),
    ...block([x,.24,1.15],[.22,.60,.22],deck),
  ];
  for(let i=0;i<12;i++) {
    const sides = [arch(.62,i,-1),arch(.82,i,-1),arch(.82,i+1,-1),arch(.62,i+1,-1)];
    pieces.push({points:sides,fill:'#afaea0'},
      {points:sides.map(([u,y,z]):Vec=>[u+.22,y,z]),fill:'#81938d'},
      {points:[arch(.82,i,-1),arch(.82,i,1),arch(.82,i+1,1),arch(.82,i+1,-1)],fill:'#a8b5a9'},
      {points:[arch(.62,i,-1),arch(.62,i,1),arch(.62,i+1,1),arch(.62,i+1,-1)],fill:'#506e73'});
  }
  return pieces;
}

function Tunnel({t,c}:Beat) {
  const camera:Camera={yaw:.27+.17*straight(t,0,13),pitch:.31,zoom:83,x:640,y:503};
  const trainX=-6.7+14.4*straight(t,c.entrance,c.cost+.66);
  const cut=t>=c.entrance;
  const faces:Face[]=[
    ...terrain,
    ...track(0,.02,.42,13.3),
    ...(cut?[-4.68,4.74].flatMap(tunnelPortal):[]),
    ...(cut?train(trainX,.124,.42,2):[]),
  ];
  const factor = t<c.slope?'Hướng tuyến xuyên đồi':t<c.curve?'Độ dốc dọc tuyến':
    t<c.ground?'Bán kính đường cong':t<c.cost?'Điều kiện đất đá':t<c.plan?'Chi phí đào và gia cố':'Bố trí tuyến và tốc độ thiết kế';
  return <Stage title="Đường hầm xuyên qua địa hình" label="Mặt cắt dọc minh họa" footer={factor}>
    <World camera={camera} ground={block([0,-.41,-.48],[14.1,.52,6.7],foundation)} faces={faces}>
      {cut && <>
        <Callout at={[-4.68,1.31,.48]} camera={camera} x={116} y={333} text="Cửa hầm"/>
        <Wire from={[-4.55,1.16,.56]} to={[4.52,1.16,.56]} camera={camera} color="#d6c5a6"/>
      </>}
      {t>=c.ground && <Callout at={[.3,2,.52]} camera={camera} x={920} y={315} text="Lớp đất đá" color={gold}/>}
    </World>
  </Stage>;
}

function Gantry({t,c,id}:Beat) {
  const casting=id==='factory';
  const position=casting ? -3.6+4.1*clampMove(t,c.transport,c.site+.65)
    : -4.1+4.1*clampMove(t,c.move,c.center+.31);
  const beamY=casting ? .63 : 2.9-1.2*clampMove(t,c.lower,c.seated);
  const bridgeTop=1.27;
  const craneX=position+3.18*(casting?0:clampMove(t,c.next,c.next+1.1));
  const camera:Camera={yaw:.56+.07*straight(t,0,13),pitch:.42,zoom:88,x:632,y:464};
  const girder=(x:number,y:number,paint:[string,string,string])=>[
    ...block([x,y,0],[3.02,.27,1.48],paint),
    ...block([x,y-.15,0],[2.92,.25,.8],paint),
  ];
  const gantryColor:[string,string,string]=['#9dc6bf','#458d86','#60a49d'];
  const finished=casting ? t>=c.ready : t>=c.seated;
  const faces:Face[]=[
    ...[-4.68,-1.56,1.56,4.68].flatMap(x=>[
      ...pier(x,bridgeTop),
      ...[-.36,.36].flatMap(z=>block([x,1.39,z],[.48,.07,.37],['#d5bd82','#8c7960','#a99165'])),
    ]),
    ...girder(-3.12,1.4,deck),
    ...(casting&&t<c.cast?block([position,.58,0],[3.16,.17,1.65],deck):girder(position,beamY,orange)),
  ];
  if(!casting) {
    for(const side of [-1,1]) {
      faces.push(...block([craneX+1.33*side,2.33,.65],[.12,2.38,.17],gantryColor),
        ...block([craneX+1.33*side,2.33,-.65],[.12,2.38,.17],gantryColor),
        ...block([craneX+1.33*side,3.5,0],[.12,.14,1.62],gantryColor),
        ...block([craneX,3.6,side*.69],[3.13,.20,.18],gantryColor));
    }
  }
  const title=casting?'Từ bãi đúc đến công trường':'Lắp một nhịp cầu cạn';
  const phase=casting
    ? t<c.yard?'Lặp lại kết cấu theo từng nhịp':t<c.mold?'Chuẩn bị tại bãi đúc':t<c.cast?'Chuẩn bị khuôn':
      t<c.check?'Đúc dầm bê tông':t<c.transport?'Kiểm tra dầm trước khi xuất bãi':t<c.site?'Vận chuyển đến công trường':
        t<c.ready?'Hoàn thiện trụ và vị trí đặt':'Trụ và dầm sẵn sàng lắp'
    : t<c.move?'Dầm bê tông đúc sẵn':t<c.hold?'Đưa dầm vào giữa hai trụ':t<c.lower?'Giữ dầm đúng tim trụ':
      t<c.seated?'Hạ dầm lên gối cầu':t<c.next?'Dầm đã nằm trên hai gối cầu':'Thiết bị tiến sang nhịp kế tiếp';
  return <Stage title={title} label="Mô phỏng kết cấu" footer={phase}>
    <World camera={camera} ground={block([0,-.42,0],[12.8,.53,5.8],foundation)} faces={faces}>
      {!casting && !finished && [-1,1].map(side=><Wire key={side} from={[position+side*.95,3.54,.65]}
        to={[position+side*.95,beamY+.15,.65]} camera={camera} color="#c0d6d1"/>)}
      {(!casting||t>=c.cast) && <Callout at={[position,beamY+.12,.68]} camera={camera} x={952} y={345} text="Dầm bê tông" color={gold}/>}
      {((casting&&t>=c.piers)||(!casting&&t>=c.lower)) &&
        <Callout at={[1.56,1.425,.39]} camera={camera} x={877} y={556} text="Gối cầu"/>}
    </World>
  </Stage>;
}

function SignalTechnical({t,c}:Beat) {
  const nose=3.86 + .36*straight(t,0,13);
  const camera:Camera={yaw:.36+.12*straight(t,0,13),pitch:.39,zoom:88,x:647,y:426};
  const base:Vec=[-3.62,.23,0];
  const receiver:Vec=[nose-.77,.56,-.02];
  const [x,y]=project(base,camera),[u,v]=project(receiver,camera);
  const data = straight(t,c.send,c.receive);
  const packetX=x+(u-x)*data, packetY=y+(v-y)*data-370*data*(1-data);
  const faces=[...track(0,0,0,12.7,true),...train(nose,.109,0,2)];
  if(t>=c.ground) faces.push(...block([-3.62,.13,0],[.38,.26,.41],['#f7ce88','#b67d3c','#dda95f']));
  return <Stage title="Tuyến gửi dữ liệu lên tàu" label="Nguyên lý truyền thông tin minh họa"
    footer={t<c.ground?'Tàu cần biết trạng thái của đoạn đường trước mặt':
      t<c.receive?'Thông số tuyến · Khoảng cách · Trạng thái đường đi':'Hệ thống trên tàu nhận và hiển thị dữ liệu'}>
    <World camera={camera} ground={block([0,-.46,0],[14.1,.4,4.85],foundation)} faces={faces}>
      {t>=c.ground && <>
        <Callout at={base} camera={camera} x={192} y={554} text="Thiết bị mặt đất" color={gold}/>
        <path d={`M${x} ${y}Q${(u+x)/2} ${(y+v)/2-185} ${u} ${v}`}
          stroke={aqua} strokeWidth="1.6" strokeDasharray="6 8" fill="none" opacity=".65"/>
      </>}
      {t>=c.send && t<c.receive && <g><circle cx={packetX} cy={packetY} r="17" fill={aqua} opacity=".18"/>
        <circle cx={packetX} cy={packetY} r="6" fill={aqua}/></g>}
      {t>=c.receive && <Callout at={receiver} camera={camera} x={947} y={319} text="Dữ liệu đã đến tàu"/>}
    </World>
    {(['parameters','distance','status'] as const).map((key,i)=><g key={key}
      opacity={clampMove(t,c[key],c[key]+.24)} transform={`translate(${380+184*i} 197)`}>
      <rect width="169" height="35" rx="4" fill="#1e4048" stroke="#3e6568"/>
      <Caption x={11} y={23} size={14}>{['Thông số tuyến','Khoảng cách','Trạng thái đường đi'][i]}</Caption>
    </g>)}
    {t>=c.speed && <Caption x={889} y={602} size={17} color={aqua}>
      {t<c.position?'Hiển thị tốc độ':'Hiển thị tốc độ và vị trí'}</Caption>}
  </Stage>;
}

function CabTechnical({t,c}:Beat) {
  const marks=Array.from({length:19},(_,i)=>((i/19+t*.22)%1)**2).sort((a,b)=>a-b);
  const speed=306+16*Math.sin(t*.25);
  return <Stage title="Góc nhìn từ buồng lái" label="Giao diện minh họa">
    <defs>
      <linearGradient id="cab-window" x2="0" y2="1"><stop stopColor="#284e63"/><stop offset="1" stopColor="#72968e"/></linearGradient>
      <linearGradient id="cab-desk" x2="0" y2="1"><stop stopColor="#39565d"/><stop offset="1" stopColor="#111f24"/></linearGradient>
      <clipPath id="cab-glass"><path d="M65 166H1215L1146 467H147z"/></clipPath>
    </defs>
    <g clipPath="url(#cab-glass)">
      <rect x="65" y="166" width="1150" height="300" fill="url(#cab-window)"/>
      <path d="M65 337 251 261 403 280 527 215 649 277 820 218 1000 291 1215 253V471H65z" fill="#506e65"/>
      <path d="M632 258 290 470H1011L654 258z" fill="#42595b"/>
      {marks.map((n,i)=><path key={i} d={`M${630-260*n} ${261+209*n}h${21+504*n}`}
        stroke="#b2bab3" opacity={.18+.51*n} strokeWidth={1+4*n}/>)}
      <path d="M636 258 430 470m222-212 210 212" stroke="#d8e0d5" strokeWidth="5" fill="none"/>
      <path d="M220 166 181 466M1057 166l39 301" stroke="#15292e" strokeWidth="14"/>
    </g>
    <path d="M49 437h1184l80 283H-21z" fill="url(#cab-desk)" stroke="#456b72" strokeWidth="4"/>
    <path d="M372 456H898l65 216H316z" stroke="#39575b" fill="#101f24" strokeWidth="5"/>
    <rect x="382" y="475" width="508" height="170" rx="13" fill="#102629" stroke="#639891" strokeWidth="2"/>
    <path d="M629 496v127" stroke="#426966"/>
    <g opacity={clampMove(t,c.position,c.position+.27)}>
      <Caption x={407} y={513} size={14} color={quiet}>VỊ TRÍ TRÊN TUYẾN</Caption>
      <path d="M410 567h191" stroke="#49756f" strokeWidth="4" strokeLinecap="round"/>
      <circle cx={437+137*straight(t,c.position,13.6)} cy="567" r="8" fill={gold}/>
      <Caption x={407} y={606} size={15} color={aqua}>{t<c.condition?'Đoạn đang chạy':'Đoạn tuyến phía trước'}</Caption>
    </g>
    <g opacity={clampMove(t,c.speed,c.speed+.3)}>
      <Caption x={659} y={513} size={14} color={quiet}>TỐC ĐỘ MINH HỌA</Caption>
      <Caption x={653} y={581} size={56} color={aqua}>{Math.round(speed)}</Caption>
      <Caption x={779} y={579} size={18}>km/h</Caption>
    </g>
    {t>=c.link && <Callout at={[0,0,0]} camera={{yaw:0,pitch:0,zoom:1,x:643,y:291}}
      x={947} y={388} text="Thông tin đoạn tuyến"/>}
  </Stage>;
}

function Profile({id,t,c}:Beat) {
  const braking=id==='brake';
  const speed=(u:number)=>braking?.91-.60*motion(u,.32,.73):.83*motion(u,.035,.34)*(1-motion(u,.62,.995));
  const x=(u:number)=>133+1019*u, y=(u:number)=>549-302*speed(u);
  const points=Array.from({length:121},(_,i)=>`${x(i/120)} ${y(i/120)}`);
  const curve=`M${points.join('L')}`;
  const s = braking
    ? .32*straight(t,c.travel,c.slow)+.41*straight(t,c.slow,c.marker)+.27*straight(t,c.marker,12.85)
    : .035*straight(t,3,c.accel)+.305*straight(t,c.accel,c.cruise)+.28*straight(t,c.cruise,c.brake)+.38*straight(t,c.brake,c.arrival+.36);
  const phase=braking ? t<c.slow?'Tiến đến đoạn giới hạn':t<c.range?'Tàu giảm tốc trước khi đến vạch':'Dải giảm tốc nằm trước vạch giới hạn'
    : t<c.accel?'Tàu đứng tại ga':t<c.cruise?'Tăng tốc khi rời ga':t<c.brake?'Chạy ổn định trên tuyến':
      t<c.arrival?'Giảm tốc trước ga đích':t<c.area?'Tàu dừng tại ga đích':'Diện tích dưới đường biểu diễn là quãng đường';
  return <Stage title={braking?'Giảm tốc trước điểm giới hạn':'Tốc độ thay đổi trong cả hành trình'}
    label="Đồ thị minh họa" footer={phase}>
    <defs><linearGradient id="area" x2="0" y2="1"><stop stopColor="#63d8bc" stopOpacity=".49"/>
      <stop offset="1" stopColor="#63d8bc" stopOpacity=".08"/></linearGradient></defs>
    <rect x="91" y="187" width="1099" height="414" rx="13" fill="#0d2029" stroke="#38535a"/>
    {Array.from({length:6},(_,i)=><path key={i} d={`M134 ${246+60*i}h1018`} stroke="#38535a" strokeWidth="1"/>)}
    {Array.from({length:11},(_,i)=><path key={i} d={`M${x(i/10)} 246v304`} stroke="#38535a" strokeWidth="1" opacity=".59"/>)}
    <Caption x={130} y={223} size={16}>Tốc độ</Caption>
    <Caption x={braking?1043:1069} y={579} size={15} color={quiet}>{braking?'Khoảng cách':'Thời gian'}</Caption>
    {braking ? <>
      {t>=c.marker && <path d={`M${x(.75)} 220V549`} stroke={gold} strokeWidth="2.5" strokeDasharray="7 6"/>}
      {t>=c.marker && <Caption x={x(.75)+16} y={228} size={16} color={gold}>Điểm giới hạn</Caption>}
      <rect x={x(.32)} y="245" width={x(.75)-x(.32)} height="304" fill={gold}
        opacity={.14*clampMove(t,c.range,c.range+.36)}/>
    </> : <path d={curve+`L${x(1)} 549H${x(0)}Z`} fill="url(#area)"
      opacity={clampMove(t,c.area,c.distance)}/>}
    <path d={curve} stroke="#446566" strokeWidth="3" fill="none" opacity={braking&&t<c.curve?.5:1}/>
    <path d={curve} pathLength="1" stroke={aqua} strokeWidth="5" strokeDasharray="1 1" strokeDashoffset={1-s}
      strokeLinecap="round" fill="none"/>
    <path d={`M${x(s)} ${y(s)}V549`} stroke={gold} opacity=".6" strokeDasharray="5 5"/>
    <circle cx={x(s)} cy={y(s)} r="9" fill={gold} stroke="#142f38" strokeWidth="4"/>
  </Stage>;
}

function CurveTechnical({id,t,c}:Beat) {
  const radius=id==='radius';
  if(radius) {
    const growth=clampMove(t,c.large,c.large+.7);
    const r=90+135*growth;
    const cx=476, cap=291, cy=cap+r;
    const center=Math.sqrt(r*r-69*69);
    return <Stage title="Bán kính cong của đường ray" label="Hình học tuyến nhìn từ trên cao"
      footer={t<c.straight?'Đoạn cong được xác định từ tâm vòng tròn':'Với cùng một đoạn ngắn, bán kính lớn cho đường cong thoải hơn'}>
      <g opacity={clampMove(t,c.circle,c.circle+.4)}>
        <circle cx={cx} cy={cy} r={r} stroke="#6d8d8d" strokeWidth="2" fill="#193b42"/>
        <path d={`M${cx-69} ${cy-center} A${r} ${r} 0 0 1 ${cx+69} ${cy-center}`}
          stroke={gold} strokeWidth="9" fill="none" strokeLinecap="round"/>
        <path d={`M${cx} ${cy}V${cap}`} stroke={aqua} strokeWidth="2"/>
        <circle cx={cx} cy={cy} r="5" fill={aqua}/>
        {t>=c.straight && <path d={`M${cx-99} ${cap-16}h198`} stroke="#b9cccc" strokeWidth="1.6" strokeDasharray="6 5"/>}
      </g>
      <g opacity={clampMove(t,c.number,c.number+.31)}>
        <Caption x={779} y={385} size={78} color={gold}>7.000 m</Caption>
        <Caption x={781} y={434} size={18}>Bán kính ngang thông thường ở 350 km/h</Caption>
        <Caption x={782} y={463} size={13} color={quiet}>Ngân hàng Thế giới · Bảng 4.1</Caption>
      </g>
    </Stage>;
  }
  const progress=.5*straight(t,c.advance,c.tightCenter)+.5*straight(t,c.tightCenter,12.55);
  const atX=150+982*progress;
  return <Stage title="Cùng tốc độ, hai độ cong" label="So sánh hình học nhìn từ trên cao"
    footer={t<c.gentle?'Cua gắt làm hướng tàu thay đổi nhanh hơn':'Cua thoải cho phép đổi hướng từ từ'}>
    {[{cy:371,width:121,depth:120,color:gold,name:'Cua gắt'},
      {cy:566,width:271,depth:99,color:aqua,name:'Cua thoải'}].map((row,index)=>{
      const y=(x:number)=>row.cy-row.depth*Math.exp(-Math.pow((x-640)/row.width,2));
      const path=Array.from({length:81},(_,i)=>`${150+i*12.275} ${y(150+i*12.275)}`).join('L');
      const alpha= t>=c.gentle&&index===0 ? .47 : t>=c.tight&&t<c.advance&&index===1 ? .55 : 1;
      const angle=Math.atan2(y(atX+2)-y(atX-2),4)*180/Math.PI;
      return <g key={row.name} opacity={alpha}>
        <Caption x={151} y={row.cy-34} size={20} color={row.color}>{row.name}</Caption>
        <path d={`M${path}`} stroke="#15272e" strokeWidth="22" fill="none"/>
        <path d={`M${path}`} stroke={row.color} strokeWidth="11" fill="none" opacity=".8"/>
        <path d={`M${path}`} stroke="#0d2530" strokeWidth="5" fill="none" strokeDasharray="3 8"/>
        <g transform={`translate(${atX} ${y(atX)}) rotate(${angle})`}>
          <path d="M-24-7h36l12 7-12 7h-36z" fill="#f9f4e6" stroke="#13262e" strokeWidth="2"/>
          <path d="M-19-2h27l6 2-6 2h-27z" fill={row.color}/>
        </g>
      </g>;
    })}
  </Stage>;
}

function StationTechnical({t,c}:Beat) {
  const times=[c.home,c.station,c.check,c.board,c.exit,c.city];
  const labels=['Từ nhà','Đến ga','Kiểm tra','Đi tàu','Xuống ga','Vào trung tâm'];
  const points=[130,325,510,715,918,1105];
  const active=Math.max(0,times.filter(time=>t>=time).length-1);
  const camera:Camera={yaw:.44,pitch:.44,zoom:76,x:648,y:445};
  const faces: Face[]=[
    ...track(0,.03,0,12.1,true),
    ...block([0,.12,1.25],[10.7,.25,1.35],deck),
    ...train(.66+5*clampMove(t,c.board,c.exit),.14,0,2),
    ...[-3,-1,1,3].flatMap(x=>block([x,.98,1.74],[.10,1.75,.14],deck)),
    ...block([0,1.91,1.48],[8.7,.15,1.3],deck),
  ];
  return <Stage title="Hành trình bắt đầu trước khi lên tàu" label="Các chặng từ cửa nhà đến nơi cần đến"
    footer={t<c.each?'Theo từng bước qua nhà ga':t<c.train?'Mỗi bước đều mất thời gian':t<c.total?'Đoạn chạy nhanh nằm ở giữa':'Cộng cả thời gian trước và sau chuyến tàu'}>
    <World camera={camera} ground={block([0,-.36,0],[13.8,.36,5.5],foundation)} faces={faces}>
      {t>=c.board && t<c.exit && <Callout at={[-1.1,.35,.79]} camera={camera} x={888} y={358} text="Lên tàu" color={gold}/>}
    </World>
    <rect x="77" y="510" width="1126" height="111" rx="10" fill="#102832" stroke="#3b5b60"/>
    <path d="M130 553h975" stroke="#55777a" strokeWidth="3"/>
    <path d={`M130 553H${points[active]}`} stroke={t>=c.total?gold:aqua} strokeWidth="4"/>
    {labels.map((label,i)=><g key={label}>
      <circle cx={points[i]} cy="553" r={i===active?10:6} fill={i===3&&t>=c.train?gold:i<=active?aqua:'#53767a'}/>
      <text x={points[i]} y="594" textAnchor="middle" fontWeight="690" fill={i===active||t>=c.total?paper:quiet} fontSize="17">{label}</text>
    </g>)}
  </Stage>;
}

const scenes: Record<string,(props:Beat)=>ReactNode> = {
  speed:Speed, land:Overpass, tunnel:Tunnel, factory:Gantry, girder:Gantry, signal:SignalTechnical,
  cab:CabTechnical, profile:Profile, brake:Profile, curve:CurveTechnical, radius:CurveTechnical, station:StationTechnical,
};

export function EngineeringBeat(props:Beat) {
  const Scene = scenes[props.id];
  return Scene ? <Scene {...props}/> : null;
}
