import type {ReactNode} from 'react';
import {Img, staticFile} from 'remotion';
import {block, project, type Camera, type Face, type Vec} from './china-rail/engineering-mesh';

export const ink='#17292a';
export const cream='#f3ebd7';
export const gold='#f6c77a';
export const mint='#a6ded0';
export const muted='#bac1ae';
export const clamp=(x:number)=>Math.min(1,Math.max(0,x));
export const smooth=(x:number)=>{const a=clamp(x);return a*a*(3-2*a);};
export type Point=[number,number];

export function T({x,y,size=20,color=cream,anchor='start',children,weight=700}:{
  x:number;y:number;size?:number;color?:string;anchor?:'start'|'middle'|'end';children:ReactNode;weight?:number;
}) {
  return <text x={x} y={y} fontSize={size} fill={color} fontWeight={weight} textAnchor={anchor}>{children}</text>;
}

export const photoCredits:Record<string,string>={
  pit:'Renek78 · CC0', rows:'Jmhullot · CC BY 3.0', archer:'Difference engine · CC BY-SA 4.0',
  figure:'Gary Lee Todd · CC0', carriage:'Gary Todd · CC0', acrobat:'Gary Lee Todd · CC0',
  mound:'Nathan Hughes Hamilton · CC BY 2.0',
};

export function Photo({name,x=0,y=0,w=1280,h=720,p=0,focus='center',contain=false,credit=true}:{
  name:string;x?:number;y?:number;w?:number;h?:number;p?:number;focus?:string;contain?:boolean;credit?:boolean;
}) {
  return <foreignObject x={x} y={y} width={w} height={h}>
    <div style={{position:'relative',width:'100%',height:'100%',overflow:'hidden',background:'#141d1b'}}>
      <Img src={staticFile(name+'.webp')} style={{width:'100%',height:'100%',objectFit:contain?'contain':'cover',
        objectPosition:focus, transform:`scale(${1+.09*p})`}}/>
      {credit && <div style={{position:'absolute',right:12,bottom:9,fontSize:12,fontWeight:650,padding:'4px 8px',
        color:cream,background:'#142321e8',borderRadius:3}}>Ảnh · {photoCredits[name]}</div>}
    </div>
  </foreignObject>;
}

export function Callout({x,y,to,text,color=gold}: {x:number;y:number;to:Point;text:string;color?:string}) {
  return <g>
    <path d={`M${x} ${y+11}h40L${to[0]} ${to[1]}`} fill="none" stroke={color} strokeWidth="1.4"/>
    <circle cx={to[0]} cy={to[1]} r="4" fill={color}/>
    <T x={x} y={y} size={17} color={color}>{text}</T>
  </g>;
}

