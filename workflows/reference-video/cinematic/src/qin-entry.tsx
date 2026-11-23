import type {ReactNode} from 'react';
import {AbsoluteFill, Composition, registerRoot, staticFile, useCurrentFrame} from 'remotion';
import './economy-story/fonts.css';
import {Callout, Earthwork, Figure, Photo, PitModel, T, cream, gold, ink, mint, muted, photoCredits, smooth, type Point} from './qin-models';

type Shot = {id:string; title:string; start:number; frames:number; cues:number[]};
type MapIndex = {region:Record<string,Point>; site:Record<string,Point>};
type Props = {shots:Shot[]; maps:MapIndex};
type Scene = {shot:Shot; beat:number; p:number; q:number; maps:MapIndex};

function Stage({title,kind,children,note,light=false}:{
  title:string;kind:string;children:ReactNode;note?:string;light?:boolean;
}) {
  const text=light?ink:cream;
  return <AbsoluteFill style={{background:light?'#ece4cf':'#17292a'}}>
    <svg viewBox="0 0 1280 720" width="100%" height="100%" style={{fontFamily:'"Economy Be Vietnam Pro", sans-serif'}}>
      <defs>
        <radialGradient id="qin-dark" cx="58%" cy="52%" r="82%">
          <stop stopColor="#34443b"/><stop offset="1" stopColor="#141f21"/>
        </radialGradient>
        <pattern id="qin-grid" width="34" height="34" patternUnits="userSpaceOnUse">
          <path d="M0 34V0H34" fill="none" stroke={light?'#a69478':'#91a592'} opacity=".18" strokeWidth=".65"/>
        </pattern>
        <pattern id="strata" width="17" height="12" patternUnits="userSpaceOnUse">
          <path d="M0 5l17 4M2 10l7 2" stroke="#c0a171" opacity=".45" strokeWidth="1.2"/>
        </pattern>
        <linearGradient id="qin-photo" x2="0%" y2="100%">
          <stop stopColor="#0d1819" stopOpacity=".89"/><stop offset=".32" stopColor="#0d1819" stopOpacity="0"/>
          <stop offset=".71" stopColor="#0d1819" stopOpacity="0"/><stop offset="1" stopColor="#0d1819" stopOpacity=".89"/>
        </linearGradient>
        <clipPath id="qin-map"><rect x="43" y="154" width="914" height="502" rx="7"/></clipPath>
      </defs>
      <rect width="1280" height="720" fill={light?'#eee6d2':'url(#qin-dark)'}/>
      <rect x="35" y="30" width="1210" height="657" fill="url(#qin-grid)"/>
      {children}
      <path d="M64 69h29" stroke={light?'#976347':gold} strokeWidth="4" strokeLinecap="round"/>
      <T x={108} y={74} size={14} color={light?'#6a6456':muted}>{kind}</T>
      <T x={63} y={128} size={39} color={text}>{title}</T>
      {note && <>
        <path d="M64 638h1152" fill="none" stroke={light?'#b1a58b':'#69766b'} opacity=".65"/>
        <T x={64} y={674} size={17} color={light?'#555843':gold}>{note}</T>
      </>}
    </svg>
  </AbsoluteFill>;
}

function PhotoScene({shot, p, name, note, focus}:{shot:Shot;p:number;name:string;note?:string;focus?:string}) {
  return <Stage title={shot.title} kind="ẢNH TƯ LIỆU" note={note}>
    <Photo name={name} p={p} focus={focus} credit={false}/>
    <rect width="1280" height="632" fill="url(#qin-photo)"/>
    {note && <rect y="625" width="1280" height="95" fill="#172522" opacity=".96"/>}
    <rect x="906" y="591" width="310" height="27" rx="4" fill="#182723" opacity=".87"/>
    <T x={1203} y={609} anchor="end" size={12}>Ảnh · {photoCredits[name]}</T>
  </Stage>;
}

