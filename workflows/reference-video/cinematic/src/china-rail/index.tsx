import React from 'react';
import {Audio} from '@remotion/media';
import {AbsoluteFill, Composition, Easing, interpolate, registerRoot, Sequence, staticFile, useCurrentFrame, useVideoConfig} from 'remotion';
import '../economy-story/fonts.css';

const paper = '#f2e6c9';
const ink = '#111d26';
const gold = '#f0bb60';
const teal = '#8dd7c4';
const orange = '#ee624b';
const muted = '#aabdc1';
const phases = ['hook', 'disclaimer', 'route', 'track', 'signal', 'build', 'payoff', 'cta'] as const;
type Phase = typeof phases[number];
type Shot = {id: Phase; start: number; frames: number};
type FilmProps = {shots: Shot[]; audio?: string};

function ramp(p: number, from: number, to: number) {
  return interpolate(p, [from, to], [0, 1], {
    extrapolateLeft: 'clamp', extrapolateRight: 'clamp', easing: Easing.inOut(Easing.cubic),
  });
}

function Text({x, y, children, size = 24, color = paper, center = false, weight = 700}: {
  x: number; y: number; children: React.ReactNode; size?: number; color?: string; center?: boolean; weight?: number;
}) {
  return <text x={x} y={y} fontSize={size} fontWeight={weight} fill={color} textAnchor={center ? 'middle' : 'start'}>{children}</text>;
}

function Train({x, y, scale = 1}: {x: number; y: number; scale?: number}) {
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="49" rx="310" ry="16" fill="#050d13" opacity=".65"/>
    {[-242, -165, -74, 60, 146, 235].map(w => <circle key={w} cx={w} cy="34" r="13" fill="#121c24" stroke="#6a7d87" strokeWidth="4"/>)}
    <path d="M-310 15V-25Q-310-44-285-44H174Q223-44 257-18L306 18Q318 28 292 34H-287Q-310 34-310 15z" fill="url(#train)"/>
    <path d="M-308 11H229Q267 11 290 21L299 26H-304z" fill={orange}/>
    <path d="M198-36Q228-35 254-17L275-2H222L195-28z" fill="#163341"/>
    {[-276,-235,-194,-153,-112,-71,-30,11,52,93,134].map(w => <rect key={w} x={w} y="-28" width="28" height="17" rx="5" fill="#1c3946"/>)}
    <line x1="-82" x2="-82" y1="-43" y2="33" stroke="#68868f" strokeWidth="2"/>
    <line x1="76" x2="76" y1="-43" y2="33" stroke="#68868f" strokeWidth="2"/>
    <path d="M274 16h18l10 7h-19z" fill="#fff9d2"/>
  </g>;
}

function Hook({p, frame}: {p: number; frame: number}) {
  const km = Math.round(350 * ramp(p, .04, .45));
  return <>
    <rect y="355" width="1280" height="365" fill="url(#earth)"/>
    {Array.from({length: 18}, (_, j) => {
      const x = (((j * 161 - frame * (5 + j % 3)) % 1540) + 1540) % 1540 - 160;
      return <line key={j} x1={x} y1={360 + j * 16} x2={x + 170} y2={360 + j * 16} stroke={j % 3 === 0 ? gold : teal} strokeWidth={1 + j % 3} opacity=".22"/>;
    })}
    <path d="M0 565H1280M0 581H1280" stroke="#879291" strokeWidth="5"/>
    <Train x={-380 + 1250 * ramp(p, 0, .69) + 330 * p} y={492} scale={1.65}/>
    <Text x={74} y={111} color={teal}>TÀU CAO TỐC TRUNG QUỐC</Text>
    <Text x={70} y={283} size={164}>{km}</Text>
    <Text x={400} y={276} size={51} color={gold}>km/h</Text>
    <g opacity={ramp(p, .36, .6)}><Text x={77} y={336} size={28} color={muted}>≈ 97 mét mỗi giây</Text></g>
  </>;
}

