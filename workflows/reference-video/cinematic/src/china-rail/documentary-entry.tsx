import React from 'react';
import {Audio, Video} from '@remotion/media';
import {AbsoluteFill, Composition, Easing, Img, Sequence, interpolate, registerRoot, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../economy-story/fonts.css';
import {MovingMap, type MapChapter, motion, straight} from './motion-revision';
import {RoadMap, roadMapDefaults, type RoadMapProps} from './road-map';
import {ContextBeat, type Cues} from './sync-editorial';
import {EngineeringBeat, engineeringIds} from './engineering';

const ink = '#141f26';
const paper = '#eff3eb';
const blue = '#183c82';
const coral = '#fc642e';
const mint = '#90e7ca';
const font = '"Economy Be Vietnam Pro", sans-serif';
type Point = [number, number];
type Props = {audio: string; chapters: {start: number; frames: number}[]; stations: Point[]; overview: Point};
type Pace = {p: number; frame: number};
const bezier = Easing.bezier(.22, 1, .36, 1);
const move = (n: number, start: number, end: number) => interpolate(n, [start,end], [0,1], {easing:bezier, extrapolateLeft:'clamp', extrapolateRight:'clamp'});
const clamp = (n: number) => Math.max(0,Math.min(n,1));

function Text({x,y,size=26,fill=ink,weight=700,children,align='start'}: {
  x:number;y:number;size?:number;fill?:string;weight?:number;children:React.ReactNode;align?:'start'|'middle'|'end';
}) {
  return <text x={x} y={y} fontSize={size} fontWeight={weight} fill={fill} textAnchor={align}>{children}</text>;
}
function Art({children,bg=paper}: {children:React.ReactNode;bg?:string}) {
  return <AbsoluteFill style={{background:bg}}><svg viewBox="0 0 1280 720" width="100%" height="100%" style={{fontFamily:font}}>{children}</svg></AbsoluteFill>;
}
function Train({x,y,scale=1,color=coral}: {x:number;y:number;scale?:number;color?:string}) {
  return <g transform={'translate('+x+' '+y+') scale('+scale+')'}>
    <ellipse cx="135" cy="40" rx="144" ry="13" fill="#111c24" opacity=".19"/>
    {[30,95,173,236].map(w=><circle key={w} cx={w} cy="30" r="11" fill="#18262f"/>)}
    <path d="M4 27V-20q0-10 13-10h171q45 0 74 40l17 14q6 8-12 8H12Q4 32 4 27Z" fill="#faf6ec" stroke="#16282f" strokeWidth="2"/>
    <path d="M4 15h210q35 0 56 9l6 4H4z" fill={color}/>
    <path d="M200-25q30 2 55 32h-23l-35-30z" fill="#233d49"/>
    {Array.from({length:7},(_,i)=><rect key={i} x={17+i*25} y="-17" width="18" height="14" rx="3" fill="#274854"/>)}
    <path d="M117-30v62" stroke="#86999a" strokeWidth="1.6"/>
  </g>;
}

function Opening({p, cues, frame}: Pace & {cues?: Cues}) {
  const scale=1.05+p*.09;
  const t = frame / 24;
  const appear = cues ? motion(t, cues.speed, cues.speed + .35) : move(p,.03,.31);
  return <AbsoluteFill>
    <Img src={staticFile('shanghai-train.jpg')} style={{width:'100%',height:'100%',objectFit:'cover',objectPosition:'50% 52%',transform:'scale('+scale+')'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,rgba(13,23,30,.94),rgba(13,23,30,.68) 32%,rgba(13,23,30,0) 76%),linear-gradient(0deg,#142228aa,transparent 40%)'}}/>
    <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{position:'absolute',fontFamily:font}}>
      <Text x={77} y={120} fill={mint} size={23}>ĐƯỜNG SẮT CAO TỐC TRUNG QUỐC</Text>
      <g transform={'translate(0 '+(1-appear)*19+')'} opacity={appear}>
        <Text x={60} y={346} size={215} fill={paper}>350</Text>
        <Text x={101} y={412} size={42} fill={paper}>km/h</Text>
      </g>
      {cues && t >= cues.second && <Text x={83} y={475} fill={mint} size={29}>
        {t < cues.question ? 'Gần 100 mét mỗi giây' : t < cues.turn ? 'Làm sao tàu giữ được tốc độ?' : 'Vào cua và dừng đúng ga'}
      </Text>}
      <Text x={81} y={650} fill={paper} size={16}>Tàu CR400AF tại Thượng Hải · Ảnh tư liệu</Text>
    </svg>
  </AbsoluteFill>;
}

function Distance({p, frame, cues}: Pace & {cues?: Cues}) {
  const t = frame / 24;
  const progress=cues ? straight(t, cues.advance, cues.advance + 1) : move(p,.02,.62);
  return <Art bg="#ff7040">
    <path d="M74 489H1204" stroke={ink} strokeWidth={cues && t >= cues.wheels ? 7 : 3}/>
    {[0,20,40,60,80,100].map((d,i)=><g key={d} transform={'translate('+(76+i*219)+' 490)'}>
      <path d="M0 0v27" stroke={ink} strokeWidth="3"/>
      <Text x={0} y={59} align="middle" size={18}>{d} m</Text>
    </g>)}
    <path d={'M76 479H'+(76+1062*progress)} stroke={paper} strokeWidth="8"/>
    {cues && t >= cues.wheels && <path d="M933 460H1195m-262 22h262" stroke="#223444" strokeWidth="3" fill="none"/>}
    <Train x={-105+1045*progress} y={430} scale={.72}/>
    <Text x={76} y={142} size={34}>{cues && t < cues.atSpeed ? 'Đặt một đoạn thước dài 100 m' : 'Ở tốc độ 350 km/h'}</Text>
    <g opacity={cues ? motion(t, cues.oneSecond, cues.oneSecond + .23) : 1}>
      <Text x={70} y={283} size={111}>97 mét</Text>
      <Text x={577} y={276} size={56}>trong một giây</Text>
    </g>
  </Art>;
}

function Disclaimer({p}: Pace) {
  return <Art>
    <path d="M812-20h482v760H585z" fill={blue}/>
    <path d="M901 732l178-753M966 732l178-753" stroke={mint} strokeWidth="3" opacity=".5"/>
    {[0,1,2,3,4,5,6].map(i=><path key={i} d={'M'+(772+i*36)+' '+(590-i*74)+'l292 80'} stroke={mint} strokeWidth="2" opacity=".44"/>)}
    <circle cx="1060" cy="360" r={91+8*Math.sin(p*Math.PI)} fill="none" stroke={mint} strokeWidth="3"/>
    <Text x={1060} y={394} align="middle" fill={mint} size={108}>i</Text>
    <Text x={75} y={225} size={56}>Miễn trừ</Text>
    <Text x={75} y={294} size={56}>trách nhiệm</Text>
    <path d="M79 334h104" stroke={coral} strokeWidth="6"/>
    <Text x={79} y={398} size={24} weight={400}>Video nhằm mục đích giáo dục.</Text>
    <Text x={79} y={446} size={24} weight={400}>Các mô phỏng đã được đơn giản hóa.</Text>
    <Text x={79} y={494} size={24} weight={400}>Tốc độ thực tế thay đổi theo tuyến.</Text>
  </Art>;
}

function Locator({p,overview}: Pace & Pick<Props,'overview'>) {
  const focus=move(p,.07,.97);
  return <AbsoluteFill style={{background:'#132931'}}>
    <AbsoluteFill style={{transform:'scale('+(1+focus*.85)+')',transformOrigin:(overview[0]/12.8)+'% '+(overview[1]/7.2)+'%'}}>
      <Img src={staticFile('china-overview.jpg')} style={{width:'100%',height:'100%'}}/>
      <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position:'absolute',fontFamily:font}}>
        <circle cx={overview[0]} cy={overview[1]} r={35-focus*14} fill="none" stroke={mint} strokeWidth="4"/>
        <circle cx={overview[0]} cy={overview[1]} r="8" fill={mint}/>
      </svg>
    </AbsoluteFill>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position:'absolute',fontFamily:font}}>
      <rect x="65" y="526" width="449" height="128" rx="6" fill={ink}/>
      <Text x={91} y={587} size={46} fill={paper}>Trung Quốc</Text>
      <Text x={94} y={624} size={19} fill={mint}>Vị trí tuyến Bắc Kinh–Thiên Tân</Text>
      <Text x={1210} y={676} size={15} align="end" fill={paper}>NASA / Blue Marble</Text>
    </svg>
  </AbsoluteFill>;
}