function HeritageMap({maps,region,p,beat,heading,wide=false}:{
  maps:MapIndex;region:boolean;p:number;beat:number;heading:string;wide?:boolean;
}) {
  const category=region?'region':'site';
  const labels=maps[category];
  const nx=43, ny=154;
  const scale = region ? .94+.03*p : .91+.14*smooth(p);
  const translateX = region ? -9 : -55*smooth(p);
  const translateY = region ? -74 : -57-41*smooth(p);
  const point=(key:string):Point=>[
    nx+labels[key][0]*scale+translateX,ny+labels[key][1]*scale+translateY,
  ];
  const [mX,mY]=point('mound'), [pX,pY]=point('pits');
  const marks = region
    ? [['xian','Tây An',-28,-16],['lintong','Lâm Đồng',-98,15],['mount','Núi Ly Sơn',-24,29],['mound','Quần thể lăng',-115,-17]] as const
    : [['mound','Gò lăng',-67,-24],['pits','Hố tượng binh mã',-31,-29]] as const;
  return <Stage title={heading} kind="BẢN ĐỒ ĐỊNH VỊ · THIỂM TÂY">
    <g clipPath="url(#qin-map)">
      <image href={staticFile(`map-${category}.webp`)} x={nx+translateX} y={ny+translateY} width={1000*scale} height={650*scale}/>
      {!region && <path d={`M${mX} ${mY}L${pX} ${pY}`} stroke="#533d3a" strokeWidth="2"
        strokeDasharray="6 7" fill="none" opacity={.45+.48*p}/>}
      {marks.map(([key,name,dx,dy])=>{
        const [x,y]=point(key);
        const focus=key===(region?'lintong':beat===0?'mound':'pits');
        return <g key={key}>
          {focus && <circle cx={x} cy={y} r={11+9*Math.sin(Math.PI*p)**2} fill="none" stroke="#8d4336" strokeWidth="2"/>}
          <circle cx={x} cy={y} r={key==='mount'?4:7} fill={key==='pits'?'#1f675d':'#9d503c'} stroke="#fbf3dd" strokeWidth="2"/>
          <text x={x+dx} y={y+dy} fontSize="16" fontWeight="800" paintOrder="stroke"
            stroke="#f4edd9" strokeWidth="4.5" strokeLinejoin="round" fill="#243837">{name}</text>
        </g>;
      })}
      <path d="M901 182l9 25-9-6-9 6z" fill={ink}/>
      <T x={900} y={227} size={14} color={ink} anchor="middle">Bắc</T>
      <rect x="58" y="613" width="268" height="33" rx="4" fill="#f4efdf" opacity=".92"/>
      <T x={67} y={634} size={12} color={ink}>© OpenStreetMap · OpenMapTiles · OpenFreeMap</T>
    </g>
    <rect x="977" y="154" width="261" height="502" rx="7" fill="#243a37" stroke="#687141"/>
    <T x={996} y={204} size={19} color={gold}>Lâm Đồng, Tây An</T>
    <T x={996} y={241} size={14} color={muted}>Địa điểm theo hồ sơ UNESCO</T>
    <path d="M997 264h220" stroke="#6a7864" opacity=".7"/>
    <circle cx="1004" cy="318" r="6" fill="#d28368"/>
    <T x={1024} y={323} size={17}>Gò lăng</T>
    <circle cx="1004" cy="368" r="6" fill={mint}/>
    <T x={1024} y={373} size={17}>Các hố binh mã</T>
    <T x={996} y={459} size={14} color={muted}>Đường sá hiện đại</T>
    <T x={996} y={485} size={14} color={muted}>Tỷ lệ bản đồ thay đổi khi phóng</T>
    {wide && <T x={996} y={555} size={28} color={gold}>56,25 km²</T>}
    <T x={996} y={626} size={11} color={muted}>openstreetmap.org/copyright</T>
  </Stage>;
}

function Timeline({shot,beat,q}:Scene) {
  const ticks=[['246 TCN','Doanh Chính lên ngôi vua Tần'],['221 TCN','Xưng Tần Thủy Hoàng'],['210 TCN','Tần Thủy Hoàng qua đời']];
  const cursor=166+466*beat+33*smooth(q);
  return <Stage title={shot.title} kind="DÒNG THỜI GIAN · NHÀ TẦN" light>
    <path d="M165 391h949" stroke="#b0a488" strokeWidth="4"/>
    <path d={`M165 391H${cursor}`} stroke="#935841" strokeWidth="4"/>
    {ticks.map(([year,label],i)=><g key={year} opacity={i<=beat?1:.44}>
      <circle cx={165+466*i} cy="391" r={i===beat?12:7} fill="#955c42"/>
      <T x={165+466*i} y={340} size={45} color={ink} anchor="middle">{year}</T>
      <T x={165+466*i} y={456} size={17} color={ink} anchor="middle">{label}</T>
    </g>)}
  </Stage>;
}

