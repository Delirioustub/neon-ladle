// R14b: real vehicles. Quaternius Cars bundle (CC0, poly.pizza) for parked/street cars and the Pixor/Frakassets hover car (CC0) for
// the flying lanes. Anything that wants a car registers a slot (a Group + kind + district); slots fill as soon as the GLBs load and the
// old placeholder boxes in that Group are hidden. Each district gets its own paint tint and neon trim (sill strips + underglow) that
// hug the body. Collision stays with the AABBs the city already pushes for parked cars.
import * as THREE from 'three';
import {GLTFLoader} from 'three/addons/loaders/GLTFLoader.js';
const DIST={crown:{tint:0xe8e2d4,mix:.55,trim:0xffe0a0},salt:{tint:0x3a2a5a,mix:.45,trim:0x3ff0ff,trim2:0xff3fa4},docks:{tint:0x5a4a38,mix:.55,trim:0xff8a3d}};
const LIB={cars:[],hover:null};let ready=false;const slots=[];
const PAINT=/^(White|Blue|Orange|DarkOrange|LightBlue|Yellow|Violet paint|Material\.007)$/;
const glow=c=>new THREE.MeshBasicMaterial({color:new THREE.Color(c).multiplyScalar(2.2),toneMapped:false});
function norm(scene,hover){// centre on the ground, front = +z
 scene.updateMatrixWorld(true);const bb=new THREE.Box3().setFromObject(scene);const g=new THREE.Group();const c=bb.getCenter(new THREE.Vector3());scene.position.sub(new THREE.Vector3(c.x,bb.min.y,c.z));g.add(scene);
 let fz=0;scene.traverse(o=>{if(o.isMesh){const ms=Array.isArray(o.material)?o.material:[o.material];if(ms.some(m=>/Headlights/.test(m.name||''))){const b=new THREE.Box3().setFromObject(o);fz+=b.getCenter(new THREE.Vector3()).z-c.z;}}});
 if(hover)fz=1;// hover: nose already +z (checked in shots/r14b-cars-*)
 if(fz<0)scene.parent.rotation.y=Math.PI;const w=new THREE.Group();w.add(g);const s=bb.getSize(new THREE.Vector3());w.userData.size=s;return w;}
const ld=new GLTFLoader();
export const carsLoaded=Promise.all([...[1,2,3,4,5,6,7].map(i=>ld.loadAsync(`models/cars/car${i}.glb`).then(g=>LIB.cars[i-1]=norm(g.scene))),ld.loadAsync('models/cars/hover.glb').then(g=>LIB.hover=norm(g.scene,1))])
 .then(()=>{ready=true;for(const s of slots)fill(s);}).catch(e=>console.warn('cars fallback',e));
const matCache=new Map();
function dress(src,d,kind){const D=DIST[d]||DIST.salt;const o=src.clone(true);const s=src.userData.size;
 o.traverse(m=>{if(!m.isMesh)return;const one=mt=>{const n=mt.name||'';const k=d+'|'+kind+'|'+n;if(matCache.has(k))return matCache.get(k);let r;
   if(/Headlights|WhiteLights/.test(n))r=glow(0xfff1d8);else if(/TailLights/.test(n))r=glow(0xff2040);else if(/BlueLights/.test(n))r=glow(0x3f8aff);else if(/neon/i.test(n))r=glow(/Pink/.test(n)?(D.trim2||D.trim):D.trim);
   else{r=mt.clone();if(PAINT.test(n)&&kind!=='taxi'&&kind!=='police')r.color.lerp(new THREE.Color(D.tint),D.mix);if(/Windows|glass/i.test(n)){r.color=new THREE.Color(0x101820);r.metalness=.6;r.roughness=.15;}}
   matCache.set(k,r);return r;};m.material=Array.isArray(m.material)?m.material.map(one):one(m.material);m.castShadow=false;});
 // neon: sill strips along both sides + soft underglow, sized to the body box
 const tm=glow(D.trim);const L=s.z*.62,y=s.y*.2;for(const e of[-1,1]){const b=new THREE.Mesh(new THREE.BoxGeometry(.025,.025,L),tm);b.position.set(e*(s.x/2-.04),y,0);o.add(b);}
 if(kind==='hover'||kind==='sky'){const ug=new THREE.Mesh(new THREE.PlaneGeometry(s.x*.8,s.z*.8),new THREE.MeshBasicMaterial({color:new THREE.Color(D.trim).multiplyScalar(1.4),transparent:true,opacity:.55,blending:THREE.AdditiveBlending,depthWrite:false,toneMapped:false}));ug.rotation.x=-Math.PI/2;ug.position.y=.02;o.add(ug);}
 return o;}
function fill(s){if(s.done)return;const src=s.kind==='hover'?LIB.hover:s.kind==='police'?LIB.cars[1]:s.kind==='taxi'?LIB.cars[5]:LIB.cars[[0,2,3,4,6][s.seed%5]];if(!src)return;
 const o=dress(src,s.d,s.kind);o.rotation.y=s.ry||0;if(s.y)o.position.y=s.y;if(s.scale)o.scale.setScalar(s.scale);for(const c of s.g.children)c.visible=false;s.g.add(o);s.done=1;}
// g: Group already placed in the world (placeholder children are hidden on fill); ry: extra yaw so the nose faces the Group's travel axis
export function carSlot(g,kind,d,seed=0,ry=0,y=0,scale=1){const s={g,kind,d,seed,ry,y,scale};slots.push(s);if(ready)fill(s);return s;}