function DetailedMap({p,stations}: Pace & Pick<Props,'stations'>) {
  const [start,middle,end]=stations;
  const d='M'+start.join(' ')+'L'+middle.join(' ')+'L'+end.join(' ');
  const progress=move(p,.07,.64);
  const points=[start,middle,end];
  const labels=['Bắc Kinh Nam','Vũ Thanh','Thiên Tân'];
  return <AbsoluteFill>
    <Img src={staticFile('beijing-tianjin.jpg')} style={{width:'100%',height:'100%'}}/>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position:'absolute',fontFamily:font}}>
      <rect width="1280" height="720" fill="#04293a" opacity=".12"/>
      <path d={d} fill="none" stroke="#192932" strokeWidth="13" strokeLinecap="round"/>
      <path d={d} fill="none" stroke="#fbd16b" strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-progress}/>
      {points.map(([x,y],i)=><g key={x}>
        <circle cx={x} cy={y} r={i===1?7:10} fill={paper} stroke={ink} strokeWidth="4"/>
        <text x={x+22} y={y+(i===2?12:-7)} fill={paper} stroke={ink} strokeWidth="7" paintOrder="stroke" fontSize={i===1?23:30} fontWeight="700">{labels[i]}</text>
      </g>)}
      <rect x="789" y="55" width="420" height="150" rx="6" fill={paper}/>
      <Text x={814} y={104} size={29}>Bắc Kinh–Thiên Tân</Text>
      <Text x={814} y={174} size={55} fill={blue}>2008</Text>
      <Text x={988} y={166} size={17} weight={400}>Năm khai trương</Text>
      <rect x="62" y="609" width="399" height="45" rx="5" fill={ink}/>
      <Text x={81} y={638} fill={paper} size={17}>Hướng tuyến minh họa qua các ga</Text>
      <Text x={1210} y={676} size={15} align="end" fill={paper}>NASA / Blue Marble</Text>
    </svg>
  </AbsoluteFill>;
}

function Curves({p}: Pace) {
  const offset=900-900*move(p,.04,.82);
  return <Art bg="#f3f0e4">
    <Text x={72} y={111} size={50}>Vì sao đường ray cần cua thoải?</Text>
    <Text x={74} y={170} size={20} fill={blue}>HÌNH NHÌN TỪ TRÊN CAO</Text>
    <path d="M87 434C394 428 381 239 592 239S896 457 1199 457" fill="none" stroke="#ce9789" strokeWidth="19" strokeDasharray="12 14"/>
    <path d="M86 435C377 431 417 350 631 350S940 440 1203 444" fill="none" stroke={blue} strokeWidth="19" strokeLinecap="round" strokeDasharray="1150" strokeDashoffset={offset}/>
    <path d="M86 435C377 431 417 350 631 350S940 440 1203 444" fill="none" stroke={paper} strokeWidth="2" strokeDasharray="10 10" opacity={move(p,.3,.64)}/>
    <line x1="89" y1="602" x2="139" y2="602" stroke={blue} strokeWidth="8"/>
    <Text x={155} y={611} size={24}>Cua thoải</Text>
    <line x1="365" y1="602" x2="409" y2="602" stroke="#ce9789" strokeWidth="8" strokeDasharray="10 8"/>
    <Text x={432} y={611} size={24}>Cua gắt</Text>
  </Art>;
}

