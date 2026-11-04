// R2 city expansion: class-stratified streamed districts (Crown Heights / Ashline Docks), enterable interiors,
// walkable rooftops + ladders, a sky terrace, Ring Line metro stations and an underground train car.
import * as THREE from 'three';
import {corridor,Batch,signTex,DISTRICTS,MATS} from './world.js';
const STONE=new THREE.MeshStandardMaterial({color:0x6a6872,roughness:.35,metalness:.35});
const STONE2=new THREE.MeshStandardMaterial({color:0x4a4a54,roughness:.25,metalness:.45});
const GRIME=new THREE.MeshStandardMaterial({color:0x1a1612,roughness:.4,metalness:.3});
MATS.STONE=STONE;MATS.STONE2=STONE2;MATS.GRIME=GRIME;
export const NEW_D={
 crown:{name:'Crown Heights · upper city',cls:'rich',cx:0,cz:-260,rot:0,len:120,hw:12,kind:'street',hmin:38,hmax:88,cables:.12,roadMat:STONE2,walkMat:STONE,t1:0x8c8a94,t2:0x7a7884,
  wall:[0x8a8e9a,0x9ea2ae,0x6a7080,0x5a6070,0xb0b0b8,0x7c8090],neon:[0xffffff,0x9fe8ff,0xffe0a0,0x3ff0ff,0xc9b2ff],
  hor:['ORRIN MUTUAL','AURELIA','HALCYON','MAISON VEIL','KESSLER & SONS','PRISM','LUMEN','SKYDECK','OBSIDIAN','GALLERIA 9','VANTA'],vert:['銀行','宝石','美術','天空','黄金','真珠','証券'],
  gaps:[{side:-1,a:-6,b:6},{side:1,a:20,b:28},{side:1,a:-34,b:-26}],caps:[-1,1],parent:null},
 docks:{name:'Ashline Docks · the low city',cls:'poor',cx:0,cz:260,rot:0,len:100,hw:6.5,kind:'alley',hmin:7,hmax:14,cables:2.4,walkMat:GRIME,t1:0x15120e,t2:0x1c1812,
  wall:[0x3a2a22,0x2e2a26,0x342018,0x2a2c2a,0x3a3028,0x40342a],neon:[0xff4d3d,0xff8a3d,0x5dff9b,0xffc070,0xff3fa4],
  hor:['RUSTED HOOK','PARTS & PAWN','FISH','NOODLE 5¢','CHEAP SLEEP','REPAIRS','BOOZE','CLINIC','BATTERIES','PRAYER'],vert:['質屋','魚','修理','酒','宿','薬'],
  forceH:[{side:-1,a:-50,b:12,h:7.5},{side:1,a:-32,b:20,h:7.5}],gaps:[{side:1,a:-46,b:-38},{side:-1,a:22,b:29}],caps:[-1],parent:null},
 metro:{name:'Ring Line',cls:'mid',cx:0,cz:700,rot:0,len:16,hw:1.5,virtual:true,parent:null}};
