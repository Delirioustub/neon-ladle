# R16: the city stands on one continuous terrain. Checks, in render space (H + logical y):
#  - terrain skin never pokes through a walkable floor (districts, roads, causeway, bridges), and sits under every sunken road
#  - the river channel (water + walls) never crosses a walkway except under a footbridge deck that clears the wall
#  - every quest NPC spawn / place marker is on a walk rect and above the terrain skin (no buried or floating feet)
#  - Harbor Rise roads stay drivable (grade <= 20%) and actually climb (Crown is >15 m above the docks); stairs exist
import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));from harness import run
OUT={}
def steps(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(800)
 r=pg.evaluate("""async()=>{const T=await import('./terrain.js');const G=__G,L=G.LAND,H=T.H;const bad=[];let n=0;
  const walk=G.W.walk;const ry=(r,x,z)=>{const q=r[5];if(q&&q.seg){const [ax,az,ay,bx,bz,by]=q.seg;const dx=bx-ax,dz=bz-az;let t=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1);t=Math.max(0,Math.min(1,t));return ay+(by-ay)*t;}return G.groundY(x,z,r[4]||0);};
  const onCap=(r,x,z)=>{const q=r[5];if(!q||!q.seg)return true;const [ax,az,,bx,bz]=q.seg;const dx=bx-ax,dz=bz-az;let t=((x-ax)*dx+(z-az)*dz)/(dx*dx+dz*dz||1);t=Math.max(0,Math.min(1,t));return Math.hypot(x-ax-dx*t,z-az-dz*t)<=q.hw;};
  for(const r of walk){if(r[2]>450||r[3]<-470||r[2]>330)continue;const w=r[1]-r[0],d=r[3]-r[2];const sx=Math.max(2,Math.ceil(w/3)),sz=Math.max(2,Math.ceil(d/3));
   for(let i=0;i<=sx;i++)for(let j=0;j<=sz;j++){const x=r[0]+w*i/sx,z=r[2]+d*j/sz;if(!onCap(r,x,z))continue;n++;const y=ry(r,x,z);const floor=H(x,z)+y;const g=L.groundAbs(x,z);
    if(g>floor-.04)bad.push(['terrain-through-floor',+x.toFixed(1),+z.toFixed(1),+(g-floor).toFixed(2)]);
    const rd=T.riverDist(x,z);if(rd.d<6.3){const wallTop=Math.max(T.wallTop(x,z,rd.r.L+.9),rd.r.L+.6);if(floor<wallTop+.3)bad.push(['walk-in-river',+x.toFixed(1),+z.toFixed(1),+(floor-wallTop).toFixed(2)]);}}}
  // quest NPCs and places
  const pts=[];for(const k in G.CAST){const c=G.CAST[k];if(c.home&&c.x!==undefined)pts.push([k,c.x,c.z]);}
  for(const k in G.PLACES){const p=G.PLACES[k];const v=Array.isArray(p)?p:(p&&[p.x,p.z]);if(v&&isFinite(v[0]))pts.push(['place:'+k,v[0],v[1]]);}
  for(const [kk,n2] of Object.entries(G.npcs||{})){const o=n2.h&&n2.h.obj||n2.obj;if(o&&o.visible)pts.push(['npc:'+kk,o.position.x,o.position.z,o.position.y]);}
  let npcBad=[];for(const [k,x,z,y] of pts){if(z>330)continue;const foot=H(x,z)+(y||0);const g=L.groundAbs(x,z);if(g>foot-.02)npcBad.push([k,+x.toFixed(1),+z.toFixed(1),+(g-foot).toFixed(2)]);}
  // road grades
  let maxG=0;for(const r of walk){const q=r[5];if(!q||!q.seg)continue;const [ax,az,ay,bx,bz,by]=q.seg;const l=Math.hypot(bx-ax,bz-az);if(l<.5)continue;maxG=Math.max(maxG,Math.abs(H(bx,bz)+by-H(ax,az)-ay)/l);}
  let treads=0;G.scene.traverse(o=>{if(o.isInstancedMesh&&o.geometry.type==='BoxGeometry'&&o.geometry.parameters.width===1.15)treads+=o.count;});
  return {samples:n,bad:bad.slice(0,40),nbad:bad.length,checkedNPC:pts.length,npcBad,maxGrade:+maxG.toFixed(3),climb:+(H(94,-207)-H(58,220)).toFixed(1),treads,falls:L.falls.length};}""")
 OUT.update(r);print(json.dumps(r))
run(steps)
ok=OUT.get('nbad',1)==0 and not OUT.get('npcBad',[1]) and OUT.get('maxGrade',1)<=.2 and OUT.get('climb',0)>15 and OUT.get('treads',0)>40 and OUT.get('falls',0)>=3 and OUT.get('checkedNPC',0)>5
print('PASS' if ok else 'FAIL')