function Viaduct({p,frame,cues}: Pace & {cues?: Cues}) {
  const t = frame / 24;
  const lift = cues ? motion(t, cues.raise, cues.raise + 1.1) : 1;
  const road = cues ? motion(t, cues.road, cues.road + .4) : 1;
  const train = cues ? straight(t, cues.train - .28, cues.both + 2.25) : p;
  return <Art bg="#d8ecea">
    <path d="M0 412 293 330 496 394 765 326 1039 389 1280 304V720H0z" fill="#92bab1"/>
    <path d="M0 467 299 394 520 449 773 392 1280 454V720H0z" fill="#80a491"/>
    <g opacity={road}><path d="M0 572H1280" stroke="#3c5958" strokeWidth="94"/>
    <path d="M0 572H1280" stroke="#d0ddbc" strokeWidth="3" strokeDasharray="24 20"/>
    {[0,1,2,3].map(i=><g key={i} opacity={cues ? motion(t, cues.cars, cues.cars + .3) : 1} transform={'translate('+((i*347+frame*3)%1450-85)+' 582)'}>
      <rect width="58" height="23" rx="8" fill={i%2?paper:coral}/><circle cx="11" cy="22" r="6" fill={ink}/><circle cx="46" cy="22" r="6" fill={ink}/>
    </g>)}</g>
    {[110,346,582,818,1054].map(x=><path key={x} d={'M'+x+' '+(524-161*lift)+'h26v'+161*lift+'h-26z'} fill="#748a88"/>)}
    <path d={`M0 ${515-164*lift}H1280`} stroke="#f1f0dc" strokeWidth="28"/>
    <Train x={-320+1510*train} y={cues ? 290 : 312} scale={1.13}/>
    <Text x={73} y={121} size={59}>Hai luồng, hai cao độ</Text>
    <Text x={73} y={166} size={24} weight={400}>Cầu cạn tách đường sắt khỏi đường bộ.</Text>
    <Text x={1031} y={410} size={22}>Đường sắt</Text>
    <Text x={1031} y={659} size={22}>Đường bộ</Text>
  </Art>;
}

function Signal({p}: Pace) {
  const out=move(p,.13,.85);
  return <Art bg="#101e2c">
    <path d="M83 512H1197" stroke="#446271" strokeWidth="6"/>
    <path d="M83 535H1197" stroke="#446271" strokeWidth="6"/>
    <path d="M269 473V303M255 308h28M257 354h24" stroke={mint} strokeWidth="6" strokeLinecap="round"/>
    <path d="M271 339Q634 148 931 348" stroke={mint} fill="none" strokeWidth="4" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-out}/>
    <circle cx={272+660*out} cy={339-120*Math.sin(Math.PI*out)} r="8" fill={coral}/>
    <Train x={862-131*out} y={475} scale={.91} color="#48b3b0"/>
    <Text x={75} y={125} size={48} fill={paper}>Dữ liệu đi từ đường ray lên tàu</Text>
    <Text x={76} y={167} size={20} fill={mint}>THÔNG TIN TUYẾN PHÍA TRƯỚC</Text>
    <Text x={269} y={606} size={23} align="middle" fill={paper}>Thiết bị mặt đất</Text>
    <Text x={921} y={606} size={23} align="middle" fill={paper}>Hệ thống trên tàu</Text>
  </Art>;
}

function Cab({p,frame,cues}: Pace & {cues?: Cues}) {
  const t = frame / 24;
  const position = cues ? motion(t, cues.position, cues.position+.35) : 1;
  const speed = cues ? motion(t, cues.speed, cues.speed+.35) : 1;
  return <Art bg="#091c25">
    <path d="M0 0H1280L1071 416H231Z" fill="#193d51"/>
    <path d="M500 0H795l275 418H226z" fill="#34576b"/>
    {[0,1,2,3,4,5,6,7].map(i=>{
      const y=84+Math.pow(((i*40+frame*2.5)%320)/320,2)*359;
      return <path key={i} d={'M'+(630-y*.55)+' '+y+'H'+(630+y*.59)} stroke="#94aeb3" strokeWidth="4" opacity=".64"/>;
    })}
    <path d="M621 76 408 438M646 76 863 438" fill="none" stroke="#a9c5ca" strokeWidth="5"/>
    <path d="M0 720V566L161 457H1121L1280 564V720z" fill="#111d21" stroke="#446b75" strokeWidth="3"/>
    <rect x="429" y="392" width="423" height="253" rx="25" fill="#122e31" stroke="#61a492" strokeWidth="4"/>
    <Text x={461} y={446} size={18} fill={mint}>MINH HỌA THÔNG TIN BUỒNG LÁI</Text>
    <g opacity={speed}><Text x={460} y={523} size={40} fill={paper}>Tốc độ</Text>
    <path d="M632 508H807" stroke="#447b75" strokeWidth="9" strokeLinecap="round"/>
    <path d={'M632 508H'+(649+144*(cues ? motion(t, cues.speed, cues.condition) : move(p,0,.8)))} stroke={mint} strokeWidth="9" strokeLinecap="round"/></g>
    <g opacity={position}><Text x={460} y={592} size={28} fill={paper}>Vị trí</Text>
    <path d="M632 580H807" stroke="#447b75" strokeWidth="3"/>
    <circle cx={632+163*p} cy="580" r="8" fill={coral}/></g>
    {cues && t >= cues.condition && <Text x={640} y={680} align="middle" size={20} fill={mint}>
      {t >= cues.link ? 'Dữ liệu trên tàu ↔ đoạn đường phía trước' : 'Điều kiện đoạn tuyến'}
    </Text>}
  </Art>;
}

function Bridge({p,frame,cues}: Pace & {cues?: Cues}) {
  const t = frame / 24;
  const moveBeam=cues ? motion(t,cues.move,cues.center+.31) : move(p,.03,.39);
  const lower=cues ? motion(t,cues.lower,cues.seated) : move(p,.4,.72);
  const next=cues ? motion(t,cues.next,cues.next+1.1) : move(p,.74,.98);
  const phase = cues ? (t < cues.lower ? 0 : t < cues.next ? 1 : 2) : p < .4 ? 0 : p < .74 ? 1 : 2;
  const beam=52+494*moveBeam;
  const crane=beam+280*next;
  return <Art bg="#e9edf2">
    <defs><pattern id="graph" width="28" height="28" patternUnits="userSpaceOnUse"><path d="M28 0H0V28" fill="none" stroke="#b9ceda" strokeWidth="1"/></pattern></defs>
    <rect width="1280" height="720" fill="url(#graph)"/>
    <Text x={65} y={104} size={49}>Lắp cầu cạn theo từng nhịp</Text>
    <Text x={67} y={150} size={21} fill={blue}>MÔ PHỎNG THI CÔNG</Text>
    <path d="M40 550H1240" stroke="#345b73" strokeWidth="3"/>
    {[266,546,826,1106].map((x,i)=><g key={x}>
      <path d={'M'+x+' 452l52-17v92l-52 22z'} fill="#7b9ab0"/>
      <path d={'M'+x+' 452l-38-16v96l38 17z'} fill="#4e708f"/>
      <path d={'M'+(x-57)+' 417l53-20 72 21-52 23z'} fill="#a4bac9"/>
      {i<1&&<path d={'M'+x+' 396h280v25H'+x+'z'} fill="#496d91"/>}
    </g>)}
    <path d={'M'+beam+' '+(285+111*lower)+'h280l-49 21H'+(beam-49)+'z'} fill={coral}/>
    <path d={'M'+beam+' '+(285+111*lower)+'h280v26H'+beam+'z'} fill="#b54827"/>
    <g transform={'translate('+crane+' 0)'}>
      <path d="M1 423V216H277V423M0 216l138-51 139 51M1 216h276" stroke={blue} strokeWidth="7" fill="none"/>
      {phase!==2&&<path d={'M60 218v'+(67+111*lower)+'m153 '+(-67-111*lower)+'v'+(67+111*lower)} stroke={blue} strokeWidth="3"/>}
    </g>
    <Text x={69} y={638} size={24} fill={phase===0?blue:'#6b8192'}>{cues && t >= cues.hold ? 'Giữ đúng vị trí' : 'Chở dầm tới'}</Text>
    <Text x={454} y={638} size={24} fill={phase===1?blue:'#6b8192'}>Hạ lên trụ</Text>
    <Text x={828} y={638} size={24} fill={phase===2?blue:'#6b8192'}>Chuyển sang nhịp kế</Text>
  </Art>;
}

