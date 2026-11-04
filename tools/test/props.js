// R9: solid props (knee..head height, footprint 0.15..60 m2, under 8 m tall) on level-0 street rects that the player can walk through (centre not blocked).
void (window.__PROPS=()=>{const G=__G,T=G.THREE;const box=new T.Box3(),m=new T.Matrix4(),hits=[];
 G.scene.updateMatrixWorld(true);const L0=G.W.walk.filter(r=>(r[4]||0)===0);const py=__P.y;__P.y=0;
 const test=(b,o)=>{if(b.max.y<.5||b.min.y>1.2)return;const s=b.getSize(new T.Vector3());if(s.x*s.z<.15||s.x*s.z>60||s.y>8||Math.min(s.x,s.z)<.25)return;
  const c=b.getCenter(new T.Vector3());if(!L0.some(r=>c.x>r[0]&&c.x<r[1]&&c.z>r[2]&&c.z<r[3]))return;if(G.walkable(c.x,c.z))hits.push({c:[+c.x.toFixed(1),+c.z.toFixed(1)],s:[+s.x.toFixed(1),+s.y.toFixed(1),+s.z.toFixed(1)],y:+b.min.y.toFixed(2),g:o.name||o.geometry.type});};
 G.scene.traverse(o=>{if(!o.isMesh||o.isSkinnedMesh||!o.visible||o.material.transparent)return;let p=o;while(p){if(p.userData&&(p.userData.human||p.userData.dyn||p.userData.room))return;p=p.parent;}
  const g=o.geometry;if(!g.boundingBox)g.computeBoundingBox();
  if(o.isInstancedMesh){for(let i=0;i<o.count;i++){o.getMatrixAt(i,m);m.premultiply(o.matrixWorld);box.copy(g.boundingBox).applyMatrix4(m);test(box,o);}}
  else{box.copy(g.boundingBox).applyMatrix4(o.matrixWorld);test(box,o);}});
 __P.y=py;return hits;});
