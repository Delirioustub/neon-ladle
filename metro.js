// R13: Ring Line ride. A real train car runs on an elevated guideway along the Ring Causeway (x=-66, floor y=13), so the
// windows show the actual city sliding past between stations. Skippable at any time (old fade = fast travel).
import * as THREE from 'three';
export const GX=-66,GY=13;
export function buildRide(scene,CITY,makeHuman,walkable){
 const car=new THREE.Group();car.visible=false;scene.add(car);
 const L=16,Wd=3.2,H=2.5,box=(x,y,z,w,h,d,m)=>{const o=new THREE.Mesh(new THREE.BoxGeometry(w,h,d),m);o.position.set(x,y,z);car.add(o);return o;};
 const lm=(c,e=0)=>new THREE.MeshLambertMaterial({color:c,emissive:new THREE.Color(c).multiplyScalar(e)});const bm=(c,k=1)=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(k),toneMapped:false});
 const shell=lm(0x2a2a34,.35),floorM=lm(0x3a3440,.3),seat=lm(0x6a2a3a,.45),pole=lm(0xc8c8d0,.4),outer=lm(0x14141c,.05);
 // floor, roof, ends
 box(0,-.05,0,Wd,.1,L,floorM);box(0,H,0,Wd,.12,L,shell);box(0,H/2,L/2,Wd,H,.12,shell);box(0,H/2,-L/2,Wd,H,.12,shell);
 // sides: low wall + header, window pillars every 2 m (big openings y .85..2.05)
 for(const s of[-1,1]){box(s*Wd/2,.42,0,.12,.85,L,shell);box(s*Wd/2,2.27,0,.12,.46,L,shell);for(let z=-L/2;z<=L/2+.01;z+=2)box(s*Wd/2,1.45,z,.14,1.2,.16,shell);
  box(s*(Wd/2-.32),.64,0,.34,.12,L-1,seat);box(s*(Wd/2-.24),.32,0,.2,.5,L-1,lm(0x2a1820,.2));box(s*(Wd/2-.12),.98,0,.1,.56,L-1,seat);// bench + backrest
  box(s*(Wd/2+.08),.55,0,.04,.08,L,bm(0x3ff0ff,1.6));// outside neon stripe
  const gl=new THREE.Mesh(new THREE.PlaneGeometry(L,1.2),new THREE.MeshBasicMaterial({color:0x5f8fb8,transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,side:THREE.DoubleSide,toneMapped:false}));gl.position.set(s*Wd/2,1.45,0);gl.rotation.y=Math.PI/2;car.add(gl);}
 for(let z=-6;z<=6;z+=3)box(0,H/2,z,.05,H,.05,pole);for(let z=-7;z<=7;z+=1.4)box(0,H-.05,z,.9,.03,.22,bm(0xfff1d8,1.3));
 box(0,-.35,0,Wd+.2,.5,L+.4,outer);// undercarriage
 // line map over the end door
 const cv=document.createElement('canvas');cv.width=512;cv.height=64;const g=cv.getContext('2d');g.fillStyle='#05040a';g.fillRect(0,0,512,64);g.fillStyle='#3ff0ff';g.font='bold 26px sans-serif';g.textAlign='center';g.fillText('CROWN EXCHANGE ─ LINE 9 PLAZA ─ ASHLINE',256,42);
 const mt=new THREE.CanvasTexture(cv);mt.colorSpace=THREE.SRGBColorSpace;const mp=new THREE.Mesh(new THREE.PlaneGeometry(2.4,.3),new THREE.MeshBasicMaterial({map:mt,toneMapped:false}));mp.position.set(0,2.1,-L/2+.08);car.add(mp);
 // guideway: beam + glowing rails along the causeway, pylons only where they don't stand on a walkway
 const zs=Object.values(CITY.stations).map(s=>s.z),z0=Math.min(...zs)-30,z1=Math.max(...zs)+30;const gw=new THREE.Group();scene.add(gw);
 const beam=new THREE.Mesh(new THREE.BoxGeometry(1.4,.7,z1-z0),lm(0x22222a,.1));beam.position.set(GX,GY-.95,(z0+z1)/2);gw.add(beam);
 for(const s of[-1,1]){const r=new THREE.Mesh(new THREE.BoxGeometry(.06,.06,z1-z0),bm(0xff3fa4,1.4));r.position.set(GX+s*.72,GY-.62,(z0+z1)/2);gw.add(r);}
 const pm=lm(0x1c1c24,.05);for(let z=z0;z<=z1;z+=40){for(const px of[-92,-40.5]){if(walkable(px,z))continue;const p=new THREE.Mesh(new THREE.BoxGeometry(1,GY-1,1),pm);p.position.set(px,(GY-1)/2-1,z);gw.add(p);const arm=new THREE.Mesh(new THREE.BoxGeometry(Math.abs(px-GX),.5,.6),pm);arm.position.set((px+GX)/2,GY-1.1,z);gw.add(arm);break;}}
 // a few seated passengers (crowd LOD bodies)
 const pax=[];const looks=[{cls:'mid',top:0x3a3a48},{cls:'rich',top:0xd8d4cc,sex:'f'},{cls:'poor',top:0x3a3028},{robot:'Enemy_EyeDrone',glow:{color:0xffe14d}}];
 const spots=[[-1,-5],[1,-1.5],[-1,3],[1,5.5]];
 const ensurePax=()=>{if(pax.length)return;looks.forEach((l,i)=>{const h=makeHuman(l);const [s,z]=spots[i];// R13c: the sit clip carries its hips ~.8 m up; place sitters so hips land on the raised seat (.76) and feet on the floor
  h.obj.position.set(l.robot?s*(Wd/2-.5):s*(Wd/2-.42),l.robot?.75:-.05,z);h.obj.rotation.y=s>0?-Math.PI/2:Math.PI/2;h.play(l.robot?'idle':'sit');car.add(h.obj);pax.push(h);});};
 const R={car,active:null};
 R.start=(from,to)=>{ensurePax();const a=CITY.stations[from]?.z??z0+30,b=CITY.stations[to].z;const D=Math.abs(b-a),dir=Math.sign(b-a)||1,v=22,acc=3.2;const ta=v/acc,da=.5*acc*ta*ta;
  const T=D>2*da?2*ta+(D-2*da)/v:2*Math.sqrt(D/acc);R.active={a,dir,D,v,acc,ta,da,T,t:0,to};car.visible=true;car.rotation.y=dir>0?0:Math.PI;place(0);return R.active;};
 const sAt=(r,t)=>{const {acc,ta,da,v,D,T}=r;if(D<=2*da){const th=T/2;return t<th?.5*acc*t*t:D-.5*acc*(T-t)**2;}if(t<ta)return .5*acc*t*t;if(t>T-ta)return D-.5*acc*(T-t)**2;return da+(t-ta)*v;};
 const place=dt=>{const r=R.active;const s=sAt(r,Math.min(r.t,r.T));car.position.set(GX,GY,r.a+r.dir*s);car.rotation.z=Math.sin(r.t*1.7)*.004;};
 R.tick=dt=>{const r=R.active;if(!r)return false;r.t+=dt;place(dt);for(const h of pax)h.lod(4,dt);return r.t>=r.T+.8;};
 R.local=(lx,lz)=>{car.updateMatrixWorld();return new THREE.Vector3(lx,0,lz).applyMatrix4(car.matrixWorld);};
 R.stop=()=>{R.active=null;car.visible=false;};
 R.progress=()=>R.active?Math.min(1,R.active.t/R.active.T):0;
 return R;}