function Recap({p}: Pace) {
  return <AbsoluteFill>
    <Video src={staticFile('shenzhen-train.mp4')} muted style={{height:'100%',width:'100%',objectFit:'cover'}}/>
    <AbsoluteFill style={{background:'linear-gradient(90deg,#101e29ed 8%,#101e29b9 36%,#101e2917 70%)'}}/>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position:'absolute',fontFamily:font}}>
      <Text x={79} y={144} size={47} fill={paper}>Tốc độ đến từ</Text>
      <Text x={79} y={205} size={47} fill={paper}>cả hệ thống</Text>
      {['Đoàn tàu','Đường ray','Tín hiệu'].map((item,i)=><g key={item} opacity={move(p,.09+i*.17,.22+i*.17)}>
        <circle cx="88" cy={330+i*79} r="7" fill={i===0?coral:mint}/>
        <Text x={111} y={342+i*79} size={34} fill={paper}>{item}</Text>
      </g>)}
      <Text x={80} y={654} size={15} fill={paper}>Khoang tàu cao tốc ở Thâm Quyến · Tư liệu minh họa</Text>
    </svg>
  </AbsoluteFill>;
}

function Closing({p}: Pace) {
  return <Art bg={blue}>
    <path d="M-50 613Q405 584 712 632T1320 559M-50 634Q405 605 712 653T1320 580" fill="none" stroke="#577eb6" strokeWidth="3"/>
    <Text x={640} y={193} align="middle" size={48} fill={paper}>Bạn muốn xem tiếp về</Text>
    <Text x={640} y={280} align="middle" size={64} fill={mint}>nhà ga hay cầu cạn?</Text>
    <g opacity={move(p,.25,.65)} transform={'translate(0 '+(1-move(p,.25,.65))*16+')'}>
      <rect x="484" y="390" width="312" height="69" rx="35" fill={paper}/>
      <path d="M524 412v25l21-12z" fill={coral}/>
      <Text x={663} y={437} align="middle" size={27} fill={blue}>Đăng ký kênh</Text>
    </g>
  </Art>;
}

function Shot({View}: {View:React.ComponentType<Pace>}) {
  const frame=useCurrentFrame();
  const {durationInFrames}=useVideoConfig();
  return <View p={clamp(frame/(durationInFrames-1))} frame={frame}/>;
}
function Documentary({audio,chapters,overview,stations}: Props) {
  const route=(pace:Pace)=><Locator {...pace} overview={overview}/>;
  const detailed=(pace:Pace)=><DetailedMap {...pace} stations={stations}/>;
  const layouts = [
    [[106,Opening],[0,Distance]],
    [[0,Disclaimer]], [[79,route],[0,detailed]], [[135,Curves],[0,Viaduct]],
    [[152,Signal],[0,Cab]], [[0,Bridge]], [[0,Recap]], [[0,Closing]],
  ] satisfies [number,React.ComponentType<Pace>][][];
  return <AbsoluteFill>{chapters.map((chapter,index)=>{
    let from=chapter.start;
    return layouts[index].map(([length,View],j)=>{
      const frames=length||chapter.start+chapter.frames-from;
      const start=from;
      from+=frames;
      return <Sequence key={index+'-'+j} from={start} durationInFrames={frames}><Shot View={View}/></Sequence>;
    });
  })}{audio&&<Audio src={staticFile(audio)}/>}</AbsoluteFill>;
}

const duration=[244,277,308,325,317,306,272,216];
const defaults:Props={audio:'',chapters:duration.map((frames,i)=>({frames,start:duration.slice(0,i).reduce((a,b)=>a+b,0)})),
  overview:[840,267],stations:[[291,137],[605,456],[705,606]]};

type LongShot = {id:string; start:number; frames:number; title:string};
type LongProps = {shots:LongShot[]; stations:Point[]; overview:Point; rail:Point[][]; rivers:Point[][]};
const path = (points:Point[]) => points.map(([x,y],i)=>(i?'L':'M')+x+' '+y).join(' ');

