export type Vec = [number, number, number];
export type Face = {points: Vec[]; fill: string; edge?: string};
export type Camera = {yaw: number; pitch: number; zoom: number; x: number; y: number; aim?: Vec};

export function block(center: Vec, size: Vec, paints: [string, string, string], yaw = 0): Face[] {
  const [w, h, d] = size.map(value => value / 2);
  const [x, y, z] = center;
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const points = ([
    [-w,-h,-d],[w,-h,-d],[w,h,-d],[-w,h,-d],
    [-w,-h,d],[w,-h,d],[w,h,d],[-w,h,d],
  ] as Vec[]).map(([u,v,p]): Vec => [x+c*u-s*p,y+v,z+s*u+c*p]);
  return [
    {points: [3,7,6,2].map(i => points[i]), fill: paints[0]},
    {points: [4,5,6,7].map(i => points[i]), fill: paints[1]},
    {points: [1,2,6,5].map(i => points[i]), fill: paints[2]},
    {points: [0,4,7,3].map(i => points[i]), fill: paints[2]},
    {points: [0,3,2,1].map(i => points[i]), fill: paints[1]},
  ];
}

export function project([x, y, z]: Vec, camera: Camera) {
  const [a, b, d] = camera.aim ?? [0,0,0];
  const vx = x-a, vy = y-b, vz = z-d;
  const sin = Math.sin(camera.yaw), cos = Math.cos(camera.yaw);
  const depth = vx*sin + vz*cos;
  const pitch = Math.sin(camera.pitch), lift = Math.cos(camera.pitch);
  return [camera.x + camera.zoom*(vx*cos - vz*sin),
    camera.y + camera.zoom*(depth*pitch - vy*lift), depth*lift+vy*pitch] as const;
}

const steel: [string,string,string] = ['#adbab8','#647d81','#879b9b'];
const gravel: [string,string,string] = ['#405056','#293c43','#30464c'];
const concrete: [string,string,string] = ['#9aaba8','#506e72','#6d8684'];
export const gold = '#ffd18b';
export const aqua = '#89e2d0';

export function track(x: number, y: number, z: number, length: number, fine = false): Face[] {
  const pieces: Face[] = [];
  const segments = Math.ceil(length / 1.08);
  const span = length / segments;
  for (let i = 0; i < segments; i++) {
    const center = x - length/2 + span*(i + .5);
    pieces.push(...block([center,y-.13,z],[span,.25,1.42],gravel));
    for (const edge of [-.38,.38]) {
      pieces.push(...block([center,y+.067,z+edge],[span,.085,.066],steel));
    }
  }
  const spacing = fine ? .3 : .52;
  for(let at=-length/2+.15;at<length/2;at+=spacing) {
    pieces.push({
      points:[[x+at-.056,y+.012,z-.67],[x+at-.056,y+.012,z+.67],[x+at+.056,y+.012,z+.67],[x+at+.056,y+.012,z-.67]],
      fill:'#a1af9f',
    });
  }
  return pieces;
}

export function train(x: number, y: number, z: number, count = 3, yaw = 0): Face[] {
  const faces: Face[] = [];
  const c = Math.cos(yaw), s = Math.sin(yaw);
  const add = (points: Vec[], fill: string, edge?: string) =>
    faces.push({points:points.map(([u,v,p])=>[x+c*u-s*p,y+v,z+s*u+c*p]),fill,edge});
  for(let car=0; car<count; car++) {
    const front = -car*2.63, back = front-2.5;
    const sections = car===0
      ? [{x:back,w:.47,h:.85},{x:front-.96,w:.47,h:.85},{x:front-.42,w:.39,h:.62},{x:front,w:.19,h:.30}]
      : [{x:back,w:.46,h:.82},{x:front,w:.46,h:.82}];
    for(let i=0;i<sections.length-1;i++) {
      const a = sections[i], b = sections[i+1];
      add([[a.x,a.h,-a.w*.73],[a.x,a.h,a.w*.73],[b.x,b.h,b.w*.73],[b.x,b.h,-b.w*.73]], i===2?'#e9e8dc':'#e9ede7');
      for(const sign of [-1,1]) {
        add([[a.x,a.h,sign*a.w*.73],[a.x,a.h*.73,sign*a.w],
          [b.x,b.h*.73,sign*b.w],[b.x,b.h,sign*b.w*.73]],sign===1?'#c9dad8':'#b1c4c5');
        add([[a.x,.13,sign*a.w],[b.x,.13,sign*b.w],[b.x,b.h*.73,sign*b.w],[a.x,a.h*.73,sign*a.w]],sign===1?'#d4dedb':'#aabfc1');
        add([[a.x,.23,sign*(a.w+.005)],[b.x,.23,sign*(b.w+.005)],[b.x,.29,sign*(b.w+.005)],[a.x,.29,sign*(a.w+.005)]],'#ac4447');
      }
    }
    const end = sections[sections.length-1];
    add([[end.x,.13,-end.w],[end.x,end.h,-end.w*.73],[end.x,end.h,end.w*.73],[end.x,.13,end.w]],'#91a9aa');
    if(car===0) {
      add([[front-.90,.83,-.34],[front-.90,.83,.34],[front-.58,.70,.31],[front-.58,.70,-.31]],'#193740');
      for(const sign of [-1,1]) add([[front,-.002+.21,sign*.089],[front,.21,sign*.164],[front,.26,sign*.164],[front,.26,sign*.089]],'#ffeead');
    }
    for(const sign of [-1,1]) {
      const glassZ=sign*.473;
      for(let win=0;win<(car===0?4:6);win++) {
        const wx=back+.19+win*.34;
        add([[wx,.46,glassZ],[wx+.21,.46,glassZ],[wx+.21,.58,glassZ],[wx,.58,glassZ]],'#203c48');
      }
      const door=back+.08;
      add([[door,.35,glassZ],[door+.07,.35,glassZ],[door+.07,.61,glassZ],[door,.61,glassZ]],'#8a9fa4');
      for(const wx of [back+.35,front-.60]) {
        add([[wx-.19,.035,sign*.389],[wx+.19,.035,sign*.389],[wx+.19,.17,sign*.389],[wx-.19,.17,sign*.389]],'#213138');
      }
    }
  }
  return faces;
}

export function pier(x: number, y: number, z = 0): Face[] {
  return [
    ...block([x,.12,z],[1.14,.24,1.66],concrete),
    ...block([x,y/2,z],[.55,y, .96],concrete),
    ...block([x,y-.045,z],[1.04,.26,1.65],concrete),
  ];
}

export function car(x: number, z: number, color: string, direction = 1) {
  return [...block([x,.15,z],[.43,.19,.96],[color,color,'#263f43']),
    ...block([x,.29,z+.09*direction],[.36,.16,.44],['#92a8aa','#2b4b53','#547478'])];
}
