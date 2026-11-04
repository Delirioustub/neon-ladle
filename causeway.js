// R4: the Ring Causeway, an elevated wet highway that physically links Saltgate (mid), Crown Heights (rich) and Ashline Docks (poor).
// You can see the towers from the street; now you can walk or ride there.
import * as THREE from 'three';
import {Batch,signTex,MATS} from './world.js';
const rnd=(a,b)=>a+Math.random()*(b-a),pick=a=>a[Math.floor(Math.random()*a.length)];
export function buildCauseway(scene,cand){const out={walk:[],anim:[],signs:[]};
 const X0=-78,X1=-70,XC=-74,Z0=-266,Z1=266;
 const B=new Batch(new THREE.MeshLambertMaterial()),Gl=new Batch(new THREE.MeshBasicMaterial({toneMapped:false})),Gh=new Batch(new THREE.MeshBasicMaterial({toneMapped:false}));Gl.mat.userData.boost=1.6;Gh.mat.userData.boost=1.25;
 const L=(x,y,z,col,int=4,dist=9)=>cand.push({x,y,z,col,int,dist,pri:0});
 const W=(x0,x1,z0,z1)=>out.walk.push([Math.min(x0,x1),Math.max(x0,x1),Math.min(z0,z1),Math.max(z0,z1),0]);
 const deck=(x0,x1,z0,z1)=>{const m=new THREE.Mesh(new THREE.PlaneGeometry(x1-x0,z1-z0),MATS.ROAD);m.rotation.x=-Math.PI/2;m.position.set((x0+x1)/2,.005,(z0+z1)/2);scene.add(m);B.add((x0+x1)/2,-.35,(z0+z1)/2,x1-x0+.4,.7,z1-z0,0x16141c);};
 // spine + three ramps (Saltgate west portal, Crown west cap, Ashline west cap)
 deck(X0,X1,Z0,Z1);W(X0+.2,X1+.6,Z0,Z1);
 const ramps=[[-70.5,-47,-3.2,3.2,'SALTGATE',0xff3fa4],[-70.5,-58.6,-263.2,-256.8,'CROWN HEIGHTS',0x9fe8ff],[-70.5,-48.6,256.8,263.2,'ASHLINE DOCKS',0xff8a3d]];
 for(const [x0,x1,z0,z1,name,col] of ramps){deck(Math.max(x0,X1-.1),x1,z0,z1);W(x0,x1,z0,z1);
  for(const z of[z0,z1]){B.add((x0+x1)/2+.6,.55,z,x1-x0-1.2,1.1,.25,0x2a2832);Gh.add((x0+x1)/2+.6,1.12,z,x1-x0-1.2,.05,.27,col);}
 }
 // barriers with neon trim (gaps where ramps join)
 const gapAt=z=>ramps.some(r=>z>r[2]-.5&&z<r[3]+.5);
 for(let z=Z0;z<Z1;z+=4){const cz=z+2;const col=Math.abs(cz)<60?0xff3fa4:cz<0?0x9fe8ff:0xff8a3d;
  B.add(X0-.12,.55,cz,.25,1.1,4,0x2a2832);Gh.add(X0-.12,1.12,cz,.27,.03,3.6,col);
  if(!gapAt(cz)){B.add(X1+.12,.55,cz,.25,1.1,4,0x2a2832);Gh.add(X1+.12,1.12,cz,.27,.03,3.6,col);}
  if(z%8===0)Gl.add(XC,.02,cz,.12,.01,2,0xd8d0b0);Gl.add(X0+.5,.012,cz,.25,.01,4,new THREE.Color(col).multiplyScalar(.22).getHex());Gl.add(X1-.5,.012,cz,.25,.01,4,new THREE.Color(col).multiplyScalar(.22).getHex());}
 for(const z of[Z0,Z1]){B.add(XC,.8,z,8.4,1.6,.4,0x2a2832);Gh.add(XC,1.62,z,8.4,.06,.42,0xff2040);}
 // sodium lamps + pillars into the fog below
 for(let z=Z0+8,i=0;z<Z1;z+=14,i++){const x=i%2?X0-.1:X1+.1,s=i%2?1:-1;B.add(x,3.2,z,.14,6.4,.14,0x3a3844);B.add(x+s*1,6.35,z,2,.1,.18,0x3a3844);Gh.add(x+s*1.7,6.25,z,.5,.06,.25,0xffc070);L(x+s*1.7,5.6,z,0xffb878,13,20);out._pools=(out._pools||[]).concat([[x+s*1.4,z]]);}
 for(let z=Z0+15;z<Z1;z+=30){B.add(XC,-22,z,3,44,3,0x15131b);B.add(XC,-1.2,z,9,1.2,1.6,0x1a1820);}
 // the city around it: towers you pass, with lit windows facing the road
 const WIN=[0xffc98a,0x3ff0ff,0xff3fa4,0xffe14d,0xd8e8ff];
 for(let z=Z0+10;z<Z1;z+=rnd(14,24))for(const side of[-1,1]){if(side>0&&(Math.abs(z)<95||Math.abs(z)>228))continue;
  const w=rnd(10,18),d=rnd(10,18),h=rnd(25,95),x=side<0?X0-14-w/2-rnd(0,24):X1+12+w/2+rnd(0,16),y0=-30;B.add(x,y0+h/2,z,w,h,d,pick([0x1a1824,0x16141e,0x201a2a,0x141a22]));
  const fx=x-side*w/2-side*.02;for(let k=0;k<26;k++)Gl.add(fx,rnd(-8,h+y0-2),z+rnd(-d/2+.6,d/2-.6),.04,.8,.6,new THREE.Color(pick(WIN)).multiplyScalar(rnd(.3,.85)).getHex());
  if(Math.random()<.25){Gh.add(fx-side*.05,h+y0-2,z,.04,.25,d-.4,pick([0xff3fa4,0x3ff0ff,0xb04dff]));}}
 const BILL=[['ORRIN MUTUAL · YOUR FUTURE, FINANCED',0xc9b2ff,-110],['WARDLINE IS WATCHING · DRIVE SAFE',0x3f8aff,-190],['HALCYON SLEEP PODS',0x3ff0ff,-60],['RING CAUSEWAY',0xff3fa4,40],['LOST SOMEONE? ORRIN CARES',0xc9b2ff,120],['ASHLINE ↓  CHEAP FISH',0xff8a3d,200],['CROWN EXCHANGE ↑',0x9fe8ff,-30]];
 for(const [t,col,z] of BILL){const st=signTex(t,col,{fs:56});const h=1.6;const m=new THREE.Mesh(new THREE.PlaneGeometry(h*st.aspect,h),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,side:THREE.DoubleSide,color:new THREE.Color(1.2,1.2,1.2)}));m.position.set(X0-9,rnd(9,13),z);m.rotation.y=Math.PI/2;scene.add(m);B.add(X0-9.1,m.position.y,z,.2,h+.3,h*st.aspect+.3,0x0c0a12);L(X0-7,m.position.y-1,z,col,4,12);}
 // overhead exit signs
 for(const [t,col,z,ry] of[['← SALTGATE',0xff3fa4,-10,0],['SALTGATE →',0xff3fa4,10,Math.PI],['CROWN HEIGHTS ↑',0x9fe8ff,-240,Math.PI],['ASHLINE DOCKS ↑',0xff8a3d,240,0],['CROWN HEIGHTS',0x9fe8ff,8,0],['ASHLINE DOCKS',0xff8a3d,-8,Math.PI]]){const st=signTex(t,col,{fs:48});const m=new THREE.Mesh(new THREE.PlaneGeometry(.7*st.aspect,.7),new THREE.MeshBasicMaterial({map:st.t,toneMapped:false,side:THREE.DoubleSide}));m.position.set(XC,5.4,z);m.rotation.y=ry;scene.add(m);B.add(XC,5.9,z,8.4,.12,.12,0x2a2832);for(const x of[X0-.2,X1+.2])B.add(x,2.95,z,.2,5.9,.2,0x2a2832);}
 // sky traffic overhead
 const car=new THREE.BoxGeometry(1.6,.45,3.2);const cars=[];for(let i=0;i<12;i++){const g=new THREE.Group();g.add(new THREE.Mesh(car,new THREE.MeshLambertMaterial({color:0x1a1a24})));const hl=new THREE.Mesh(new THREE.BoxGeometry(1.4,.12,.05),new THREE.MeshBasicMaterial({color:new THREE.Color(i%2?0xfff1d8:0xff2040).multiplyScalar(3),toneMapped:false}));hl.position.z=1.62;g.add(hl);const und=new THREE.Mesh(new THREE.BoxGeometry(1.2,.04,2.6),new THREE.MeshBasicMaterial({color:new THREE.Color(pick([0x3ff0ff,0xff3fa4,0xb04dff])).multiplyScalar(2),toneMapped:false}));und.position.y=-.25;g.add(und);scene.add(g);cars.push({g,z:rnd(Z0,Z1),v:(i%2?1:-1)*rnd(14,22),x:XC+(i%2?2.4:-2.4)+rnd(-.5,.5),y:rnd(8,13)});g.rotation.y=cars[i].v>0?0:Math.PI;}
 out.anim.push((t,dt)=>{for(const c of cars){c.z+=c.v*dt;if(c.z>Z1+40)c.z=Z0-40;if(c.z<Z0-40)c.z=Z1+40;c.g.position.set(c.x,c.y+Math.sin(t+c.x)*.2,c.z);}});
 {const c=document.createElement('canvas');c.width=4;c.height=128;const g=c.getContext('2d'),gr=g.createLinearGradient(0,0,0,128);gr.addColorStop(0,'rgba(0,0,0,0)');gr.addColorStop(.55,'rgba(120,60,140,.35)');gr.addColorStop(.85,'rgba(255,120,170,.55)');gr.addColorStop(1,'rgba(255,170,120,.7)');g.fillStyle=gr;g.fillRect(0,0,4,128);
  const tx=new THREE.CanvasTexture(c);tx.colorSpace=THREE.SRGBColorSpace;const gm=new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,fog:false,toneMapped:false,side:THREE.DoubleSide});
  out.glow=[];for(const [dx,dz,ry] of[[-150,0,1],[140,0,1],[0,-170,0],[0,170,0]]){const m=new THREE.Mesh(new THREE.PlaneGeometry(ry?340:340,80),gm);m.userData.d=[dx,dz];m.position.set(XC+dx,6,dz);m.rotation.y=ry?Math.PI/2:0;m.renderOrder=-1;m.visible=false;scene.add(m);out.glow.push(m);}
  out.follow=(x,z)=>{const on=x<-50&&x>-100;for(const m of out.glow){m.visible=on;if(on)m.position.set(XC+m.userData.d[0],6,z+m.userData.d[1]);}};}
 {for(let z=Z0+8,i=0;z<Z1;z+=14,i++){const x=i%2?X0-.1:X1+.1,s=i%2?1:-1;Gh.add(x+s*1.7,6.22,z,.9,.08,.4,0xffd090);}}
 {const c=document.createElement('canvas');c.width=c.height=64;const g=c.getContext('2d'),gr=g.createRadialGradient(32,32,0,32,32,32);gr.addColorStop(0,'rgba(255,190,120,.9)');gr.addColorStop(.45,'rgba(255,140,70,.35)');gr.addColorStop(1,'rgba(0,0,0,0)');g.fillStyle=gr;g.fillRect(0,0,64,64);
  const tx=new THREE.CanvasTexture(c);const pg=new THREE.PlaneGeometry(1,1);pg.rotateX(-Math.PI/2);const pm=new THREE.MeshBasicMaterial({map:tx,transparent:true,depthWrite:false,blending:THREE.AdditiveBlending,toneMapped:false,opacity:.75});
  const P=out._pools;const im=new THREE.InstancedMesh(pg,pm,P.length);const o=new THREE.Object3D();P.forEach((p,i)=>{o.position.set(p[0],.03,p[1]);o.scale.set(7,1,9);o.updateMatrix();im.setMatrixAt(i,o.matrix);});im.computeBoundingSphere();scene.add(im);}
 B.build(scene);Gl.build(scene);Gh.build(scene);
 return out;}