function RegionalMap({p, stations, rail, rivers, shot}: Pace & Pick<LongProps,'stations'|'rail'|'rivers'> & {shot:string}) {
  const [start, middle, end] = stations;
  const d=path(stations);
  const focus=shot==='stops';
  const detail=shot==='distance';
  return <AbsoluteFill>
    <Img src={staticFile('beijing-tianjin.jpg')} style={{width:'100%',height:'100%'}}/>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{position:'absolute',fontFamily:font}}>
      <rect width="1280" height="720" fill="#061d29" opacity=".36"/>
      {rivers.map((points,i)=><path key={i} d={path(points)} fill="none" stroke="#78d6e9" strokeWidth="2" opacity=".7"/>)}
      {rail.length>0 ? rail.map((points,i)=><g key={i}>
        <path d={path(points)} fill="none" stroke="#17232b" strokeWidth="10" strokeLinecap="round"/>
        <path d={path(points)} fill="none" stroke="#ffd376" strokeWidth="5" strokeLinecap="round"/>
      </g>) : <>
        <path d={d} fill="none" stroke="#14212c" strokeWidth="14" strokeLinecap="round"/>
        <path d={d} fill="none" stroke="#ffd376" strokeWidth="7" strokeLinecap="round" pathLength="1" strokeDasharray="1 1" strokeDashoffset={shot==='regional'?1-move(p,0,.65):0}/>
      </>}
      <g opacity={focus?1:.42}>
        <circle cx={middle[0]} cy={middle[1]} r={focus?24+7*Math.sin(Math.PI*p):21} fill="none" stroke={mint} strokeWidth="3"/>
      </g>
      {[start,middle,end].map(([x,y],i)=><g key={i}>
        <circle cx={x} cy={y} r={8} fill={paper} stroke={ink} strokeWidth="4"/>
        <rect x={x+15} y={y-26} width={[239,150,151][i]} height="43" rx="4" fill="#0e2531" opacity=".95"/>
        <Text x={x+29} y={y+2} size={22} fill={paper}>{['Ga Bắc Kinh Nam','Ga Vũ Thanh','Ga Thiên Tân'][i]}</Text>
      </g>)}
      <text x="1066" y="575" textAnchor="middle" fontSize="23" fontWeight="700" fill="#b9e9f4" stroke="#183544" strokeWidth="4" paintOrder="stroke">Vịnh Bột Hải</text>
      <g transform="translate(1094 57)">
        <path d="M16 38V4l-10 21 10-7 10 7z" fill={paper}/><Text x={16} y={63} align="middle" size={16} fill={paper}>Bắc</Text>
      </g>
      <rect x="55" y="61" width="202" height="37" rx="4" fill="#132d36"/>
      <Text x={67} y={87} size={17} fill={mint}>VÙNG BẮC KINH–THIÊN TÂN</Text>
      <g transform="translate(62 544)">
        <rect width={detail?363:304} height="105" rx="5" fill="#142b35"/>
        <Text x={19} y={48} size={detail?42:28} fill="#ffd376">{detail?'116,55 km':focus?'Vũ Thanh':'Bắc Kinh → Thiên Tân'}</Text>
        <Text x={20} y={79} size={16} fill={paper}>{detail?'Chiều dài toàn tuyến theo hồ sơ dự án':focus?'Ga trung gian thuộc Thiên Tân':rail.length?'Đường sắt trên dữ liệu OpenStreetMap':'Hướng tuyến minh họa qua các ga'}</Text>
      </g>
      <g stroke={paper} strokeWidth="3"><path d="M1080 631v10h115v-10m-115 10v7m115-7v7" fill="none"/></g>
      <Text x={1137} y={620} align="middle" size={16} fill={paper}>≈ 20 km</Text>
      <Text x={1216} y={684} align="end" size={14} fill={paper}>{rail.length?'NASA / Blue Marble · © OpenStreetMap contributors':'NASA / Blue Marble · Tuyến khái quát'}</Text>
    </svg>
  </AbsoluteFill>;
}

function Graphic({p, frame, shot, cues}: Pace & {shot:LongShot; cues?: Cues}) {
  const {id,title}=shot;
  if(id==='history'||id==='time') return <Art bg={id==='history'?'#152c4c':'#f3eee1'}>
    <Text x={78} y={134} size={43} fill={id==='history'?paper:ink}>{title}</Text>
    <Text x={72} y={376} size={id==='history'?168:112} fill={id==='history'?mint:blue}>{id==='history'?'2008':'≈ 20 phút'}</Text>
    <path d="M80 443H1197" stroke={id==='history'?mint:coral} strokeWidth="3" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-move(p,0,.5)}/>
    <Text x={80} y={511} size={id==='history'?25:27} fill={id==='history'?paper:ink}>{id==='history'?'Bắc Kinh–Thiên Tân · Tốc độ thiết kế 350 km/h':'116,55 km ÷ 350 km/h × 60'}</Text>
    {id==='time'&&<Text x={80} y={571} size={22}>Giả định chạy đều ở 350 km/h suốt tuyến</Text>}
  </Art>;
  if(id==='profile'||id==='brake') {
    const braking=id==='brake';
    const curve=braking?'M163 273H496Q589 274 697 373T964 491H1148':'M155 540C248 533 273 271 443 265H805C1005 267 1016 528 1155 538';
    return <Art bg="#edf4ec">
      <Text x={76} y={115} size={42}>{title}</Text>
      <Text x={80} y={157} size={20} fill={blue}>ĐỒ THỊ MINH HỌA</Text>
      <path d="M155 235V540H1165" fill="none" stroke="#6b8d8a" strokeWidth="3"/>
      <Text x={155} y={215} size={18}>Tốc độ</Text>
      <Text x={1164} y={583} size={19} align="end">{braking?'Quãng đường':'Thời gian'}</Text>
      {braking ? <>
        <path d="M955 237V540" stroke={coral} strokeWidth="4" strokeDasharray="9 8"/>
        <Text x={957} y={210} size={17} align="middle">Vị trí cần chạy chậm</Text>
      </> : <path d={curve + ' L 1155 540 H 155 Z'} fill="#a3d3c2" opacity={move(p,.24,.84)*.55}/>}

      <path d={curve} fill="none" stroke={blue} strokeWidth="10" strokeLinecap="round" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-move(p,.02,.8)}/>
    </Art>;
  }
  if(id==='radius') return <Art bg="#fcf3db">
    <Text x={74} y={120} size={49}>{title}</Text>
    <path d="M98 505Q469 245 823 505" fill="none" stroke={blue} strokeWidth="9"/>
    <path d="M99 506Q469 137 823 506" fill="none" stroke={coral} strokeWidth="5" strokeDasharray="8 15" opacity=".8"/>
    <path d="M464 619V376" stroke="#274755" strokeWidth="3" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-move(p,0,.5)}/>
    <circle cx="465" cy="617" r="7" fill={blue}/>
    <Text x={851} y={428} size={54} fill={blue}>7.000 m</Text>
    <Text x={853} y={468} size={19}>Bán kính ngang thông thường</Text>
    <Text x={853} y={499} size={19}>cho tuyến thiết kế 350 km/h</Text>
    <Text x={853} y={572} size={16} fill="#52696c">World Bank · Bảng 4.1, 2019</Text>
  </Art>;
  if(id==='tunnel') {
    const t = frame / 24;
    const factors = cues ? [['slope','Độ dốc'],['curve','Đường cong'],['ground','Điều kiện đất đá'],['cost','Chi phí']] : [];
    return <Art bg="#dce8dc">
    <Text x={73} y={113} size={48}>{title}</Text>
    <path d="M0 579 197 524 395 311 574 253 748 323 1006 493 1280 527V720H0z" fill="#789a88"/>
    <path d="M0 589H1280" stroke="#466057" strokeWidth="68"/>
    <path d="M258 552H975" stroke="#102c37" strokeWidth="88" strokeLinecap="round"
      pathLength="1" strokeDasharray="1 1" strokeDashoffset={cues ? 1-motion(t,cues.entrance,cues.through+.3) : 0}/>
    <path d="M0 576H1280" stroke={mint} strokeWidth="3" strokeDasharray="17 13"/>
    <Train x={-220+1370*(cues ? straight(t,cues.entrance-.25,cues.ground+1.5) : p)} y={549} scale={.78}/>
    {factors.map(([key,label],index)=><g key={key} opacity={cues ? motion(t,cues[key],cues[key]+.3) : 0}>
      <rect x={73+252*index} y="164" width="230" height="52" rx="6" fill="#f7f2df"/>
      <Text x={89+252*index} y={197} size={20}>{label}</Text>
    </g>)}
    <Text x={84} y={660} fill={paper} size={21}>Mặt cắt minh họa · Cửa hầm và tuyến đi xuyên đồi</Text>
    </Art>;
  }
  const factory=id==='factory';
  const steps=factory?['Chuẩn bị khuôn','Đúc và kiểm tra','Chở ra công trường']:['Đến nhà ga','Đi tàu','Từ ga đến nơi cần đến'];
  return <Art bg={factory?'#e6eee9':'#183c62'}>
    <Text x={74} y={115} fill={factory?ink:paper} size={43}>{title}</Text>
    <path d="M224 397H1055" stroke={factory?'#799c91':mint} strokeWidth="5" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-move(p,0,.86)}/>
    {steps.map((step,i)=>{
      const x=224+i*415;
      const a=move(p,.05+i*.18,.26+i*.18);
      return <g key={step} opacity={.35+.65*a}>
        <circle cx={x} cy="397" r="12" fill={coral}/>
        {factory?<path d={'M'+(x-88)+' 350l36-21h140l-35 21z'} fill="#629a8a"/>
          :i===1?<Train x={x-88} y={342} scale={.61}/>:<path d={'M'+(x-65)+' 348v-71l65-43 65 43v71z'} fill="#84adb7"/>}
        <Text x={x} y={466} align="middle" size={22} fill={factory?ink:paper}>{step}</Text>
      </g>;
    })}
  </Art>;
}