function Discovery({shot,beat,p,q}:Scene) {
  if(beat===2) return <PhotoScene shot={shot} name="pit" p={q} note="Hố số 1 hiện nằm dưới nhà che của bảo tàng"/>;
  return <Stage title={shot.title} kind="MẶT CẮT · MINH HỌA" note={beat===0?'1974 · Người dân tìm thấy mảnh gốm khi đào giếng':'Mảnh gốm dẫn đến một cuộc khảo sát lớn hơn'}>
    <path d="M151 264 1109 253 1191 335 225 354Z" fill="#9d9565"/>
    <path d="M225 354 1191 335V568L225 594Z" fill="#765943"/>
    <path d="M225 354 1191 335V568L225 594Z" fill="url(#strata)"/>
    <path d="M502 338l38-4v216l-42 2z" fill="#322a22"/>
    <path d="M499 336l-29-26 40-11 39 27-11 15z" fill="#2c2922"/>
    <path d={`M513 315V${416+68*smooth(p)}`} stroke="#e6cca0" strokeWidth="2"/>
    <path d="M574 471l24-12 21 9-8 20-27 11-15-10z" fill="#c79264" stroke="#ecd4a0" strokeWidth="2"
      opacity={smooth(q*5)}/>
    <Callout x={714} y={448} to={[601,477]} text={beat===0?'Mảnh tượng đất nung':'Manh mối bên thành hố'}/>
    <T x={245} y={239} size={52} color={gold}>1974</T>
  </Stage>;
}

function Material({shot,beat,q}:Scene) {
  const paint=shot.id==='color'||shot.id==='conserve';
  const flakes=beat>=1 && paint;
  const labels=paint?['Nền gốm','Lớp sơn lót','Lớp màu']:['Tạo phần thân','Ghép đầu và tay','Nung và hoàn thiện'];
  return <Stage title={shot.title} kind="MÔ HÌNH VẬT LIỆU" note={shot.id==='conserve'
    ? ['Khai quật làm thay đổi môi trường','Ghi vị trí và ổn định lớp màu','Cần phương án bảo tồn ngay sau phát hiện'][beat]
    :paint?['Tô màu minh họa trên hình','Lớp sơn có thể co và bong khi đổi độ ẩm','Giữ và nghiên cứu dấu vết màu'][beat]:labels[beat]}>
    <Figure x={389} y={593} scale={1.97} paint={paint&&!(flakes&&q>.5)} explode={shot.id==='making'&&beat<2?1-smooth(beat===0?0:q):0} variant={1}/>
    {paint ? <g transform="translate(658 239)">
      <path d="M0 191h417v58H0z" fill="#a57c54"/>
      <path d="M0 170h417v21H0z" fill="#3b2629"/>
      <path d="M0 143h417v27H0z" fill="#aa5244"/>
      {flakes&&[0,1,2,3].map(i=><path key={i} d={`M${71+i*91} ${145-30*smooth(q)}l27-4 13 8-27 6z`}
        fill={i%2?'#803c41':'#bf674f'} stroke={gold} strokeWidth="1.2"/>)}
      <T x={30} y={128} size={17}>Màu</T><T x={28} y={185} size={15}>Sơn lót</T><T x={28} y={226} size={18}>Gốm</T>
      <T x={0} y={291} size={15} color={muted}>Các lớp được phóng đại</T>
    </g>:<g transform="translate(655 252)">
      {labels.map((name,i)=><g key={name} opacity={i===beat?1:.55}>
        <circle cx="17" cy={25+92*i} r={i===beat?10:6} fill={gold}/>
        <T x={53} y={33+92*i} size={24}>{name}</T>
      </g>)}
      <path d="M17 38V202" stroke="#b0956d" strokeWidth="1.3"/>
    </g>}
  </Stage>;
}