export function Earthwork({p,mode,beat}:{p:number;mode:string;beat:number}) {
  const camera:Camera={yaw:.62+.15*p,pitch:.45,zoom:66,x:634,y:430};
  const terra:[string,string,string]=['#9c7c51','#654a37','#7d5a3d'];
  const grass:[string,string,string]=['#9a9a6e','#595e46','#7d805b'];
  const cut:[string,string,string]=['#a17b52','#775037','#946542'];
  const highlighted=mode==='mound'||mode==='mercury'||mode==='survey';
  const moundCenter:Vec=[-2,0,0];
  const ground=block([0,-.6,0],[13,1.08,7.05],terra);
  const steps=[...block([-2,.16,0],[4.1,.33,3.65],grass),...block([-2,.53,0],[3.25,.42,2.87],grass),
    ...block([-2,.91,0],[2.48,.40,2.24],grass),...block([-2,1.26,0],[1.65,.31,1.48],grass)];
  const details:Face[]=highlighted?[]:[
    ...block([-2,.06,-2.66],[6.2,.16,.12],cut),...block([-2,.06,2.66],[6.2,.16,.12],cut),
    ...block([-5.1,.08,0],[.12,.13,5.32],cut),...block([1.1,.08,0],[.12,.13,5.32],cut),
    ...[[-1.85,3.55],[-.7,3.54],[1,2.89]].flatMap(([z,x])=>block([x,.02,z],[2.47,.13,.7],['#342b22','#3b2f26','#513d2d'])),
  ];
  const faces=[...steps,...details];
  const dot=(point:Vec):Point=>{const [x,y]=project(point,camera);return [x,y];};
  const [x,y]=dot(moundCenter);
  return <g>
    {ground.map((face,i)=><polygon key={i} points={face.points.map(point=>dot(point).join(',')).join(' ')} fill={face.fill}/>)}
    {faces.map((face,i)=>({face,i,depth:face.points.reduce((sum,point)=>sum+project(point,camera)[2],0)/face.points.length}))
      .sort((a,b)=>a.depth-b.depth).map(({face,i})=><polygon key={i}
        points={face.points.map(point=>dot(point).join(',')).join(' ')} fill={face.fill} stroke={face.fill} strokeWidth=".65"/>)}
    {!highlighted && <>
      <Callout x={183} y={267} to={dot([-2,1.35,.05])} text="Gò lăng"/>
      {beat>0&&<Callout x={913} y={307} to={dot([3.7,.14,-.72])} text="Hố binh mã" color={mint}/>}
    </>}
    {highlighted && <>
      <Callout x={181} y={265} to={dot([-2,1.35,.1])} text="Gò lăng trên mặt đất"/>
      {beat>0 && <g>
        <rect x={x-100} y={y+18} width="177" height="67" rx="5" stroke="#f0c188" strokeWidth="2"
          strokeDasharray="8 6" opacity=".88" fill="#2c2520"/>
        <T x={x-11} y={y+58} size={28} anchor="middle" color={gold}>?</T>
        {mode==='mound' ? <>
          <path d={`M${x+77} ${y+62}L${x+116} ${y+106}h29`} fill="none" stroke={gold} strokeWidth="1.5"/>
          <rect x={x+143} y={y+83} width="374" height="47" rx="5" fill="#1b2522"/>
          <T x={x+155} y={y+111} size={16} color={gold}>Buồng mộ trung tâm chưa khai quật trực tiếp</T>
        </> : <Callout x={x+115} y={y+105} to={[x+76,y+67]} text="Vùng dưới gò · chưa khai quật trực tiếp"/>}
      </g>}
    </>}
    {mode==='survey' && [0,1,2,3,4].map(i=>{
      const scan=((p*1.45+i*.16)%1);
      const start=dot([-4.1+4.2*scan,.055,-2.43]),end=dot([-4.1+4.2*scan,.055,2.41]);
      return <path key={i} d={`M${start.join(' ')}L${end.join(' ')}`} stroke={mint} strokeWidth="2" opacity={.2+i*.135}/>;
    })}
    {mode==='mercury' && [[-3.6,-1.75],[-1.3,-2.25],[-.05,-.2],[-3.1,1.65],[-.9,1.68]].map(([a,z],i)=>{
      const [xx,yy]=dot([a,1.47,z]);
      return <g key={i} opacity={.22+.75*Math.sin(p*8+i)**2}>
        <circle cx={xx} cy={yy} r="12" fill="none" stroke={mint} strokeWidth="1.8"/><circle cx={xx} cy={yy} r="3.4" fill={mint}/>
      </g>;
    })}
  </g>;
}