function LongFilm({shots, stations, overview, rail, rivers}: LongProps) {
  const scenes:Record<string,React.ComponentType<Pace>>={
    hook:Opening,speed:Distance,disclaimer:Disclaimer,overview:p=><Locator {...p} overview={overview}/>,
    curve:Curves,land:Viaduct,signal:Signal,cab:Cab,girder:Bridge,cta:Closing,
  };
  return <AbsoluteFill>{shots.map(shot=>{
    const View=scenes[shot.id] || (['regional','stops','distance','recap'].includes(shot.id)
      ? (p:Pace)=><RegionalMap {...p} stations={stations} rail={rail} rivers={rivers} shot={shot.id}/>
      : (p:Pace)=><Graphic {...p} shot={shot}/>);
    return <Sequence key={shot.id} from={shot.start} durationInFrames={shot.frames} name={shot.id}>
      <Shot View={View}/>
    </Sequence>;
  })}</AbsoluteFill>;
}

function MovingGraphic({shot,p,frame,cues}:{shot:LongShot; cues?: Cues} & Pace) {
  const t=frame/24;
  if(shot.id==='curve') {
    const x=120+515*(cues ? straight(t,cues.advance,cues.tightCenter) + straight(t,cues.tightCenter,12.7) : 2*straight(t,1.9,12.7));
    const curve=(depth:number,width:number)=>depth*Math.exp(-Math.pow((x-638)/width,2));
    return <Art bg="#f3f0e4">
      <Text x={72} y={105} size={46}>Cua gắt và cua thoải</Text>
      <Text x={74} y={151} size={21} fill={blue}>Hai tàu cùng tiến về phía trước · Hình minh họa</Text>
      {[{y:338,depth:117,width:132,color:coral,label:'Cua gắt'},
        {y:570,depth:107,width:285,color:blue,label:'Cua thoải'}].map((row,i)=><g key={row.label} opacity={
          cues && t>=cues.tight && t<cues.advance && i===1 ? .55 :
            cues && t>=cues.gentle && i===0 ? .5 : 1}>
        <path d={Array.from({length:65},(_,i)=>{
          const px=100+i*16.8;
          return (i?'L':'M')+px+' '+(row.y-row.depth*Math.exp(-Math.pow((px-638)/row.width,2)));
        }).join(' ')} stroke={row.color} strokeWidth="11" fill="none"/>
        <circle cx={x} cy={row.y-curve(row.depth,row.width)} r="17" fill={paper} stroke={row.color} strokeWidth="6"/>
        <Text x={109} y={row.y+48} size={21} fill={row.color}>{row.label}</Text>
      </g>)}
      <path d={`M${x} 184V589`} stroke="#8c9895" strokeWidth="2" strokeDasharray="5 10" opacity=".45"/>
    </Art>;
  }
  if(shot.id==='profile'||shot.id==='brake') {
    const braking=shot.id==='brake';
    const travel=cues ? braking
      ? .32*straight(t,cues.travel,cues.slow)+.36*straight(t,cues.slow,cues.marker)+.16*straight(t,cues.marker,cues.curve)
        +.16*straight(t,cues.curve,12.8)
      : .035*straight(t,3,cues.accel)+.305*straight(t,cues.accel,cues.cruise)+.28*straight(t,cues.cruise,cues.brake)
        +.38*straight(t,cues.brake,cues.arrival+.36)
      : straight(t,braking?1.1:3.1,braking?13.4:8);
    const x=132+1007*travel;
    const curve=(u:number)=>braking?(.83-.62*motion(u,.32,.74)):
      .8*motion(u,.035,.34)*(1-motion(u,.62,.995));
    const y=(u:number)=>522-274*curve(u);
    const line=Array.from({length:101},(_,i)=>(i?'L':'M')+(132+10.07*i)+' '+y(i/100)).join(' ');
    const phase=cues ? (braking
      ? (t<cues.slow?'Tiến đến khu vực giới hạn':t<cues.range?'Giảm tốc trước vạch':'Dải giảm tốc bắt đầu trước vạch')
      : t<cues.accel?'Đứng tại ga':t<cues.cruise?'Tăng tốc':t<cues.brake?'Chạy ổn định':t<cues.arrival?'Giảm tốc':'Đến ga đích')
      : braking?(travel<.32?'Tiến đến khu vực giới hạn':travel<.73?'Giảm tốc trước vạch':'Đã giảm tốc'):travel<.16?'Rời ga':travel<.45?'Tăng tốc':travel<.68?'Chạy ổn định':'Giảm tốc về ga';
    return <Art bg="#edf4ec">
      <Text x={73} y={90} size={37}>{shot.title}</Text>
      <Text x={75} y={136} size={18} fill={blue}>ĐỒ THỊ MINH HỌA</Text>
      <rect x="74" y="597" width="1127" height="64" rx="7" fill="#163842"/>
      <Text x={98} y={637} size={25} fill={paper}>{phase}</Text>
      <path d="M131 221v302h1040" stroke="#759492" strokeWidth="3" fill="none"/>
      <Text x={130} y={199} size={17}>Tốc độ</Text>
      <Text x={1171} y={562} align="end" size={17}>{braking?'Khoảng cách':'Thời gian'}</Text>
      {!braking&&<path d={line+' L1139 522H132Z'} fill="#aadccb" opacity={motion(t,cues?.area??8.35,cues?.distance??10.25)*.88}/>}
      {braking&&<>
        <rect x="451" y="231" width="440" height="292" fill="#f7c7a4" opacity={motion(t,cues?.range??10.3,(cues?.range??11.3)+1)*.55}/>
        <g opacity={cues?motion(t,cues.marker,cues.marker+.3):1}><path d="M891 204V522" stroke={coral} strokeWidth="4" strokeDasharray="8 8"/>
        <Text x={891} y={193} align="middle" size={18}>Vị trí cần chạy chậm</Text></g>
      </>}
      <path d={line} stroke="#a8bcbe" strokeWidth="4" fill="none"/>
      <path d={line} stroke={blue} strokeWidth="8" fill="none" pathLength="1" strokeDasharray="1 1" strokeDashoffset={1-travel}/>
      <path d={`M${x} ${y(travel)}V522`} stroke={coral} strokeWidth="2" strokeDasharray="7 6"/>
      <circle cx={x} cy={y(travel)} r="11" fill={coral} stroke={paper} strokeWidth="3"/>
      {!braking&&t>(cues?.distance??8.35)&&<Text x={664} y={449} align="middle" size={19}>Diện tích dưới đường biểu diễn = quãng đường</Text>}
    </Art>;
  }
  if(shot.id==='signal') {
    const packet=straight(t,cues?.send??6,cues?.receive??10.95);
    const x=260+673*packet;
    const packetY=345-(cues?430:420)*packet*(1-packet)+(cues?107*packet**4:0);
    const tasks=['Thông số tuyến','Khoảng cách','Trạng thái đường đi'];
    return <Art bg="#101e2c">
      <Text x={76} y={104} size={44} fill={paper}>Dữ liệu đi từ mặt đất lên tàu</Text>
      <path d="M83 510H1197m-1114 22H1197" stroke="#446271" strokeWidth="5"/>
      <path d="M258 480V272m-15 37h30m-30 44h30" stroke={mint} strokeWidth="6"
        opacity={cues?motion(t,cues.ground,cues.ground+.3):1}/>
      <path d={cues?"M260 345Q594 130 890 333Q920 364 933 452":"M260 345Q594 130 933 345"} fill="none" stroke={mint} strokeWidth="3" strokeDasharray="9 10" strokeDashoffset={-frame*.4}/>
      <Train x={786+83*straight(t,0,13.5)} y={475} scale={.84}/>
      {tasks.map((task,i)=>{const s=cues?[cues.parameters,cues.distance,cues.status][i]:[6.07,7.5,8.25][i];return <g key={task} opacity={.18+.82*motion(t,s,s+.32)}>
        <rect x={346+i*198} y="372" width="184" height="41" rx="5" fill="#244d56"/>
        <Text x={438+i*198} y={399} align="middle" size={15} fill={paper}>{task}</Text>
      </g>;})}
      {t>=(cues?.send??6)&&t<=(cues?.receive??11.2)&&<circle cx={x} cy={packetY} r="10" fill={coral} stroke={paper} strokeWidth="2"/>}
      <Text x={257} y={597} align="middle" size={19} fill={paper}>Thiết bị mặt đất</Text>
      <Text x={937} y={597} align="middle" size={20} fill={t>=(cues?.receive??10.6)?mint:paper}>{t>=(cues?.receive??10.6)?'Tàu đã nhận dữ liệu':'Hệ thống trên tàu'}</Text>
      {cues&&t>=cues.speed&&<Text x={944} y={638} align="middle" size={18} fill={mint}>
        {t<cues.position?'Buồng lái · Tốc độ':'Buồng lái · Tốc độ và vị trí'}
      </Text>}
    </Art>;
  }
  if(shot.id==='factory'||shot.id==='station') {
    const factory=shot.id==='factory';
    const cuts=cues ? factory?[cues.yard,cues.mold,cues.cast,cues.check,cues.transport]:[cues.home,cues.station,cues.check,cues.board,cues.exit]
      :factory?[4.8,6.2,7.3,9.4,11.4]:[1.8,2.7,3.75,4.8,6.2];
    const stops=factory?['Bãi đúc','Chuẩn bị khuôn','Đúc dầm','Kiểm tra','Ra công trường']:['Từ nhà','Đến ga','Kiểm tra','Đi tàu','Đến đích'];
    const progress=cuts.reduce((sum,start)=>sum+motion(t,start,start+.71),0);
    const index=cues?Math.max(0,cuts.filter(cut=>t>=cut).length-1):Math.min(4,Math.floor(progress));
    const x=130+251*Math.max(0,progress-1);
    return <Art bg={factory?'#e6eee9':'#183c62'}>
      <Text x={74} y={112} size={41} fill={factory?ink:paper}>{shot.title}</Text>
      <path d="M131 453H1135" stroke={factory?'#799c91':'#689baf'} strokeWidth="4"/>
      <path d={`M131 453H${x}`} stroke={coral} strokeWidth="7"/>
      {stops.map((step,i)=><g key={step}>
        <circle cx={130+i*251} cy={453} r={index===i?12:7} fill={i<=index?coral:'#809a9d'}/>
        <Text x={130+i*251} y={505} align="middle" size={19} fill={factory?ink:paper}>{step}</Text>
      </g>)}
      {factory ? <g transform={`translate(${x} 0)`}>
        <path d="M-84 374l47-34h128l-40 34z" fill={t<(cues?.cast??6.2)?'#739a92':coral}/>
        <path d="M-84 374H51v28H-84z" fill={t<(cues?.cast??6.2)?'#49746d':'#bf502c'}/>
        <path d="M51 374l40-34v28l-40 34z" fill={t<(cues?.cast??6.2)?'#5d8982':'#da633a'}/>
        {t>=(cues?.check??7.28)&&t<(cues?.transport??8.8)&&<circle cy="358" r={34+10*Math.sin(t*7)} fill="none" stroke={blue} strokeWidth="3"/>}
      </g> : t>=(cues?.board??3.75)&&t<(cues?.exit??5.6) ? <Train x={x-108} y={367} scale={.77}/> :
        <g transform={`translate(${x} ${376-5*Math.abs(Math.sin(t*9))})`}>
          <circle cy="-50" r="13" fill={mint}/><path d="M0-32v42m-21-25 21-11 22 18M0 8l-19 31M0 8l23 26" stroke={mint} strokeWidth="9" strokeLinecap="round"/>
        </g>}
      <Text x={78} y={626} size={22} fill={factory?ink:paper}>
        {factory?(t<8.7?'Bãi đúc chuẩn bị dầm':t<11.4?'Công trường chuẩn bị trụ':'Dầm và trụ sẵn sàng lắp'):
          t<8.05?'Theo từng chặng từ cửa nhà đến nơi cần đến':t<10.5?'Đoạn đi tàu nằm ở giữa':'Cộng thời gian trước, trong và sau khi đi tàu'}
      </Text>
    </Art>;
  }
  return <Graphic {...{shot,p,frame,cues}}/>;
}