function Disclaimer({p}: {p: number}) {
  return <>
    <path d="M0 570H1280M0 592H1280" stroke="#38505a" strokeWidth="2"/>
    <path d="M155 177v356" stroke={gold} strokeWidth="5" strokeDasharray="356" strokeDashoffset={356 * (1 - ramp(p, 0, .4))}/>
    <circle cx="197" cy="227" r="13" fill={gold}/>
    <Text x={232} y={245} size={45}>Miễn trừ trách nhiệm</Text>
    <Text x={194} y={327} size={29} weight={400}>Video nhằm mục đích giáo dục.</Text>
    <Text x={194} y={382} size={29} weight={400}>Hình ảnh là mô phỏng đơn giản hóa.</Text>
    <Text x={194} y={437} size={29} weight={400}>Tốc độ thực tế thay đổi theo từng tuyến.</Text>
    <g opacity=".44"><Train x={-400 + p * 1650} y={540} scale={.64}/></g>
  </>;
}

function Route({p}: {p: number}) {
  const points = [[357,244],[496,276],[610,342],[695,371],[890,454]];
  const routeLength = 613;
  return <>
    <g transform="translate(156 79) rotate(-12 480 320)" opacity=".6">
      {Array.from({length: 10}, (_, i) => <path key={i} d={`M ${-200 + i*120} 70 l 390 560 m -490 -190 l 800 -290`} stroke="#35535a" strokeWidth="1.5" fill="none"/>)}
    </g>
    <path d="M357 244 496 276 610 342 695 371 890 454" stroke="#385258" fill="none" strokeWidth="23" strokeLinecap="round" strokeLinejoin="round"/>
    <path d="M357 244 496 276 610 342 695 371 890 454" stroke={gold} fill="none" strokeWidth="10" strokeLinecap="round" strokeLinejoin="round" strokeDasharray={routeLength} strokeDashoffset={routeLength * (1 - ramp(p, .03, .57))}/>
    {points.map(([x,y], i) => <circle key={x} cx={x} cy={y} r={i === 0 || i === 4 ? 15 : 7} fill={i === 0 || i === 4 ? paper : gold} opacity={ramp(p, i*.11, i*.11+.13)}/>)}
    <Text x={88} y={107} size={25} color={teal}>TUYẾN LIÊN THÀNH PHỐ</Text>
    <Text x={346} y={200} size={48} center>Bắc Kinh</Text>
    <g opacity={ramp(p, .35, .58)}><Text x={891} y={524} size={48} center>Thiên Tân</Text></g>
    <Text x={91} y={578} size={73}>2008</Text>
    <Text x={93} y={621} size={22} color={muted}>Năm khai trương</Text>
    <Text x={907} y={649} size={19} color={muted}>Sơ đồ tuyến minh họa</Text>
  </>;
}

function Track({p, frame}: {p: number; frame: number}) {
  const bridge = ramp(p, .32, .66);
  const train = ramp(p, .54, .98);
  return <>
    <rect y="382" width="1280" height="338" fill="url(#earth)"/>
    <path d="M0 456 155 389Q202 368 260 394L392 436 594 455 728 395Q820 342 913 395L1090 470 1280 418V720H0z" fill="#243d43"/>
    <path d="M-10 580Q490 586 626 493T1290 579" stroke="#638784" fill="none" strokeWidth="27"/>
    {[0,1,2,3,4,5,6].map(i => {
      const x = (i * 244 + frame * 5) % 1570 - 110;
      return <g key={i} transform={`translate(${x} ${569 - 101 * Math.exp(-Math.pow((x - 715) / 294, 2))})`}>
        <rect x="-15" y="-11" width="39" height="20" rx="4" fill={i % 2 === 0 ? muted : orange}/>
        <rect x="-5" y="-10" width="22" height="9" rx="2" fill="#e5dbc5"/>
      </g>;
    })}
    <g opacity={bridge}>
      {[130,300,470,640,810,980,1150].map((x,i) => <rect key={x} x={x} y="348" width="22" height={92 + (i % 3) * 20} fill="#809698"/>)}
      <path d="M0 348Q520 308 1280 350" stroke="#aabcb5" fill="none" strokeWidth="23"/>
      <path d="M0 336Q520 296 1280 338" stroke={gold} fill="none" strokeWidth="4"/>
      <Train x={-350+train*1980} y={302} scale={.59}/>
    </g>
    <Text x={80} y={135} size={68}>Đường riêng, cua thoải</Text>
    <g opacity={bridge}><Text x={87} y={253} size={27} color={gold}>Cầu cạn và đường hầm</Text></g>
    <Text x={80} y={655} size={24} color={teal}>Đường bộ</Text>
  </>;
}

