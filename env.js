// Environment: 24h day/night + dynamic weather (clear, drizzle, rain, downpour, fog, storm) with wet-to-dry streets.
// One module owns sky/fog/ambient/bloom/exposure so districts and future content just read ENV.
import * as THREE from 'three';
const C=(h)=>new THREE.Color(h);
// key colours by hour: [hour, sky, fog, hemiSky, hemiGround, hemiI, sunI, bloom, exposure, lampMul]
const KEYS=[[0,C(0x120a22),C(0x241236),C(0x5a4a9a),C(0x120818),.6,0,.75,1.0,1],
 [4.5,C(0x140c26),C(0x261638),C(0x5a4a9a),C(0x120818),.6,0,.75,1.0,1],
 [6,C(0x4a2a4a),C(0x6a4058),C(0xc08aa0),C(0x2a1a28),1.0,.3,.6,1.0,.8],
 [7.5,C(0x7a8898),C(0x8a909a),C(0xc8d0e0),C(0x3a3a44),1.9,1.1,.32,.95,.35],
 [12,C(0x8a96a6),C(0x98a0aa),C(0xd8e0f0),C(0x50505a),3.0,1.5,.28,.92,.25],
 [16.5,C(0x7a8494),C(0x8a8e98),C(0xd0c8d0),C(0x403a40),1.9,1.1,.32,.95,.35],
 [18.2,C(0x5a2a48),C(0x7a3a50),C(0xff9a7a),C(0x2a1420),1.1,.45,.55,1.0,.75],
 [19.6,C(0x1c0e2c),C(0x2c1640),C(0x6a4aa0),C(0x140a1c),.7,0,.72,1.0,1],[24,C(0x120a22),C(0x241236),C(0x5a4a9a),C(0x120818),.6,0,.75,1.0,1]];
export const WEATHER={clear:{rain:0,fog:.75,dur:[5,9]},drizzle:{rain:.35,fog:.95,dur:[3,7]},rain:{rain:.7,fog:1,dur:[3,7]},downpour:{rain:1,fog:1.25,dur:[2,4]},fog:{rain:.05,fog:2.1,dur:[2,5]},storm:{rain:1,fog:1.15,dur:[1.5,3],lightning:1}};
const NEXT={clear:['drizzle','fog','clear','rain'],drizzle:['rain','clear','fog'],rain:['downpour','drizzle','storm','rain'],downpour:['rain','storm'],fog:['clear','drizzle'],storm:['rain','downpour']};
export function makeEnv(scene,{hemi,moon,bloom,R,mats}){
 const sun=new THREE.DirectionalLight(0xfff0e0,0);sun.position.set(30,60,-20);scene.add(sun);
 const st={w:'rain',rain:.7,fog:1,wet:1,next:6,flash:0,bolt:0,tod:18,dayF:0,lightning:0};
 const tmp=[C(0),C(0),C(0),C(0)];
 const pick=a=>a[Math.floor(Math.random()*a.length)];
 const env={st,sun,
  set(w,instant){st.w=w;st.next=WEATHER[w].dur[0]+Math.random()*(WEATHER[w].dur[1]-WEATHER[w].dur[0]);if(instant){st.rain=WEATHER[w].rain;st.fog=WEATHER[w].fog;}},
  // gameHours: elapsed game hours this frame
  update(dt,tod,gameHours,save){st.tod=tod;
   st.next-=gameHours;if(st.next<=0)env.set(pick(NEXT[st.w]));
   const W=WEATHER[st.w];const k=1-Math.exp(-dt*.08);st.rain+=(W.rain-st.rain)*k;st.fog+=(W.fog-st.fog)*k;
   // wet-to-dry: rain soaks fast, drying is slow and faster under daylight
   if(st.rain>.15)st.wet=Math.min(1,st.wet+dt*.02*st.rain);else st.wet=Math.max(0,st.wet-gameHours*(.12+st.dayF*.25));
   if(save){save.weather=st.w;save.wet=st.wet;}
   // day/night interpolation
   let i=0;while(i<KEYS.length-2&&tod>=KEYS[i+1][0])i++;const a=KEYS[i],b=KEYS[i+1],t=THREE.MathUtils.smoothstep(tod,a[0],b[0]);
   const over=Math.min(1,st.rain*.9+(st.fog-1)*.4);// overcast greys out the day
   scene.background.copy(a[1]).lerp(b[1],t);scene.fog.color.copy(a[2]).lerp(b[2],t);
   const dayF=THREE.MathUtils.lerp(a[6],b[6],t)/1.5;st.dayF=dayF;
   if(dayF>0){const g=C(0x5a5e68).multiplyScalar(.9);scene.background.lerp(g,over*.5*dayF);scene.fog.color.lerp(g,over*.5*dayF);}
   hemi.color.copy(a[3]).lerp(b[3],t);hemi.groundColor.copy(a[4]).lerp(b[4],t);hemi.intensity=THREE.MathUtils.lerp(a[5],b[5],t)*(1-over*.25*dayF);
   sun.intensity=THREE.MathUtils.lerp(a[6],b[6],t)*(1-over*.6);moon.intensity=.35*(1-dayF);
   const ang=(tod-6)/12*Math.PI;sun.position.set(Math.cos(ang)*60,Math.max(8,Math.sin(ang)*70),-25);
   bloom.strength=THREE.MathUtils.lerp(a[7],b[7],t);R.toneMappingExposure=THREE.MathUtils.lerp(a[8],b[8],t);
   env.lampMul=THREE.MathUtils.lerp(a[9],b[9],t);
   scene.fog.density=.03*st.fog*(1-dayF*.35);
   // wet surfaces: glossier + more mirror-like when soaked
   const w=st.wet;mats.ROAD.roughness=.62-.44*w;mats.ROAD.metalness=.15+.4*w;mats.WALK.roughness=.7-.4*w;mats.WALK2.roughness=.7-.48*w;
   mats.PUDDLE.opacity=Math.min(1,w*1.4);mats.PUDDLE.transparent=true;mats.PUDDLE.visible=w>.05;
   // lightning
   if(W.lightning){st.bolt-=dt;if(st.bolt<=0){st.flash=1;st.bolt=4+Math.random()*10;env.onThunder&&env.onThunder();}}
   if(st.flash>0){st.flash-=dt*3;const f=Math.max(0,st.flash)*(Math.random()<.5?1:.4);hemi.intensity+=f*3;scene.background.lerp(C(0xc8c8ff),f*.35);}
  }};
 return env;}
export const fmtWeather=w=>({clear:'Clear',drizzle:'Drizzle',rain:'Rain',downpour:'Downpour',fog:'Fog',storm:'Storm'})[w];