function MotionFilm({shots,stations,overview}:LongProps) {
  const mapChapters = ['overview','regional','stops','distance','recap'];
  const views:Record<string,React.ComponentType<Pace>> = {
    hook:Opening,speed:Distance,disclaimer:Disclaimer,land:Viaduct,cab:Cab,girder:Bridge,cta:Closing,
  };
  return <AbsoluteFill>{shots.map(shot=>{
    const View = mapChapters.includes(shot.id)
      ? ({frame}:Pace)=><MovingMap chapter={shot.id as MapChapter} stations={stations} overview={overview} t={frame/24}/>
      : views[shot.id] || ((pace:Pace)=><MovingGraphic {...pace} shot={shot}/>);
    return <Sequence key={shot.id} from={shot.start} durationInFrames={shot.frames} name={shot.id}>
      <Shot View={View}/>
    </Sequence>;
  })}</AbsoluteFill>;
}

type SyncedProps = {
  shots: LongShot[];
  overview: Point;
  roadMap: RoadMapProps;
  cues: Record<string,Cues>;
  technical?: boolean;
};

function SyncedFilm({shots, overview, roadMap, cues, technical}: SyncedProps) {
  const current = useCurrentFrame();
  const shot = shots.find(({start,frames})=>current >= start && current < start + frames);
  if (!shot) return <AbsoluteFill style={{background:ink}}/>;
  const frame = current - shot.start;
  const t = frame / 24;
  const pace = {p: frame / Math.max(1, shot.frames - 1), frame};
  const c = cues[shot.id];
  if (shot.id === 'overview' && t < c.tianjin) return <Locator {...pace} p={.05+.9*straight(t,c.beijing,c.tianjin)} overview={overview}/>;
  if (shot.id === 'recap' && t >= c.rail) {
    if (t < c.signal) {
      const f = straight(t,c.rail,c.signal);
      if (technical) return <EngineeringBeat id="curve" c={cues.curve} t={6.5+4.2*f}/>;
      return <MovingGraphic shot={{...shot,id:'curve'}} p={f} frame={140+150*f}/>;
    }
    if (t < c.build) {
      const f = straight(t,c.signal,c.build);
      if (technical) return <EngineeringBeat id="signal" c={cues.signal} t={6+5.4*f}/>;
      return <MovingGraphic shot={{...shot,id:'signal'}} p={f} frame={144+176*f}/>;
    }
    if (technical && t < c.summary) return <EngineeringBeat id="girder" c={cues.girder} t={3.8+5.2*straight(t,c.build,c.summary)}/>;
    if (t < c.summary) return <Bridge {...pace} p={.1+.85*straight(t,c.build,c.summary)}/>;
    return <ContextBeat id={shot.id} t={t} c={c}/>;
  }
  if (roadMap.shots.some(({id})=>id===shot.id)) return <RoadMap {...roadMap} cues={c}/>;
  if (technical && engineeringIds.includes(shot.id)) return <EngineeringBeat id={shot.id} c={c} t={t}/>;
  const views: Record<string,React.ComponentType<Pace & {cues?: Cues}>> = {
    hook:Opening,speed:Distance,land:Viaduct,cab:Cab,girder:Bridge,
  };
  const View = views[shot.id];
  if (View) return <View {...pace} cues={c}/>;
  if (['disclaimer','history','time','radius','cta'].includes(shot.id)) return <ContextBeat id={shot.id} t={t} c={c}/>;
  return <MovingGraphic shot={shot} {...pace} cues={c}/>;
}