function RecordScene({shot,beat,p,q}:Scene) {
  if(shot.id==='mercury'||shot.id==='survey'||shot.id==='mound') {
    if(shot.id==='mound'&&beat===0) return <PhotoScene shot={shot} name="mound" p={q}
      note="Gò lăng nhìn từ mặt đất · ảnh năm 1987"/>;
    const notes=shot.id==='mercury'?['Sơ đồ phép đo từ bên ngoài · không biểu diễn dữ liệu đo','Một số vị trí có tín hiệu cao hơn mức nền','Buồng mộ trung tâm chưa được khai quật trực tiếp']
      :shot.id==='survey'?['Đối chiếu vị trí, bản đồ và phép đo','Quét bề mặt theo từng đường · mô phỏng','Diễn giải bằng nhiều nguồn dữ kiện']
        :['Gò nằm phía tây nhóm hố tượng','Vùng minh họa dưới gò · sơ đồ không theo tỷ lệ','Buồng mộ trung tâm chưa được khai quật trực tiếp'];
    return <Stage title={shot.id==='mound'?'Mặt cắt minh họa gò lăng':shot.title}
      kind={shot.id==='mercury'?'NGHIÊN CỨU NĂM 2020 · MÔ PHỎNG PHÉP ĐO':'MẶT CẮT · MINH HỌA'} note={notes[beat]}>
      <Earthwork p={p} mode={shot.id} beat={beat}/>
    </Stage>;
  }
  return <Stage title={shot.title} kind="GHI CHÉP CỔ · TƯ MÃ THIÊN" light note={['Sử ký được viết sau thời nhà Tần','Thủy ngân trong ghi chép về sông và biển','Đối chiếu văn bản với dữ kiện khảo cổ'][beat]}>
    <g transform={`translate(${95-27*p} 190)`}>
      <path d="M0 12q205-34 408 0v376q-208-21-408 0zm408 0q196-37 407 0v376q-194-24-407 0z" fill="#f8edcc" stroke="#a38354" strokeWidth="2"/>
      <path d="M408 12v375" stroke="#aa8a5b" strokeWidth="3"/>
      <T x={48} y={83} size={44} color={ink}>Sử ký</T><T x={54} y={114} size={17} color="#785f45">Tư Mã Thiên</T>
      {[0,1,2,3,4].map(i=><path key={i} d={`M54 ${161+30*i}h${290-((i*43)%87)}`} stroke="#b29b78" strokeWidth="3"/>)}
      {beat>=1 && <>
        <path d="M472 266Q534 147 611 210T769 129" fill="none" stroke="#939978" strokeWidth="13"
          pathLength="1" strokeDasharray="1" strokeDashoffset={1-smooth(q*2)} />
        <T x={477} y={305} size={19} color={ink}>Sông và biển trong sử liệu</T>
      </>}
    </g>
    {beat===2 && <g><rect x="902" y="222" width="294" height="265" rx="6" fill="#d8d7bc"/>
      <T x={925} y={279} size={22} color={ink}>Khảo sát hiện đại</T>
      <T x={925} y={331} size={17} color={ink}>Địa hình</T><T x={925} y={373} size={17} color={ink}>Tín hiệu đo được</T>
    </g>}
  </Stage>;
}

function FieldLab({shot,beat,q}:Scene) {
  const craft=shot.id==='craft';
  const shapes=['M-35-48l29-25 18 23-17 47-33-14z','M-9-73l30-11 24 20-5 32-30 7-16-20z',
    'M-6-4l13-33 32 9 12 32-31 21-23-7z','M-39-14l29 12 8 24-35 17-9-23z'];
  return <Stage title={shot.title} kind="SƠ ĐỒ PHƯƠNG PHÁP KHẢO CỔ"
    note={(craft?['Ghi nhận mẫu lặp trong các nhóm hiện vật','So sánh kích thước và nhóm đặc điểm','Đặt các kết quả cạnh vị trí tìm thấy']:
      ['Ghi lại hình dạng và mép vỡ của từng mảnh','Đối chiếu, thử ghép và ghi lại vị trí','Tượng trưng bày có thể trải qua nhiều bước phục chế'])[beat]}>
    {craft ? <>
      {[0,1,2].map(group=><g key={group}>
        <rect x={116+354*group} y="231" width="302" height="284" rx="8" fill="#27332d" stroke={group===beat?gold:'#667962'}/>
        {Array.from({length:8},(_,i)=>{
          const x=156+354*group+70*(i%4),y=323+111*Math.floor(i/4);
          return <g key={i} transform={`translate(${x} ${y}) rotate(${(i*21)%33-18})`} opacity={.45+.55*smooth(q*3+i*.17)}>
            {beat===2?<circle r={6+i%3*2} fill={group===0?gold:group===1?mint:'#d5a185'}/>:
              <path d="M-12-18l15 6 10 23-6 7-11-10-9-19z" fill="#ba9d67" stroke="#dfc496" strokeWidth="1.5"/>}
          </g>;
        })}
      </g>)}
      {beat===1&&<path d={`M115 ${299+102*smooth(q)}h1062`} stroke={mint} strokeDasharray="6 7" opacity=".66"/>}
    </>:<>
      <rect x="250" y="195" width="780" height="377" rx="12" fill="#c6a97c" stroke="#d9bc8f" strokeWidth="3"/>
      <rect x="277" y="219" width="726" height="327" rx="8" fill="#6a5340"/>
      {!beat&&[0,1,2].map(i=><path key={i} d={`M${459+i*180} 220v326`} stroke="#a1845c" opacity=".8"/>)}
      {shapes.map((shape,i)=>{
        const offset=beat===0?1:beat===1?1-smooth(q):0;
        const angle=offset*[-30,28,64,-15][i];
        return <path key={i} transform={`translate(${641+offset*[-235,-94,93,239][i]} ${392+offset*[5,-19,-8,4][i]}) rotate(${angle}) scale(2.12)`}
          d={shape} fill={['#c09162','#a67b56','#cda47a','#b18559'][i]} stroke="#e1b789" strokeWidth="1.35"/>;
      })}
    </>}
  </Stage>;
}

