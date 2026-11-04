// R11 layered city. Three tiers, read from anywhere you can see an edge:
//  - Crown Heights rides on a megastructure deck (y 0) above an under-city at y -38 (lit blocks, street grid, haze).
//  - The central districts sit at street level on a sea wall; past their edges is the flooded outer city standing in the sea (y -0.95).
//  - Ashline Docks is down at the water: the same sea, the same lights.
// Everything here is distant scenery: instanced (one draw call per batch), no collision, no lights in the pool.
import * as THREE from 'three';
import {Batch,MATS} from './world.js';
let s=4242;const r=()=>{s=(s*16807)%2147483647;return s/2147483647;},sr=(a,b)=>a+r()*(b-a),pk=a=>a[Math.floor(r()*a.length)];
const WIN=[0xffc98a,0xffb06b,0x9fe8ff,0xff9fd6,0xc9b2ff,0xfff1c9],NE=[0xff3fa4,0x3ff0ff,0xb04dff,0xff8a3d,0x5dff9b,0xffe14d];
export function buildLayers(scene,walk){
 const B=new Batch(new THREE.MeshLambertMaterial()),G=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));G.mat.userData.boost=1.8;
 const pad=(x,z,w)=>walk.some(q=>x+w>q[0]-6&&x-w<q[1]+6&&z+w>q[2]-6&&z-w<q[3]+6)||(x+w>-90&&x-w<-40&&z>-300&&z<300);
 const CROWN=[-70,110,-300,-196];const inCrown=(x,z,w)=>x+w>CROWN[0]&&x-w<CROWN[1]&&z+w>CROWN[2]&&z-w<CROWN[3];
 const tower=(x,y0,z,w,d,h,lit)=>{B.add(x,y0+h/2,z,w,h,d,pk([0x14121c,0x1a1622,0x100e16,0x1c1820]));
  for(let k=0;k<lit;k++){const f=r()<.5,sx=f?(r()<.5?-1:1):0,sz=f?0:(r()<.5?-1:1);G.add(x+(sx?sx*(w/2+.05):sr(-w/2+.5,w/2-.5)),y0+sr(1.5,h-1),z+(sz?sz*(d/2+.05):sr(-d/2+.5,d/2-.5)),sx?.08:sr(.5,1.6),sr(.35,.8),sz?.08:sr(.5,1.6),new THREE.Color(pk(WIN)).multiplyScalar(sr(.35,.8)).getHex());}
  if(r()<.3)G.add(x,y0+h+.15,z,w*.9,.12,d*.9,new THREE.Color(pk(NE)).multiplyScalar(.6).getHex());if(r()<.25)G.add(x,y0+h*sr(.55,.85),z+d/2+.1,w*.7,sr(.8,2),.06,pk(NE));};
 // --- the sea: everywhere south of the Crown deck (the Docks keep their own water plane at -0.9)
 const sea=new THREE.Mesh(new THREE.PlaneGeometry(1000,640),MATS.WATER);sea.rotation.x=-Math.PI/2;sea.position.set(0,-.95,124);scene.add(sea);
 // central sea wall: the street districts end on masonry, not on nothing
 // flooded outer city (tops 4..26 m above the water), dense near the edges, thinning out
 for(let i=0;i<900;i++){const x=sr(-320,320),z=sr(-190,440),w=sr(5,13),d=sr(5,13);if(pad(x,z,Math.max(w,d)/2+2)||inCrown(x,z,10))continue;const far=Math.hypot(x,z-40);tower(x,-.95,z,w,d,sr(4,far>200?40:24),far>220?3:7);if(r()<.2)B.add(x+w/2+2,-.85,z,4,.2,1.6,0x2a2420);}
 // --- Crown Heights deck: foundation and under-city
 B.add(20.75,-19.2,-266,169.5,37.6,68,0x16141c);B.add(93.75,-19.2,-216.5,23.5,37.6,31,0x16141c);for(let y=-34;y<-2;y+=4)G.add(20,y,-231.9,168,.12,.1,new THREE.Color(0x9fe8ff).multiplyScalar(.25).getHex());
 for(let y=-34;y<-2;y+=4)for(const x of[-64.1,105.6])G.add(x,y,-266,.1,.12,66,new THREE.Color(0xc9b2ff).multiplyScalar(.22).getHex());
 B.add(40,-38.1,-330,640,.2,300,0x0c0b12);// under-city ground
 for(let x=-280;x<=320;x+=22)G.add(x,-37.95,-330,.8,.05,300,new THREE.Color(0xffb06b).multiplyScalar(.6).getHex());for(let z=-470;z<=-190;z+=22)G.add(40,-37.95,z,640,.05,.8,new THREE.Color(0xffb06b).multiplyScalar(.6).getHex());
 B.add(40,-19.5,-189.5,640,37.2,1,0x18161e);// sea wall where the under-city meets the sea
 for(let i=0;i<700;i++){const x=sr(-300,330),z=sr(-470,-192),w=sr(6,16),d=sr(6,16);if(inCrown(x,z,Math.max(w,d)/2+3)||(x>-90&&x<-40&&z>-300))continue;tower(x,-38,z,w,d,sr(8,Math.hypot(x-20,z+248)>140?60:32),6);}
 B.build(scene);G.build(scene);}