Object.assign(DISTRICTS,NEW_D);
export function regionOf(x,z){if(z<-200)return'crown';if(z>200&&z<450)return'docks';if(z>600)return'metro';return'mid';}
export function buildCity(scene,cand){
 const out={districts:{},walk:[],inter:[],rooms:[],staff:[],anim:[],steam:[],stations:{},lanes:{crown:[],docks:[]},seats:[]};
 const B=new Batch(new THREE.MeshLambertMaterial()),Gl=new Batch(new THREE.MeshBasicMaterial({toneMapped:false})),Gh=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));Gl.mat.userData.boost=1;Gh.mat.userData.boost=2.6;
 const Mt=new Batch(new THREE.MeshStandardMaterial({roughness:.15,metalness:.8}));
 const L=(x,y,z,col,int=4,dist=8)=>cand.push({x,y,z,col,int,dist,pri:0});
 const W=(x0,x1,z0,z1,y=0)=>out.walk.push([Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1),y]);
 const I=(o)=>out.inter.push(o);
 const sign=(t,col,x,y,z,h,ry=0,o={})=>{const st=signTex(t,col,o);const m=new THREE.Mesh(new THREE.PlaneGeometry(h*st.aspect,h),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,color:new THREE.Color(1.25,1.25,1.25),side:THREE.DoubleSide}));m.position.set(x,y,z);m.rotation.y=ry;scene.add(m);if(o.light!==false)L(x,y-.5,z+(Math.abs(ry)<1?(ry===0?1:-1):0)*1.2,col,o.li||5,o.ld||9);return m;};
 for(const k of['crown','docks']){const d=corridor(scene,NEW_D[k],cand);out.districts[k]=d;out.steam.push(...d.steamPts.slice(0,4),...d.vents.slice(0,3));}
 // ---------- generic room in a facade gap (street along x; facade at z=fz; room goes outward by dir) ----------
 function room(x0,x1,fz,dir,o){const dep=o.dep||8,h=o.h||4,zb=fz+dir*dep,zm=fz+dir*dep/2,w=x1-x0,cx=(x0+x1)/2,H=o.H||h+6;
  B.add(cx,.02,zm,w,.04,dep,o.floor||0x2a2228);B.add(cx,h,zm,w,.12,dep,o.ceil||0x18151c);// floor, ceiling
  B.add(x0+.1,h/2,zm,.2,h,dep,o.wall||0x3a2e34);B.add(x1-.1,h/2,zm,.2,h,dep,o.wall||0x3a2e34);B.add(cx,h/2,zb,w,h,.2,o.wall||0x3a2e34);
  // storefront: wall either side of a 2.4m door, glass, building mass above
  const dw=o.door||2.4;B.add(x0+(w-dw)/4,h/2,fz,(w-dw)/2,h,.25,o.front||0x2a2430);B.add(x1-(w-dw)/4,h/2,fz,(w-dw)/2,h,.25,o.front||0x2a2430);B.add(cx,h-.35,fz,dw,.7,.25,o.front||0x2a2430);
  B.add(cx,h+(H-h)/2,fz+dir*5,w,H-h,10,o.mass||0x2a2433);
  for(let y=h+1.6;y<H-1;y+=1.9)for(let wx=x0+.8;wx<x1-.5;wx+=.95)if(Math.random()<.45)Gl.add(wx,y,fz-dir*.03,.6,.85,.04,new THREE.Color(o.win||0xffc98a).multiplyScalar(.2+Math.random()*.3).getHex());
  for(let x=x0+1.4;x<x1-1;x+=2.2)for(let z=1.5;z<dep-1;z+=2.6){Gl.add(x,h-.08,fz+dir*z,.45,.04,.45,new THREE.Color(o.lamp||0xffd9a0).multiplyScalar(.8).getHex());}
  L(cx,h-.8,fz+dir*dep*.3,o.lamp||0xffd9a0,4.5,9);L(cx,h-.8,fz+dir*dep*.75,o.lamp2||o.lamp||0xffc890,4,8);
  W(x0+.35,x1-.35,fz-dir*.2,zb-dir*.35);W(cx-dw/2+.2,cx+dw/2-.2,fz-dir*1.2,fz+dir*.6);
  out.rooms.push([x0,x1,Math.min(fz,zb),Math.max(fz,zb),h]);if(o.sign)sign(o.sign,o.sc||0xffffff,cx,h+.8,fz-dir*.16,.7,dir<0?0:Math.PI,{fs:64,li:6});
  return {cx,zm,zb,fz,dir,h};}
 // ======================= CROWN HEIGHTS (rich) =======================
 {const cz=-260,N=cz-12,S=cz+12;W(-59,59,N+.3,S-.3);
  // Orrin Tower lobby (north gap) + elevator to the sky terrace
  const lob=room(-6,6,N,-1,{dep:9,h:6,H:46,floor:0x8a8690,ceil:0x2a2830,wall:0x6a6870,front:0x9a9ea8,mass:0x7c8090,lamp:0xfff1d8,win:0xe8f4ff,sign:'ORRIN MUTUAL',sc:0xb04dff});
  Mt.add(0,.03,lob.zm,11,.02,8.6,0xc8c4c8);B.add(0,.55,N-5.5,4.2,1.1,1,0x2a2832);Gh.add(0,1.12,N-5.5,4,.04,.9,0xc9b2ff);B.add(0,3.4,N-8.85,6,4,.1,0x1a1824);Gl.add(0,3.4,N-8.8,5.6,3.6,.02,0x2a1048);
  sign('YOUR FUTURE, FINANCED',0xc9b2ff,0,3.4,N-8.75,.45,0,{light:false,fs:48});
  for(const x of[-4.2,4.2]){Mt.add(x,1.4,N-8.7,1.6,2.8,.1,0x8a8a92);Gh.add(x,2.95,N-8.6,.5,.06,.04,0x9fe8ff);}
  out.staff.push({k:'Receptionist',x:0,z:N-6.3,ry:0,look:{sex:'f',skin:0xf0d0b8,top:0xe8e4e0,pants:0x2a2a3a,hair:{style:'bun',color:0x2a1a10},glow:{where:'collar',color:0xc9b2ff}},lines:["Welcome to Orrin Mutual. Appointments only above floor three. The sky terrace is open to the public until curfew. Mostly to remind you what you can't afford.","Mr. Orrin doesn't take walk-ins. He doesn't take anything, actually. He gives. Loans."]});
  I({id:'elev',x:-4.2,y:1.4,z:N-8.2,r:2.2,label:'Elevator · Sky terrace',act:{type:'tp',x:-3,y:46,z:N-2,yaw:Math.PI,msg:'Forty-six floors in eleven seconds. Your ears pop.'}});
  I({id:'elev2',x:4.2,y:1.4,z:N-8.2,r:2.2,label:'Elevator · Sky terrace',act:{type:'tp',x:3,y:46,z:N-2,yaw:Math.PI,msg:'Forty-six floors in eleven seconds. Your ears pop.'}});
  // sky terrace on top of the tower block (y=46)
  {const y=46,z0=N-.2,z1=N-10;B.add(0,y-.05,(z0+z1)/2,12.4,.1,10.2,0x3a3a44);W(-5.6,5.6,z1+.4,z0-.4,y);
   for(const [x0,z,ww,dd] of[[0,z0,12,.1],[0,z1,12,.1],[-6,(z0+z1)/2,.1,10],[6,(z0+z1)/2,.1,10]]){Mt.add(x0,y+.55,z,ww,1.1,dd,0x9fb0c0);Gh.add(x0,y+1.12,z,ww+.05,.04,dd+.05,0x9fe8ff);}
   for(const [x,z] of[[-4,z1+1.5],[4,z1+1.5],[-4,z0-2],[4,z0-2]]){B.add(x,y+.4,z,1.2,.8,1.2,0x2a2a2a);B.add(x,y+1.4,z,1.1,1.2,1.1,0x1f4a38);L(x,y+1.5,z,0x5dff9b,2,5);}
   B.add(0,y+.25,z1+2,3,.1,.7,0x6a5a48);out.seats.push({x:0,z:z1+2.3,y,yaw:0});I({id:'skybench',x:0,y:y+.8,z:z1+2.4,r:1.8,label:'Sit · look out',act:{type:'sit',x:0,y,z:z1+2.6,yaw:Math.PI}});
   Mt.add(2.5,y+1.1,z0-.6,.15,1,.15,0x8a8a92);Mt.add(2.5,y+1.6,z0-.7,.2,.2,.5,0x8a8a92);
   I({id:'scope',x:2.5,y:y+1.4,z:z0-1,r:2,label:'Coin telescope',act:{type:'read',t:'Telescope',x:['Through the brass eyepiece: the whole of Veyra under the rain. South, past the Saltgate glow, the Ashline cranes blink red over black water.','Far to the east a dark tower without a single lit window. The plaque says ORRIN MUTUAL · ARCHIVE. Nobody works there, the plaque says. The roof has a helipad. Fresh rotor marks.']}});
   L(0,y+3,(z0+z1)/2,0xfff1d8,4,12);I({id:'elevdown',x:-3,y:y+1.3,z:z0-1.2,r:2.2,label:'Elevator · Street',act:{type:'tp',x:-2,y:0,z:N-3,yaw:0,msg:'Down to the street.'}});}
  // Maison Veil boutique (south gap x20..28)
  const bt=room(20,28,S,1,{dep:8,h:4.2,H:44,floor:0x2a2228,ceil:0x3a3632,wall:0x8a8278,front:0xa8acb4,mass:0x8a8e9a,lamp:0xfff1d8,sign:'MAISON VEIL',sc:0xffe0a0});
  for(let x=21;x<27.5;x+=1.4){Mt.add(x,1.9,S+6.2,.06,.06,1.6,0xd0d0d8);for(let k=0;k<4;k++)B.add(x+(k-1.5)*.08,1.3,S+5.6+k*.35,.5,1.1,.05,[0xff3fa4,0x2a2a3a,0xd8d4cc,0x3ff0ff,0x8a5a3a,0xb04dff][(Math.round(x)+k)%6]);}
  Mt.add(21,1.2,S+2,.05,2.2,1,0xe8f0ff);Gh.add(21.05,1.2,S+2,.02,2,.9,0x2a3038);
  out.staff.push({k:'Veil clerk',x:25.5,z:S+3,ry:-Math.PI/2,look:{sex:'m',skin:0xc89070,top:0x1a1a1a,pants:0x1a1a1a,hair:{style:'short',color:0x101010},coat:{color:0x1a1a22,len:.72,shiny:1}},shop:'clothes'});
  // Lumen café (south gap x-34..-26)
  const cf=room(-34,-26,S,1,{dep:8,h:3.8,H:42,floor:0x5a4a3a,ceil:0x2a2220,wall:0x6a5a4a,front:0x9a9ea8,mass:0x6a7080,lamp:0xffc890,sign:'LUMEN CAFÉ',sc:0xffe0a0});
  B.add(-30,.55,S+6,6,1.1,.8,0x3a2a20);Gh.add(-30,1.12,S+5.6,6,.04,.05,0xffb06b);
  for(const x of[-32.5,-30,-27.5]){B.add(x,.38,S+3,.9,.06,.9,0xd8d0c0);B.add(x,.2,S+3,.08,.4,.08,0x333);out.seats.push({x,z:S+2.2});I({id:'cfs'+x,x,y:.8,z:S+2.2,r:1.4,label:'Sit',act:{type:'sit',x,y:0,z:S+2.2,yaw:Math.PI}});}
  out.staff.push({k:'Barista',x:-30,z:S+6.8,ry:Math.PI,look:{sex:'f',skin:0x8a5a40,top:0x3a2a2a,pants:0x1a1a22,hair:{style:'long',color:0x101010},gear:[{t:'glasses',c:0x3ff0ff}]},shop:'cafe'});
  // street dressing: planters/trees, holo fountain, benches, parked cars, checkpoint
  for(let x=-50;x<=50;x+=12)for(const s of[-1,1]){const z=cz+s*(12-3.4);B.add(x,.4,z,1.6,.8,1.6,0x9a96a0);B.add(x,1.6,z,.18,2.4,.18,0x3a2a20);B.add(x,3.1,z,1.8,1.4,1.8,0x1f4a38);B.add(x,3.9,z,1.1,.8,1.1,0x2a5a40);Gh.add(x,2.35,z,1.2,.04,1.2,0x3ff0c0);}
  for(const [x,s] of[[-18,-1],[14,1],[38,-1],[-44,1]]){const z=cz+s*(12-3.4);B.add(x,.42,z,2.6,.08,.6,0x6a5a48);B.add(x,.2,z,.1,.4,.5,0x555);I({id:'cb'+x,x,y:.8,z,r:1.6,label:'Sit on the bench',act:{type:'sit',x,y:0,z:z-s*.1,yaw:s<0?Math.PI:0}});}
  B.add(0,.35,cz,6,.7,6,0xb8b4bc);Mt.add(0,.66,cz,5.4,.04,5.4,0x203040);const holo=new THREE.Mesh(new THREE.ConeGeometry(1.6,5,6,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(0x3ff0ff).multiplyScalar(1.2),transparent:true,opacity:.22,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false,side:THREE.DoubleSide}));holo.position.set(0,3.2,cz);holo.rotation.x=Math.PI;scene.add(holo);out.anim.push(t=>{holo.rotation.y=t*.4;holo.material.opacity=.16+Math.sin(t*2)*.05;});L(0,2,cz,0x3ff0ff,6,12);
  I({id:'fount',x:0,y:1,z:cz+3.4,r:2.2,label:'Holo fountain',act:{type:'read',t:'Crown Plaza',x:'A fountain of light where water used to be. The plaque thanks Orrin Mutual "for keeping the upper city dry." Above the boulevard, the rain falls on a canopy you can\'t see. It mostly works.'}});
  for(const [x,s] of[[-26,-1],[8,-1],[30,1],[-8,1]]){const z=cz+s*4.2;Mt.add(x,.55,z,4.4,.7,1.9,[0xe8e8f0,0x1a1a22,0x8a1a2a,0x2a2a3a][Math.abs(x)%4]);B.add(x+.2,1.05,z,2.4,.5,1.7,0x101018);Gh.add(x+2.21,.6,z,.04,.12,1.5,0xfff1d8);Gh.add(x-2.21,.6,z,.04,.1,1.5,0xff2040);}
  // Wardline checkpoint near the station
  {const x=-44;Mt.add(x,2.6,cz-7,.3,5.2,.3,0x9fb0c0);Mt.add(x,2.6,cz+7,.3,5.2,.3,0x9fb0c0);Gh.add(x,5.2,cz,.2,.15,14,0x3f8aff);L(x,4,cz,0x3f8aff,5,12);sign('WARDLINE · SCAN ZONE',0x3f8aff,x,5.8,cz,.5,Math.PI/2,{fs:48,light:false});
   I({id:'scan',x:x+1.5,y:1.4,z:cz,r:3,label:'Scanner arch',act:{type:'read',t:'Wardline scan',x:'The arch hums as you pass. A soft chime: VISITOR · LOW CITY ORIGIN · MONITORED. Somewhere, a file on you just got one line longer.'}});}
  // patrol drones
  for(let i=0;i<4;i++){const g=new THREE.Group();const b=new THREE.Mesh(new THREE.BoxGeometry(.6,.18,.6),new THREE.MeshLambertMaterial({color:0x2a2a34}));g.add(b);const l=new THREE.Mesh(new THREE.BoxGeometry(.2,.06,.2),new THREE.MeshBasicMaterial({color:new THREE.Color(0x3f8aff).multiplyScalar(3),toneMapped:false}));l.position.y=-.12;g.add(l);
   const cone=new THREE.Mesh(new THREE.ConeGeometry(1.4,6,12,1,true),new THREE.MeshBasicMaterial({color:new THREE.Color(0x9fc8ff).multiplyScalar(.6),transparent:true,opacity:.07,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));cone.position.y=-3.1;g.add(cone);scene.add(g);
   const ph=i*1.7;out.anim.push((t,red)=>{g.position.set(Math.sin(t*.13+ph)*50,7+Math.sin(t*.7+ph),cz+Math.cos(t*.21+ph)*6);g.rotation.y=t*.5;l.material.color.setHex(red&&Math.sin(t*10)>0?0xff2040:0x3f8aff).multiplyScalar(3);});}
  out.lanes.crown=[[-55,cz-9.6,55,cz-9.6],[-55,cz+9.6,55,cz+9.6],[-50,cz-8,50,cz-8],[-45,cz+8.2,45,cz+8.2],[-30,cz-6,30,cz-6],[-40,cz+5.5,-10,cz+5.5],[10,cz+5.5,45,cz+5.5]];
  // Ring Line station (west end)
  station('crown','CROWN EXCHANGE',-53,cz,Math.PI/2,0xffffff,true);}
 // ======================= ASHLINE DOCKS (poor) =======================
 {const cz=260,N=cz-6.5,S=cz+6.5;W(-49,49,N+.3,S-.3);
  // rooftops (y 7.5) + plank bridge + fire ladders
  const y=7.5;W(-49.5,9,N-9.7,N-.15,y);W(-29.5,17.5,S+.15,S+9.7,y);W(-12.8,-11.2,N-.5,S+.5,y);
  B.add(-12,y-.05,cz,1.6,.1,13.2,0x5a4030);for(let z=N;z<S;z+=.5)B.add(-12,y+.02,z,1.6,.04,.4,0x6a4a34);for(const s of[-1,1]){B.add(-12+s*.8,y+.5,cz,.05,.05,13,0x8a6a4a);for(let z=N;z<S;z+=1.5)B.add(-12+s*.8,y+.25,z,.06,.5,.06,0x5a4030);}
  for(let z=N+1;z<S;z+=2.2){Gh.add(-12,y+1.6,z,.25,.3,.25,0xff8a3d);}L(-12,y+1.5,cz,0xff8a3d,3,8);
  for(const s of[-1,1])for(let x=-48;x<(s<0?9:17);x+=1.2){if(s>0&&x<-29)continue;B.add(x,y+.45,s<0?N-.1:S+.1,1.1,.9,.1,0x2a2420);}
  const shacks=[[-40,N-5],[-26,N-6],[-2,N-4],[-20,S+5],[6,S+6]];for(const [x,z] of shacks){B.add(x,y+1.2,z,3,2.4,2.6,0x3a3028);B.add(x,y+2.5,z,3.4,.1,3,0x5a4a3a);Gl.add(x+1.51,y+1.3,z,.02,.8,.9,0x6a3a18);L(x+2,y+1.4,z,0xffa050,2.5,6);}
  for(const [x,z] of[[-34,N-7],[0,S+7],[-6,N-7.5]]){B.add(x,y+1.8,z,1.6,3.6,1.6,0x2a2420);Mt.add(x,y+3.8,z,1.8,.4,1.8,0x5a5048);}
  for(const [x,s] of[[-16,-1],[1,-1],[-24,1],[14,1]]){const z=s<0?N:S;for(let k=.4;k<y;k+=.4)B.add(x,k,z-s*.25,.7,.04,.04,0x6a6058);for(const dx of[-.35,.35])B.add(x+dx,y/2+.5,z-s*.25,.05,y+1,.05,0x6a6058);
   I({id:'lad'+x,x,y:1.3,z:z-s*1,r:1.9,label:'Climb the fire ladder',act:{type:'tp',x,y,z:z+s*1.2,yaw:s<0?0:Math.PI,msg:'Rust flakes under your palms. Then the roofs open up: tarps, antennas, laundry, the cranes beyond.'}});
   I({id:'ladd'+x,x,y:y+1.3,z:z+s*.8,r:1.8,label:'Climb down',act:{type:'tp',x,y:0,z:z-s*1.3,yaw:s<0?Math.PI:0}});}
  I({id:'roofview',x:-12,y:y+1.3,z:cz,r:2,label:'Look out',act:{type:'read',t:'Plank bridge',x:'The street below is a river of umbrellas and steam. Northward the Saltgate glow; far beyond, the white towers of Crown Heights stand dry under their invisible canopy.'}});
  out.seats.push();I({id:'roofsit',x:-26,y:y+1,z:N-3.2,r:1.6,label:'Sit by the shack',act:{type:'sit',x:-26,y,z:N-3.2,yaw:Math.PI}});
  // burn barrels, crates, nets
  for(const [x,z] of[[-30,cz+2],[8,cz-3],[30,cz+3],[-8,cz+4]]){Mt.add(x,.45,z,.7,.9,.7,0x3a2a20);Gh.add(x,.95,z,.55,.12,.55,0xff6a20);L(x,1.6,z,0xff7a30,4,8);out.steam.push(new THREE.Vector3(x,1.2,z));}
  for(let i=0;i<22;i++){const x=-46+Math.random()*92,z=cz+(Math.random()<.5?-1:1)*(4+Math.random()*1.8);B.add(x,.35,z,.7,.7,.7,[0x5a4030,0x3a3a30,0x4a3020][i%3]);if(i%3==0)B.add(x,.95,z,.6,.5,.6,0x4a3828);}
  // rusted hook bar (south gap -46..-38)
  const hk=room(-46,-38,S,1,{dep:8,h:3.6,H:12,floor:0x2a1e18,ceil:0x140e0c,wall:0x3a2420,front:0x2a1e18,mass:0x3a2a22,lamp:0xff8a3d,lamp2:0xff3fa4,win:0xffb06b,sign:'THE RUSTED HOOK',sc:0xff4d3d});
  B.add(-42,.55,S+6.2,6.5,1.1,.8,0x4a2a1a);Gh.add(-42,1.12,S+5.8,6.4,.04,.05,0xff3fa4);for(let k=0;k<12;k++)Gh.add(-45+k*.55,1.9,S+7.6,.12,.35,.12,[0x5dff9b,0xffc070,0xff4d3d][k%3]);
  for(const x of[-44.5,-43,-41.5,-40]){B.add(x,.7,S+5.1,.4,.06,.4,0x8a3a2a);B.add(x,.35,S+5.1,.06,.7,.06,0x333);I({id:'hk'+x,x,y:.9,z:S+4.8,r:1.2,label:'Sit at the bar',act:{type:'sit',x,y:.3,z:S+4.9,yaw:Math.PI}});}
  out.staff.push({k:'Old Hesk',x:-42,z:S+7,ry:Math.PI,look:{sex:'m',skin:0x8a5a40,top:0x3a2a22,pants:0x1a1a1a,hair:{style:'beard',color:0xc0b0a0},bulk:1.12},shop:'bar',lines:["Hesk. I own the Hook. The Hook owns me. What'll it be?"]});
  // parts & pawn (north gap 22..29)
  room(22,29,N,-1,{dep:7,h:3.4,H:9,floor:0x22201a,wall:0x3a3a30,front:0x2a2a24,mass:0x3a3028,lamp:0x9fe8ff,lamp2:0x5dff9b,sign:'PARTS & PAWN',sc:0x5dff9b});
  for(let x=23;x<28.5;x+=1.1)for(let yy=.5;yy<3;yy+=.7){B.add(x,yy,N-6.4,.9,.06,.7,0x4a4a40);if(Math.random()<.7)Gh.add(x+(Math.random()-.5)*.5,yy+.15,N-6.3,.12,.18,.12,[0x5dff9b,0x3ff0ff,0xff4d3d,0xffe14d][Math.floor(Math.random()*4)]);}
  out.staff.push({k:'Ninefingers',x:25.5,z:N-4.5,ry:0,look:{sex:'f',skin:0x5a3828,top:0x2a3a2a,pants:0x22202a,hair:{style:'buzz',color:0xff3fa4},hat:'beanie',hatColor:0x2a2a2a,gear:[{t:'glasses',c:0x5dff9b}]},shop:'pawn',lines:["Name's Ninefingers. Don't ask. I buy, I sell, I don't remember faces."]});
  // waterfront (east end): pier, containers, cranes, moored boat
  W(48,72,cz-3,cz+3);B.add(60,-.1,cz,24,.2,6,0x3a2e24);for(let x=49;x<72;x+=.6)B.add(x,.02,cz,.5,.04,5.8,0x4a3a2a);
  const wat=new THREE.Mesh(new THREE.PlaneGeometry(220,160),MATS.WATER);wat.rotation.x=-Math.PI/2;wat.position.set(120,-.9,cz);scene.add(wat);
  for(let i=0;i<14;i++){const x=52+(i%4)*5,z=cz+(i<8?-8:8)+(Math.floor(i/4)%2)*2.6,yy=1.3+Math.floor(i/8)*2.6;B.add(x,yy,z,4.8,2.5,2.4,[0x8a2a20,0x2a5a7a,0x6a6a2a,0x3a6a3a,0x7a4a2a][i%5]);}
  for(const [x,z] of[[64,cz-14],[84,cz+12]]){B.add(x,14,z,1.2,28,1.2,0x5a4020);B.add(x+6,27.5,z,16,1,1,0x5a4020);Gh.add(x+13.5,27,z,.4,.4,.4,0xff2020);L(x+13,27,z,0xff2020,2,10);}
  B.add(76,.2,cz+4,8,1.2,3,0x2a2622);B.add(75,1.3,cz+4,3,1.2,2.2,0x3a3028);Gl.add(75,1.4,cz+2.88,1.8,.5,.02,0xffb06b);L(75,1.8,cz+2.4,0xffb06b,3,7);
  for(let x=50;x<72;x+=5)for(const s of[-1,1]){B.add(x,.8,cz+s*2.9,.12,1.6,.12,0x4a3a2a);Gh.add(x,1.7,cz+s*2.9,.2,.25,.2,0xffc070);}L(62,2,cz,0xffc070,4,10);
  I({id:'pierend',x:71,y:1.3,z:cz,r:2.4,label:'End of the pier',act:{type:'read',t:'Ashline pier',x:['The black water slaps the pilings. Out on the harbor, a barge with no running lights slides toward the Orrin Archive tower.','A fisherman two pilings down doesn\'t look up. "Third one this week," he says. "They load people at night and nobody comes back with the boat."']}});
  I({id:'piersit',x:66,y:.8,z:cz+2.4,r:1.6,label:'Sit, legs over the water',act:{type:'sit',x:66,y:0,z:cz+2.5,yaw:Math.PI}});
  out.lanes.docks=[[-46,cz-4.8,46,cz-4.8],[-46,cz+4.8,46,cz+4.8],[-40,cz,40,cz],[-46,cz-2,10,cz-2],[10,cz+2,46,cz+2],[49,cz-1.5,70,cz-1.5]];
  station('docks','ASHLINE',-47,cz,Math.PI/2,0xff8a3d,false);}
 // ======================= middle: Ring Line entrance on the Line 9 plaza =======================
 station('mid','LINE 9 PLAZA',-35,47,Math.PI/2,0x3ff0ff,false,true);
 // ---------- station kiosk: glowing stair head ----------
 function station(key,name,x,z,ry,col,rich,small){const g=new THREE.Group();g.position.set(x,0,z);g.rotation.y=ry;scene.add(g);
  const mk=(sx,sy,sz,px,py,pz,c,basic)=>{const m=new THREE.Mesh(new THREE.BoxGeometry(sx,sy,sz),basic?new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2),toneMapped:false}):new THREE.MeshLambertMaterial({color:c}));m.position.set(px,py,pz);g.add(m);};
  mk(3.4,.1,4.2,0,3,0,rich?0xd8d4d0:0x2a2632);mk(.12,3,.12,-1.6,1.5,-2,0x3a3644);mk(.12,3,.12,1.6,1.5,-2,0x3a3644);mk(.12,3,.12,-1.6,1.5,2,0x3a3644);mk(.12,3,.12,1.6,1.5,2,0x3a3644);
  for(let k=0;k<6;k++)mk(2.8,.08,.5,0,.02-k*.0,-1.6+k*.55,0x1a1820);mk(2.8,.04,.04,0,.08,-1.9,col,1);mk(3.3,.04,.04,0,2.9,2.05,col,1);mk(1.6,.9,.04,0,.6,-2.1,0x101018);
  const st=signTex('RING LINE · '+name,col,{fs:56});const sm=new THREE.Mesh(new THREE.PlaneGeometry(.55*st.aspect,.55),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,side:THREE.DoubleSide}));sm.position.set(0,3.4,2.1);g.add(sm);
  const sm2=sm.clone();sm2.position.z=-2.1;g.add(sm2);g.updateMatrixWorld();const wp=new THREE.Vector3(0,1.5,0).applyMatrix4(g.matrixWorld);L(wp.x,2.6,wp.z,col,5,10);
  out.stations[key]={name,x,z,spawn:[x+Math.sin(ry)*2.6,z+Math.cos(ry)*2.6]};
  I({id:'metro_'+key,x,y:1.2,z,r:2.8,label:'Ring Line · ride the metro',act:{type:'metro',from:key}});}
 // ======================= Ring Line train car (underground; virtual district) =======================
 {const cz=700;B.add(0,0,cz,16,.1,3.2,0x2a2a34);B.add(0,2.4,cz,16,.1,3.2,0x22222a);for(const s of[-1,1]){B.add(0,.4,cz+s*1.5,16,.8,.2,0x3a3a48);B.add(0,2.1,cz+s*1.5,16,.6,.2,0x3a3a48);B.add(0,.5,cz+s*1.2,15,.12,.5,0x6a2a3a);}
  B.add(8,1.2,cz,.2,2.4,3.2,0x3a3a48);B.add(-8,1.2,cz,.2,2.4,3.2,0x3a3a48);for(let x=-7;x<=7;x+=1.4)Gl.add(x,2.33,cz,.9,.03,.22,0xb8b0a0);for(let x=-6;x<=6;x+=3)Mt.add(x,1.2,cz,.05,2.4,.05,0xc8c8d0);
  const cv=document.createElement('canvas');cv.width=512;cv.height=64;const c2=cv.getContext('2d');c2.fillStyle='#05040a';c2.fillRect(0,0,512,64);for(let i=0;i<9;i++){const x=Math.random()*512;c2.fillStyle=['#ffd9a0','#3ff0ff','#ff3fa4','#ffffff'][i%4];c2.globalAlpha=.6;c2.fillRect(x,20+Math.random()*24,30+Math.random()*80,2+Math.random()*3);}
  const tex=new THREE.CanvasTexture(cv);tex.wrapS=THREE.RepeatWrapping;tex.colorSpace=THREE.SRGBColorSpace;const wm=new THREE.MeshBasicMaterial({map:tex,toneMapped:false,color:new THREE.Color(1.4,1.4,1.4)});
  for(const s of[-1,1]){const w=new THREE.Mesh(new THREE.PlaneGeometry(15,.9),wm);w.position.set(0,1.35,cz+s*1.39);w.rotation.y=s>0?Math.PI:0;scene.add(w);}
  out.anim.push(t=>{tex.offset.x=-t*1.8;});const mapS=signTex('CROWN EXCHANGE ─ LINE 9 PLAZA ─ ASHLINE',0x3ff0ff,{fs:40});const mp=new THREE.Mesh(new THREE.PlaneGeometry(.3*mapS.aspect,.3),new THREE.MeshBasicMaterial({map:mapS.t,toneMapped:false}));mp.position.set(-7.88,1.9,cz);mp.rotation.y=Math.PI/2;scene.add(mp);
  L(-4,2,cz,0xfff1d8,2.2,7);L(4,2,cz,0xfff1d8,2.2,7);W(-7.6,7.6,cz-.95,cz+.95);out.rooms.push([-8,8,cz-1.6,cz+1.6,2.4]);out.car={cz};
  for(const [x,s,sex] of[[-5,-1,'f'],[-1.5,1,'m'],[3,-1,'m'],[5.5,1,'f']])out.staff.push({k:'Passenger',x,z:cz+s*1.05,ry:s<0?0:Math.PI,sit:1,rand:1,sex,lines:['They don\'t look up from their glowing palm.','"Next stop\'s mine. Don\'t take my seat when I stand. It\'s still mine."','A quiet nod. Their reflection in the window looks more tired than they do.']});
  for(const x of[-3.2,.5,4.2])I({id:'carseat'+x,x,y:.9,z:cz-.95,r:1.3,label:'Sit',act:{type:'sit',x,y:.1,z:cz-1.05,yaw:0}});}
 B.build(scene);Gl.build(scene);Gh.build(scene);Mt.build(scene);
 out.inRoom=(x,z,y)=>out.rooms.some(r=>x>r[0]&&x<r[1]&&z>r[2]&&z<r[3]&&y<r[4]);
 return out;}