function Signal({p, frame}: {p: number; frame: number}) {
  const signal = ramp(p, .2, .62);
  return <>
    <path d="M0 600 278 427 1003 427 1280 602V720H0z" fill="#0b141b" stroke="#304650" strokeWidth="3"/>
    <path d="M370 425 591 249M906 425 689 249M507 425l116-176M773 425 659 249" stroke="#678187" strokeWidth="6"/>
    <path d="M308 434 401 235Q423 190 478 190H805Q854 190 875 235L974 434" stroke="#2b4954" strokeWidth="28" fill="none"/>
    <rect x="343" y="456" width="597" height="175" rx="25" fill="#1a3741" stroke="#4c7378" strokeWidth="3"/>
    <rect x="374" y="478" width="535" height="130" rx="12" fill="#0f252f"/>
    <path d="M833 303Q974 323 870 468" stroke={gold} fill="none" strokeWidth="4" strokeDasharray="8 12" strokeDashoffset={-frame * .7} opacity={signal}/>
    <circle cx="833" cy="303" r={8 + (frame % 48) / 6} stroke={gold} strokeWidth="2" fill="none" opacity={signal}/>
    <Text x={640} y={105} size={57} center>Dữ liệu vào buồng lái</Text>
    <Text x={640} y={153} size={22} color={muted} center>Thông tin đoạn tuyến phía trước</Text>
    <g opacity={signal}>
      <Text x={415} y={520} size={20} color={teal}>TỐC ĐỘ</Text>
      <Text x={415} y={576} size={31}>Đang theo dõi</Text>
      <Text x={671} y={520} size={20} color={teal}>VỊ TRÍ TÀU</Text>
      <path d="M673 566h177" stroke={muted} strokeWidth="3"/>
      <circle cx={675+173 * ramp(p, .5, 1)} cy="566" r="10" fill={orange}/>
    </g>
  </>;
}

function Build({p}: {p: number}) {
  const bridgeXs = [95, 385, 675, 965];
  const travel = ramp(p, .08, .4);
  const lower = ramp(p, .4, .67);
  const next = ramp(p, .7, .98);
  const x = -290 + 675 * travel + 290 * next;
  return <>
    <rect y="541" width="1280" height="179" fill="url(#earth)"/>
    {bridgeXs.map(x => <g key={x}>
      <path d={`M${x-26} 545V439H${x+26}V545z`} fill="#819799"/>
      <rect x={x-47} y="424" width="94" height="18" rx="3" fill="#b4c1b5"/>
    </g>)}
    <rect x="95" y="393" width="290" height="30" rx="2" fill="#9aa9a1"/>
    <g transform={`translate(${x} 0)`}>
      <path d="M0 420V246H290V420M0 254h290M0 254l65 48 65-48 65 48 65-48" fill="none" stroke={gold} strokeWidth="9"/>
      <rect x="111" y="230" width="60" height="24" rx="4" fill={orange}/>
      {p < .7 && <path d={`M74 258v${51+lower*84}m140 ${-51-lower*84}v${51+lower*84}`} stroke={paper} strokeWidth="3"/>}
    </g>
    <rect x={-290+675*travel} y={309+84*lower} width="290" height="30" rx="2" fill={teal}/>
    <Text x={76} y={116} size={61}>Mỗi nhịp, cùng một cách lắp</Text>
    <Text x={78} y={169} size={24} color={muted}>Dầm đúc sẵn · Thiết bị dùng cho nhiều nhịp</Text>
    <g opacity={ramp(p,.28,.45)}><Text x={115} y={615} color={gold}>Đưa dầm tới</Text></g>
    <g opacity={ramp(p,.49,.62)}><Text x={467} y={615} color={gold}>Đặt lên trụ</Text></g>
    <g opacity={ramp(p,.72,.91)}><Text x={790} y={615} color={gold}>Chuyển sang nhịp kế</Text></g>
  </>;
}

