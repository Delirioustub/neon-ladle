// R7 headless main-story autoplay. Injected by tools/test/r7.py into a running game (window.__G / __S).
// Drives every main-quest step from a fresh save, checks each step has a target (NPC/coords),
// that the target exists and is reachable on foot from the spawn, then fires the step's trigger.
window.__T=(()=>{const G=__G,S=__S;const log=[],bad=[];
 const dlgOpen=()=>!document.querySelector('#dlg').classList.contains('hide');
 const btns=()=>[...document.querySelectorAll('#dopts button')];
 // multi-level flood fill from the spawn + metro platforms; ladders/elevators (CITY.inter tp acts) link levels
 let R=null,RN=-1;const C=.25,X0=-110,X1=110,Z0=-300,Z1=300,NX=(X1-X0)/C|0,NZ=(Z1-Z0)/C|0;
 const lv=y=>Math.round(y*2)/2;
 function reach(){if(R&&RN===G.W.walk.length)return R;RN=G.W.walk.length;R=new Map();const P0=__P.y;const q=[];
  const grid=y=>{let g=R.get(y);if(!g)R.set(y,g=new Uint8Array(NX*NZ));return g;};
  const ok=(y,i,j)=>{__P.y=y;return G.walkable(X0+i*C+C/2,Z0+j*C+C/2);};
  const seed=(x,z,y)=>{y=lv(y);const i=((x-X0)/C|0),j=((z-Z0)/C|0);if(i<0||j<0||i>=NX||j>=NZ)return;const g=grid(y);if(g[i*NZ+j]||!ok(y,i,j))return;g[i*NZ+j]=1;q.push([y,i*NZ+j]);};
  const flood=()=>{while(q.length){const [y,c]=q.pop(),g=R.get(y),i=c/NZ|0,j=c%NZ;for(const [di,dj] of[[1,0],[-1,0],[0,1],[0,-1]]){const a=i+di,b=j+dj;if(a<0||b<0||a>=NX||b>=NZ)continue;const k=a*NZ+b;if(g[k])continue;if(ok(y,a,b)){g[k]=1;q.push([y,k]);}}}};
  seed(-3.5,-1.5,0);for(const k in G.CITY.stations){const s=G.CITY.stations[k].spawn;seed(s[0],s[1],0);}flood();
  const tps=(G.CITY.inter||[]).filter(i=>i.act&&i.act.type==='tp');const used=new Set();
  for(let pass=0;pass<8;pass++){let any=0;for(const t of tps){if(used.has(t))continue;if(near(t.x,t.z,t.y-1.3,t.r||2)){used.add(t);seed(t.act.x,t.act.z,t.act.y);any=1;}}flood();if(!any)break;}
  __P.y=P0;return R;}
 function near(x,z,y,r){const g=R.get(lv(Math.max(0,y)));if(!g)return false;for(let dx=-r;dx<=r;dx+=C)for(let dz=-r;dz<=r;dz+=C){if(dx*dx+dz*dz>r*r)continue;const i=((x+dx-X0)/C|0),j=((z+dz-Z0)/C|0);if(i>=0&&j>=0&&i<NX&&j<NZ&&g[i*NZ+j])return true;}return false;}
 const reachable=(x,z,r=2.6)=>{if(z>400)return true;/* Node 14: entered via the seal teleport */reach();for(const y of R.keys())if(near(x,z,y,r))return true;return false;};
 // R10b presence: the NPC must actually be in the world when the player arrives (after having been far away), visible, near its place, on walkable ground, and talkable (in CAST).
 const PRES=[];const W0=['clear','rain','storm'];
 function present(id,k,h){const n=G.npcs[k];if(!n)return k+' no npc';const p=G.placeFor(k);if(!p)return k+' not placed';const pp=G.placePos(p);if(!pp)return null;const P=__P,c=G.cam.position,sv=[P.x,P.z,P.y];
  P.x=0;P.z=-200;P.y=0;c.set(0,1.6,-200);for(let i=0;i<3;i++)G.tickNPCs(.05);P.x=pp[0]+1.5;P.z=pp[1]+1.5;c.set(P.x,1.6,P.z);for(let i=0;i<40;i++)G.tickNPCs(.1);
  const o=n.obj.position,e=[];if(!n.obj.visible)e.push('invisible');const d=Math.hypot(o.x-pp[0],o.z-pp[1]);if(p!=='ilse_patrol'&&d>4)e.push('far '+d.toFixed(1));let ta=G.stepOf(id).at;if(typeof ta==='function')ta=ta();const tg=G.stepTarget(G.stepOf(id));if(ta===k&&tg&&tg.x!==undefined&&Math.hypot(tg.x-o.x,tg.z-o.z)>4)e.push('waypoint off');
  if(p.indexOf('stool')<0&&o.y<.5){P.y=0;if(!G.inWalk(o.x,o.z,0))e.push('not on walk');}if(!G.CAST||!G.CAST[k])e.push('no cast');P.x=sv[0];P.z=sv[1];P.y=sv[2];return e.length?k+'@'+p+' '+e.join(','):null;}
 function check(id,s){const hrs=window.__PRES?[19,21.5,23.75,1.5,3,9,13,17]:[19,21.5,23.75,1.5];const out=[];const m0=S.min;
  for(const h of hrs){S.min=(h<12?h+24:h)*60;let a=s.at;if(typeof a==='function')a=a();if(!a){out.push(h+':no target');continue;}
   if(typeof a==='string'){const p=G.placeFor(a);if(!p){out.push(h+':'+a+' not placed');continue;}const n=G.npcs[a];G.tickNPCsOnce&&G.tickNPCsOnce();const pp=G.placePos(p);if(pp&&!reachable(pp[0],pp[1]))out.push(h+':'+a+'@'+p+' unreachable');}
   if(window.__PRES){const ks=new Set(typeof a==='string'?[a]:[]);for(const ev of G.onList(s))if(ev.startsWith('talk:'))ks.add(ev.slice(5));for(const k of ks){if(!G.npcs[k]){out.push(h+":"+k+" no npc");continue;}if(!G.placeFor(k))continue;const r=present(id,k,h);if(r)out.push(h+':'+r);}}
   else if(!reachable(a[0],a[1]))out.push(h+':'+a.join(',')+' unreachable');}
  S.min=m0;const tg=G.stepTarget(s);if(!tg)out.push('no live waypoint');return out;}
 function fire(id,s,pref){const st=S.q[id];const ons=G.onList(s);
  for(const ev of ons){const [kind,arg]=ev.split(':');
   if(kind==='talk'){G.npcs[arg]&&(G.talk(arg));}
   else if(kind==='interact'){const i=G.interact.find(i=>i.id===arg);if(!i){bad.push(id+': no interactable '+arg);continue;}if(i.cond&&!i.cond()){bad.push(id+': '+arg+' cond false');continue;}i.fn();}
   else if(kind==='staff'){const i=G.interact.find(i=>String(i.id).startsWith('staff')&&i.label.endsWith(arg));if(!i){bad.push(id+': no staff '+arg);continue;}i.fn();}
   else G.emit(ev);
   for(let n=0;n<14&&dlgOpen();n++){const b=btns();let pick=b[0];if(pref)for(const re of pref){const f=b.find(x=>re.test(x.textContent));if(f){pick=f;break;}}pick.click();}
   if(S.q[id]!==st)return true;}
  return S.q[id]!==st;}
 function run(pref,maxSteps=80){for(let n=0;n<6&&dlgOpen();n++)btns()[0].click();for(let n=0;n<maxSteps;n++){const id=S.track;if(!id||typeof S.q[id]!=='number'||!G.Q[id].main){break;}const s=G.stepOf(id);const iss=check(id,s);log.push(`${id}[${S.q[id]}] ${s.d}${iss.length?'  !! '+iss.join('; '):''}`);if(iss.length)bad.push(id+'['+S.q[id]+'] '+iss.join('; '));
   if(!fire(id,s,pref)){bad.push(id+'['+S.q[id]+'] did not advance');break;}
   G.flush&&G.flush();}return {log,bad,q:S.q,track:S.track};}
 return {run,reach,reachable,log,bad};})();