function Root() {
  const longDefaults:LongProps={shots:[{id:'hook',start:0,frames:240,title:''}],stations:defaults.stations,overview:defaults.overview,rail:[],rivers:[]};
  return <><Composition id="ChinaRailDocumentary" component={Documentary} width={1920} height={1080} fps={30}
    durationInFrames={2265} defaultProps={defaults} calculateMetadata={({props})=>({
      durationInFrames:props.chapters.reduce((sum,index)=>sum+index.frames,0),
    })}/>
    <Composition id="ChinaRailLong" component={LongFilm} width={1920} height={1080} fps={24}
      durationInFrames={240} defaultProps={longDefaults}
      calculateMetadata={({props})=>({durationInFrames:props.shots.reduce((total,shot)=>total+shot.frames,0)})}/>
    <Composition id="ChinaRailMotion" component={MotionFilm} width={1920} height={1080} fps={24}
      durationInFrames={240} defaultProps={longDefaults}
      calculateMetadata={({props})=>({durationInFrames:props.shots.reduce((total,shot)=>total+shot.frames,0)})}/>
    <Composition id="ChinaRailSynced" component={SyncedFilm} width={1920} height={1080} fps={24}
      durationInFrames={7200} defaultProps={{shots:[],overview:defaults.overview,roadMap:roadMapDefaults,cues:{}}}/>
  </>;
}
registerRoot(Root);
