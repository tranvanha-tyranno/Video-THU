import React from 'react';
import {AbsoluteFill} from 'remotion';
import {motion, straight} from './motion-revision';

export type Cues = Record<string, number>;
const navy = '#142c35';
const white = '#f7f2df';
const gold = '#ffd875';
const teal = '#9be7ca';
const orange = '#ee724a';
const font = '"Economy Be Vietnam Pro", sans-serif';

function Type({x, y, size, fill = white, children}: {
  x: number; y: number; size: number; fill?: string; children: React.ReactNode;
}) {
  return <text x={x} y={y} fill={fill} fontSize={size} fontWeight={800}>{children}</text>;
}

function Panel({children, title, light = false}: {children: React.ReactNode; title: string; light?: boolean}) {
  return <AbsoluteFill>
    <svg width="100%" height="100%" viewBox="0 0 1280 720" style={{fontFamily: font}}>
      <rect width="1280" height="720" fill={light ? white : navy}/>
      <path d="M74 80h34" stroke={light ? orange : teal} strokeWidth="5" strokeLinecap="round"/>
      <Type x={74} y={135} size={42} fill={light ? navy : white}>{title}</Type>
      {children}
    </svg>
  </AbsoluteFill>;
}

export function ContextBeat({id, t, c}: {id: string; t: number; c: Cues}) {
  const show = (name: string) => motion(t, c[name], c[name] + .3);
  if (id === 'disclaimer') {
    const rows = [
      ['education','Video nhằm mục đích giáo dục'],
      ['position','Bản đồ dùng để định vị'],
      ['simplify','Hình kỹ thuật đã được giản lược'],
      ['assumption','Ví dụ tính toán có ghi rõ giả định'],
      ['schedule','Hãy kiểm tra lịch chạy chính thức trước chuyến đi'],
    ];
    return <Panel title="Miễn trừ trách nhiệm">
      {rows.map(([key, label], i) => <g key={key} opacity={show(key)}>
        <circle cx="84" cy={248 + i * 69} r="6" fill={teal}/>
        <Type x={111} y={259 + i * 69} size={28}>{label}</Type>
      </g>)}
    </Panel>;
  }
  if (id === 'history') return <Panel title="Tuyến Bắc Kinh – Thiên Tân">
    <g opacity={show('month')}><Type x={71} y={349} size={109} fill={teal}>Tháng 8</Type></g>
    <g opacity={show('year')}><Type x={546} y={349} size={143}>2008</Type></g>
    <path d="M77 406h1125" stroke="#42616a" strokeWidth="2"/>
    <g opacity={show('olympics')}><Type x={79} y={470} size={29}>Khai trương trước Thế vận hội Bắc Kinh</Type></g>
    <g opacity={show('design')}>
      <rect x="76" y="516" width="523" height="69" rx="7" fill={t >= c.emphasis ? gold : '#244650'}/>
      <Type x={99} y={560} size={24} fill={t >= c.emphasis ? navy : white}>Tốc độ thiết kế</Type>
      <g opacity={show('limit')}><Type x={326} y={560} size={34} fill={t >= c.emphasis ? navy : gold}>350 km/h</Type></g>
    </g>
  </Panel>;
  if (id === 'time') {
    const steps = [['leave','Rời ga'],['accelerate','Tăng tốc'],['adjust','Điều chỉnh'],['brake','Giảm tốc']];
    const active = steps.filter(([key]) => t >= c[key]).length - 1;
    return <Panel title={t < c.reality ? 'Nếu chạy đều ở 350 km/h' : 'Một chuyến tàu thực tế'} light>
      {t < c.reality ? <>
        <g opacity={show('length')}><Type x={76} y={276} size={56} fill={navy}>116,55 km</Type></g>
        <g opacity={show('divide')}><Type x={410} y={276} size={56} fill={navy}>÷ 350 km/h</Type></g>
        <g opacity={show('convert')}><Type x={786} y={276} size={56} fill={navy}>× 60</Type></g>
        <path d="M76 322h1111" stroke="#d0b79a" strokeWidth="2"/>
        <g opacity={show('result')}><Type x={73} y={503} size={115} fill="#155566">≈ 20 phút</Type></g>
      </> : <>
        <path d="M127 351H1149" stroke="#b6c4b6" strokeWidth="5"/>
        {steps.map(([key, label], index) => <g key={key}>
          <circle cx={127 + 301 * index} cy="351" r={index === active ? 20 : 12}
            fill={index <= active ? orange : '#a8b8ac'}/>
          <Type x={103 + 301 * index} y={422} size={29} fill={navy}>{label}</Type>
        </g>)}
      </>}
    </Panel>;
  }
  if (id === 'radius') {
    const radius = 92 + 122 * show('large');
    return <Panel title="Bán kính cong nhìn từ trên cao" light>
      <g opacity={show('circle')}>
        <circle cx="368" cy="434" r={radius} fill="none" stroke="#9aaea5" strokeWidth="3"/>
        <circle cx="368" cy="434" r="5" fill={navy}/>
        <path d={`M368 434V${434 - radius}`} stroke={navy} strokeWidth="3" opacity={.3 + .7 * show('radius')}/>
        <path d={`M314 ${434 - Math.sqrt(radius ** 2 - 54 ** 2)} A${radius} ${radius} 0 0 1 422 ${434 - Math.sqrt(radius ** 2 - 54 ** 2)}`}
          fill="none" stroke={orange} strokeWidth="10" strokeLinecap="round" opacity={.4 + .6 * show('arc')}/>
        <path d={`M304 ${415 - radius}h128`} stroke="#256874" strokeWidth="2" strokeDasharray="6 5" opacity={show('straight')}/>
      </g>
      <g opacity={show('number')}>
        <Type x={708} y={348} size={87} fill="#155566">7.000 m</Type>
        <Type x={712} y={413} size={21} fill={navy}>Bán kính ngang thông thường</Type>
        <Type x={712} y={451} size={21} fill={navy}>cho tuyến thiết kế 350 km/h</Type>
        <Type x={712} y={518} size={17} fill="#46646b">Ngân hàng Thế giới · Bảng 4.1</Type>
      </g>
    </Panel>;
  }
  if (id === 'cta') {
    return <Panel title={t < c.question ? 'Nhìn phần đường sắt phía trước tàu' : 'Bạn muốn xem tiếp chủ đề nào?'}>
      <g opacity={1 - show('question')}>
        <path d="M110 508Q561 424 938 221" fill="none" stroke="#678f92" strokeWidth="31"/>
        <path d="M110 508Q561 424 938 221" fill="none" stroke={teal} strokeWidth="7" pathLength="1"
          strokeDasharray="1 1" strokeDashoffset={1 - straight(t, 0, c.rail + .6)}/>
      </g>
      {t >= c.question && <>
        <g opacity={show('station')}>
          <rect x="74" y="222" width="530" height="147" rx="12" fill="#23505a"/>
          <path d="M114 303v-31l38-29 38 29v31m-55 0v-30h34v30" stroke={teal} strokeWidth="4" fill="none"/>
          <Type x={222} y={307} size={35}>Nhà ga</Type>
        </g>
        <g opacity={show('bridge')}>
          <rect x="630" y="222" width="572" height="147" rx="12" fill="#23505a"/>
          <path d="M669 269h85m-74 2v32m63-32v32" stroke={teal} strokeWidth="5" fill="none"/>
          <Type x={782} y={307} size={35}>Cầu cạn</Type>
        </g>
        <g opacity={show('comment')}><Type x={76} y={478} size={29}>Bình luận chủ đề bạn chọn</Type></g>
        <g opacity={show('subscribe')}>
          <rect x="76" y="512" width="333" height="68" rx="34" fill={gold}/>
          <path d="M110 533v25l22-12z" fill={navy}/>
          <Type x={151} y={556} size={26} fill={navy}>Đăng ký kênh</Type>
        </g>
      </>}
    </Panel>;
  }
  const items = [['Đường ray','Cua thoải và tuyến riêng'],['Tín hiệu','Thông tin đi vào buồng lái'],['Thi công','Lắp cầu theo từng nhịp']];
  return <Panel title="Ba phần của một hành trình cao tốc">
    {items.map(([heading, detail], i) => <g key={heading}>
      <path d={`M76 ${229+i*118}h1123`} stroke="#41616a" strokeWidth="1.5"/>
      <Type x={76} y={296+i*118} size={43} fill={teal}>{heading}</Type>
      <Type x={475} y={294+i*118} size={25}>{detail}</Type>
    </g>)}
  </Panel>;
}
