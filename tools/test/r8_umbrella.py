# R8: follow-cam close-up of a walking umbrella NPC (hand on the shaft via IK)
import sys,os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
def steps(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(800)
 pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};__G.setTP(false);__S.min=21*60;__ENV.set('rain',true)}")
 for k in range(3):
  pg.evaluate("()=>{for(let i=0;i<6;i++){const d=document.querySelector('#dlg');if(!d||d.classList.contains('hide'))break;const b=[...document.querySelectorAll('#dopts button')];if(b.length)b[b.length-1].click();else d.click();}}")
  ok=pg.evaluate("""(k)=>{const V=__G.THREE.Vector3;const hs=[];__G.scene.traverse(o=>{if(o.userData&&o.userData.umb&&o.visible){let r=o;while(r.parent&&!r.userData.human)r=r.parent;hs.push(r)}});
   hs.sort((a,b)=>a.position.distanceTo(new V(0,0,-2))-b.position.distanceTo(new V(0,0,-2)));const r=hs[k];if(!r)return false;
   cancelAnimationFrame(window.__f);const go=()=>{const p=r.getWorldPosition(new V());const a=r.rotation.y,fx=-Math.sin(a),fz=-Math.cos(a);__P.x=p.x-fx*1.2+fz*2.4;__P.z=p.z-fz*1.2-fx*2.4;__P.y=0;__P.yaw=Math.atan2(-(p.x-__P.x),-(p.z-__P.z));__P.pitch=.05;window.__f=requestAnimationFrame(go)};go();return hs.length}""",k)
  print('umb',k,ok);pg.wait_for_timeout(2500);pg.screenshot(path=f'/workspace/neon-ladle/shots/r8-umbrella-{k}.png')
run(steps)