export function Figure({x,y,scale=1,paint=false,explode=0,kneel=false,variant=0}:{
  x:number;y:number;scale?:number;paint?:boolean;explode?:number;kneel?:boolean;variant?:number;
}) {
  const clay=paint?'#8c5650':'#b68d64';
  const dark=paint?'#592d30':'#78583f';
  const skin=paint?'#d3a17a':'#c6a27b';
  return <g transform={`translate(${x} ${y}) scale(${scale})`}>
    <ellipse cx="0" cy="4" rx="40" ry="9" fill="#101815" opacity=".38"/>
    <path d={kneel?'M-30-58l-9 24 4 22h30l3 12h34l9-16-23-28 5-14z':'M-25-65-27-16l-10 14H-8l8-13 8 13h31L27-14l-4-51z'}
      fill={paint?'#708371':dark} stroke="#4c4030" strokeWidth="1.3"/>
    <path d="M-27-124l12-10h32l17 11 4 52-12 15h-53l-13-18z" fill={clay} stroke="#5e4838" strokeWidth="2"/>
    <path d="M-24-120-15-129h25l18 12-2 46-16 10h-21l-14-8z" fill={dark}/>
    {scale>.5 && Array.from({length:5},(_,row)=>Array.from({length:5},(_,col)=><rect key={row*5+col} x={-20+col*8.5}
      y={-118+row*9} width="7.6" height="7.1" rx="1.3" fill={paint?'#b5735b':'#bd956f'} opacity={.72+.27*((row+col)%3)/2}/>))}
    <g transform={`translate(${-28*explode} 0)`}>
      <path d="M-31-121l-13 16 2 33 12 17 8-10-10-15 4-28z" fill={clay} stroke={dark} strokeWidth="1.6"/>
    </g>
    <g transform={`translate(${28*explode} 0)`}>
      <path d={variant%2?'M30-122l13 12 5 21-27 11-5-10 17-9-7-14z':'M30-122l15 18-3 31-15 20-7-9 12-17-4-23z'}
        fill={clay} stroke={dark} strokeWidth="1.6"/>
    </g>
    <g transform={`translate(0 ${-31*explode})`}>
      <path d="M-8-135v-11H9v11z" fill={skin}/>
      <path d={variant%3===0?'M-17-169l7-12h21l9 16-3 17-9 10-15-2-11-12z':
        'M-18-168l9-15h23l8 13-1 16-10 15H-8l-9-13z'} fill={skin} stroke={dark} strokeWidth="1.7"/>
      <path d="M-19-163l2-17 10-7 21 2 7 7 1 16-10-13-17 2-9 11z" fill="#584537"/>
      <path d="M4-183l6-9 9 1 4 8-8 2z" fill="#48392f"/>
      <path d="M-10-163h5m13 0h5m-13 0-2 10h4m-7 5q7 3 13-1" fill="none" stroke={dark} strokeWidth="1.5"/>
    </g>
  </g>;
}

export function PitModel({pit,beat,p}:{pit:number;beat:number;p:number}) {
  const shift=34*p;
  return <g transform={`translate(${-shift} ${9*shift/34})`}>
    <path d="M175 205 1010 205 1176 478 340 478Z" fill="#9d7550"/>
    <path d="M340 478h836v49H341l-166-272v-50z" fill="#674d38"/>
    <path d="M195 228 986 229 1128 451 339 446Z" fill="#493b31"/>
    {Array.from({length:pit===1?8:pit===2?5:3},(_,r)=>{
      const y=247+r*(pit===1?25:pit===2?42:58);
      const offset=(y-228)*.63;
      return <g key={r}>
        <path d={`M${205+offset} ${y}h770l12 15h-770z`} fill={r%2===0?'#ad8053':'#93704b'}/>
        {Array.from({length:pit===1?15:pit===2?10:5},(_,i)=>{
          // Leave one section eroded and partially empty in the illustrative trench.
          if(beat===1&&((r>3&&i>8)||((i+r*3)%11===0))) return null;
          return <Figure key={i} x={243+offset+i*(pit===1?48:pit===2?62:102)} y={y+11} scale={.124+.004*r}
            variant={r+i} kneel={pit===2&&r<2}/>;
        })}
      </g>;
    })}
    {pit===1 && <Callout x={839} y={185} to={[962,263]} text="Vách đất giữa các hành lang"/>}
    {pit===2 && <Callout x={811} y={181} to={[870,283]} text="Các nhóm tượng khác nhau"/>}
    {pit===3 && <Callout x={850} y={181} to={[945,317]} text="Sơ đồ giản lược"/>}
  </g>;
}
