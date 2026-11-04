// R8: scenery that intrudes into drivable space.
//  (a) anything solid-looking between knee and head height on the Ring Causeway deck/ramps (walk rects west of x=-46.9), shrunk by the 0.35m body radius;
//  (b) any big block (>4m tall, >1m^2 footprint) standing on ANY level-0 walk rect, anywhere in the city (the old skyline towers on the deck).
void (window.__SCENERY=(opts)=>{opts=opts||{};const G=__G,T=G.THREE;const box=new T.Box3(),m=new T.Matrix4(),hits=[];const sh=.35;
 const L0=G.W.walk.filter(r=>(r[4]||0)===0).map(r=>[r[0]+sh,r[1]-sh,r[2]+sh,r[3]-sh]).filter(r=>r[1]>r[0]&&r[3]>r[2]);
 const deck=L0.filter(r=>r[0]<-46.9&&r[1]<=-46);
 const ov=(b,r)=>Math.min(b.max.x,r[1])-Math.max(b.min.x,r[0])>.05&&Math.min(b.max.z,r[3])-Math.max(b.min.z,r[2])>.05;
 const test=(b,o)=>{if(b.max.y<.15||b.min.y>2.2)return;const s=b.getSize(new T.Vector3());const big=s.y>4&&s.x*s.z>1&&b.min.y<.5;
  for(const r of big?L0:deck)if(ov(b,r)){hits.push({kind:big?'tall-on-street':'on-deck',g:o.geometry.type+'/'+o.material.type+(o.material.transparent?'/t':''),c:b.getCenter(new T.Vector3()).toArray().map(v=>+v.toFixed(2)),s:s.toArray().map(v=>+v.toFixed(2))});return;}};
 G.scene.updateMatrixWorld(true);
 G.scene.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||!o.visible||(o.material.transparent&&o.material.opacity<.6))return;// light beams / cones are see-through, not obstacles
 let p=o;while(p){if(p.userData&&(p.userData.human||p.userData.dyn||p.userData.room))return;p=p.parent;}
  const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();
  if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);box.copy(g.boundingBox).applyMatrix4(m);test(box,o);}}
  else{box.copy(g.boundingBox).applyMatrix4(o.matrixWorld);test(box,o);}});
 return hits;});