function Payoff({p}: {p: number}) {
  return <>
    <Text x={79} y={133} size={55}>Tốc độ đến từ cả hệ thống</Text>
    <path d="M0 493H1280M0 523H1280" stroke={muted} strokeWidth="4"/>
    <path d="M0 391H1280" stroke="#34666a" strokeWidth="3" strokeDasharray="15 12"/>
    <Train x={-310+1060*ramp(p,.04,.65)+180*p} y={428} scale={1.26}/>
    {['Đoàn tàu','Đường ray','Tín hiệu'].map((name, i) =>
      <g key={name} opacity={ramp(p,.12*i+.1,.12*i+.28)}>
        <circle cx={164+i*375} cy="607" r="7" fill={i===0?orange:teal}/>
        <Text x={188+i*375} y={617} size={33}>{name}</Text>
      </g>)}
  </>;
}

function Cta({p}: {p: number}) {
  return <>
    <path d="M-100 606Q467 627 950 518T1320 436M-100 629Q467 643 950 542T1320 460" fill="none" stroke="#40616b" strokeWidth="4"/>
    <Text x={638} y={193} size={58} center>Bạn muốn xem tiếp về</Text>
    <Text x={638} y={267} size={61} color={teal} center>nhà ga hay cầu cạn?</Text>
    <g opacity={ramp(p,.28,.66)} transform={`translate(0 ${20*(1-ramp(p,.28,.66))})`}>
      <rect x="470" y="342" width="340" height="83" rx="41" fill={orange}/>
      <path d="M524 371v26l22-13z" fill="#fff3d9"/>
      <Text x={674} y={395} size={31} color="#111d26" center>Đăng ký kênh</Text>
    </g>
  </>;
}

function Scene({id}: {id: Phase}) {
  const frame = useCurrentFrame();
  const {durationInFrames} = useVideoConfig();
  const p = frame / Math.max(1, durationInFrames - 1);
  const artwork = {
    hook: <Hook p={p} frame={frame}/>, disclaimer: <Disclaimer p={p}/>, route: <Route p={p}/>,
    track: <Track p={p} frame={frame}/>, signal: <Signal p={p} frame={frame}/>,
    build: <Build p={p}/>, payoff: <Payoff p={p}/>, cta: <Cta p={p}/>,
  };
  return <AbsoluteFill style={{backgroundColor: ink}}>
    <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{fontFamily: '"Economy Be Vietnam Pro", Arial, sans-serif'}}>
      <defs>
        <radialGradient id="sky" cx="62%" cy="19%" r="90%"><stop stopColor="#264655"/><stop offset="1" stopColor={ink}/></radialGradient>
        <linearGradient id="earth" x2="0" y2="1"><stop stopColor="#263c43"/><stop offset="1" stopColor="#101923"/></linearGradient>
        <linearGradient id="train" x2="0" y2="1"><stop stopColor="#fff0cf"/><stop offset=".52" stopColor="#e7e3d7"/><stop offset="1" stopColor="#91a2a2"/></linearGradient>
        <pattern id="grid" width="46" height="46" patternUnits="userSpaceOnUse"><path d="M46 0H0V46" stroke="#b4d6d6" strokeOpacity=".11" fill="none"/></pattern>
      </defs>
      <rect width="1280" height="720" fill="url(#sky)"/>
      <rect width="1280" height="720" fill="url(#grid)"/>
      <rect x="41" y="40" width="1198" height="640" rx="2" stroke="#9cb8b8" opacity=".26" fill="none"/>
      {artwork[id]}
    </svg>
  </AbsoluteFill>;
}

function Film({shots, audio}: FilmProps) {
  return <AbsoluteFill style={{backgroundColor: ink}}>
    {shots.map(({id, start, frames}) => <Sequence key={id} from={start} durationInFrames={frames} name={id}><Scene id={id}/></Sequence>)}
    {audio && <Audio src={staticFile(audio)}/>}
  </AbsoluteFill>;
}

const fallback = phases.map((id, i) => ({id, start: i * 120, frames: 120}));
function Root() {
  return <Composition id="ChinaHighSpeedRail" component={Film} width={1920} height={1080} fps={30}
    durationInFrames={960} defaultProps={{shots: fallback} satisfies FilmProps}
    calculateMetadata={({props}) => ({durationInFrames: props.shots.reduce((sum, shot) => sum + shot.frames, 0)})}/>;
}
registerRoot(Root);