function Detail({shot,beat,p,q}:Scene) {
  if(shot.id==='pit1') {
    if(beat>0) return <PhotoScene shot={shot} name={beat===1?'pit':'rows'} p={q} note="Các hàng tượng và vách đất ở hố số 1"/>;
    return <Stage title={shot.title} kind="MÔ HÌNH HỐ KHAI QUẬT" note="Các vách đất chia hố thành hành lang song song">
      <PitModel pit={1} beat={beat} p={p}/>
    </Stage>;
  }
  if(shot.id==='pit2'&&beat!==1 || shot.id==='pit3') {
    return <Stage title={shot.title} kind="BỐ CỤC MINH HỌA · KHÔNG THEO TỶ LỆ"
      note={shot.id==='pit2'?'Hố 2 có tượng xạ thủ, kỵ binh, ngựa và chiến xa':
        ['Hố 3 có bố cục riêng','Vai trò chỉ huy là cách diễn giải khảo cổ','Ba hố cung cấp những loại dữ kiện khác nhau'][beat]}>
      {shot.id==='pit3' && beat===2 ? <g>
        {[['Hố 1','M140 270h308v151H140z'],['Hố 2','M492 278h278v62h-70v94H492z'],['Hố 3','M860 295h111v35h74v60h-74v35H860z']].map(([label,d],i)=>
          <g key={label}><path d={d} fill={i===beat?'#95734e':'#654e3a'} stroke={gold} strokeWidth="2"/>
            <T x={290+345*i} y={492} size={23} anchor="middle">{label}</T></g>)}
      </g>:<PitModel pit={shot.id==='pit2'?2:3} beat={beat} p={p}/>}
    </Stage>;
  }
  const name=shot.id==='pit2'?'archer':shot.id==='chariot'?'carriage':'figure';
  const notes=shot.id==='pit2'?['','Xạ thủ quỳ · hiện vật từ hố số 2','']:
    shot.id==='chariot'?['Xe ngựa đồng · hiện vật trong quần thể lăng','Ngựa, càng xe, bánh xe và mui','Đối chiếu vật liệu, tỷ lệ và công dụng']:
      ['Búi tóc và áo giáp','Dáng tay và tư thế đứng','Những biến thể trên khuôn mặt'];
  const target=shot.id==='chariot'?[[418,348],[659,410],[851,360]][beat]:[[607,255],[603,382],[604,278]][beat];
  return <Stage title={shot.title} kind="ẢNH HIỆN VẬT" note={notes[beat]}>
    <Photo name={name} x={150} y={155} w={920} h={460} p={q*.77} contain={name!=='carriage'}/>
    {shot.id==='faces'&&<Callout x={851} y={target[1]-58} to={target as Point} text={['Tóc và búi tóc','Áo giáp và tay','Khuôn mặt'][beat]}/>}
    {shot.id==='chariot'&&beat===1&&<g>
      <rect x="190" y="514" width="499" height="42" rx="5" fill="#172523" opacity=".9"/>
      <T x={205} y={541} size={16} color={gold}>Bốn ngựa  ·  Càng xe  ·  Bánh xe  ·  Mui xe</T>
    </g>}
  </Stage>;
}

function Content(props:Scene) {
  const {shot,beat,p,q,maps}=props;
  switch(shot.id) {
    case 'hook':
      return beat===0?<PhotoScene shot={{...shot,title:'Tần Thủy Hoàng · Hố binh mã số 1'}} name="pit" p={q}
        note="Ảnh thật tại hố số 1 · Lâm Đồng, Tây An"/>:
        <HeritageMap maps={maps} region={false} p={p} beat={beat-1} heading={shot.title}/>;
    case 'scope':
      return <Stage title={shot.title} kind="LƯU Ý" light>
        <rect x="74" y="192" width="1116" height="347" rx="10" fill="#ded2b5"/>
        {['Ảnh thật tại di tích và bảo tàng','Mặt cắt, hình khối là mô phỏng','Sử ký là ghi chép cổ'].map((text,i)=>
          <g key={text} opacity={i<2||beat>0?1:.34}><circle cx="127" cy={273+i*85} r="6" fill="#894d3b"/>
            <T x={158} y={283+i*85} size={29} color={ink}>{text}</T></g>)}
      </Stage>;
    case 'who':
      return <Timeline {...props}/>;
    case 'map':
      return <HeritageMap maps={maps} region={beat===0} p={q} beat={Math.max(0,beat-1)} heading={shot.title}/>;
    case 'complex':
    case 'other':
      if(shot.id==='other'&&beat===1) return <Stage title={shot.title} kind="ẢNH HIỆN VẬT · HỐ PHỤ" note="Quần thể có những nhóm tượng ngoài binh sĩ">
        <Photo name="acrobat" x={370} y={151} w={536} h={475} p={q} contain/>
      </Stage>;
      return <Stage title={shot.title} kind="MÔ HÌNH VỊ TRÍ · KHÔNG THEO TỶ LỆ"
        note={shot.id==='complex'&&beat===2?'56,25 km² · Diện tích khu di sản theo UNESCO':'Gò, tường bao và các hố phụ trong khu an táng'}>
        <Earthwork p={p} mode={shot.id} beat={beat}/>
      </Stage>;
    case 'discovery':
      return <Discovery {...props}/>;
    case 'pit1': case 'pit2': case 'pit3': case 'faces': case 'chariot':
      return <Detail {...props}/>;
    case 'making': case 'color': case 'conserve':
      return <Material {...props}/>;
    case 'mound': case 'chronicle': case 'mercury': case 'survey':
      return <RecordScene {...props}/>;
    case 'craft': case 'restore':
      if(shot.id==='restore'&&beat===2) return <PhotoScene shot={shot} name="rows" p={q}
        note="Một phần tượng trong hố số 1 đã được ghép và dựng lại"/>;
      return <FieldLab {...props}/>;
    case 'unesco':
      return <HeritageMap maps={maps} region={beat===0} p={q} beat={beat} heading={shot.title} wide/>;
    case 'recap':
      return beat===0?<PhotoScene shot={shot} name="pit" p={q} note="Hố khai quật cho biết vị trí của tượng và hiện vật"/>:
        beat===1?<RecordScene {...props} shot={{...shot,id:'chronicle'}} beat={2}/>:
          <HeritageMap maps={maps} region={false} p={q} beat={1} heading={shot.title}/>;
    default:
      if(beat===0) return <PhotoScene shot={shot} name="rows" p={q} note="Quan sát hàng tượng, vách đất và những khoảng trống"/>;
      return <Stage title={shot.title} kind="TẦN THỦY HOÀNG · LĂNG MỘ VÀ ĐỘI QUÂN ĐẤT NUNG">
        {['Cách làm tượng đất nung','Khảo sát lòng đất'].map((text,i)=><g key={text} opacity={smooth(q*5-i*.7)}>
          <rect x={68+580*i} y="222" width="543" height="119" rx="10" fill="#415147" stroke="#a0865d"/>
          <T x={98+580*i} y={294} size={29}>{text}</T>
        </g>)}
        <g opacity={smooth((q-.53)*4)}>
          <T x={69} y={436} size={23}>Bình luận chủ đề bạn chọn</T>
          <rect x="69" y="486" width="323" height="72" rx="8" fill={gold}/>
          <T x={99} y={532} size={27} color={ink}>Đăng ký kênh</T>
        </g>
      </Stage>;
  }
}

function QinFilm({shots,maps}:Props) {
  const frame=useCurrentFrame();
  const shot=shots.find(item=>frame>=item.start&&frame<item.start+item.frames);
  if(!shot) return <AbsoluteFill style={{background:ink}}/>;
  const local=frame-shot.start;
  const beat=shot.cues.filter(cue=>local>=cue).length-1;
  const a=shot.cues[beat], z=shot.cues[beat+1]??shot.frames;
  return <Content shot={shot} beat={beat} maps={maps} p={local/shot.frames} q={(local-a)/(z-a)}/>;
}

registerRoot(()=><Composition id="QinMausoleum" component={QinFilm} width={1920} height={1080}
  fps={24} durationInFrames={14400} defaultProps={{shots:[],maps:{site:{},region:{}}}}/>);
