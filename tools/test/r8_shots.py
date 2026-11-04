# R8 screenshots: kitchen pass, Sela on the stool, umbrella grip, causeway ramps, apartment interiors, door cues.
import sys,os,math,json;sys.path.insert(0,os.path.dirname(__file__));from harness import run
def yaw(fx,fz,tx,tz):return math.atan2(-(tx-fx),-(tz-fz))
def steps(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(800);pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};__G.setTP(true)}")
 CL="()=>{for(let i=0;i<6;i++){const d=document.querySelector('#dlg');if(!d||d.classList.contains('hide'))break;const b=[...document.querySelectorAll('#dopts button')];if(b.length)b[b.length-1].click();else d.click();}}"
 def sh(n,x,z,yw,h=21,y=0,js=None,tp=True):
  pg.evaluate(CL);pg.evaluate(f"__G.setTP({'true' if tp else 'false'})");shot(n,h,'rain',{'x':x,'z':z,'y':y,'yaw':yw},js);pg.evaluate(CL)
 sh('r8-pass',0,-7.0,math.pi,tp=False);sh('r8-pass-range',0,-6.2,0,tp=False)
 pg.evaluate("()=>{__S.min=20*60+40;__S.open=true}");pg.wait_for_timeout(9000)
 sx=pg.evaluate("()=>{const n=__G.npcs.sela,p=__G.placePos('stool:3');n.place='stool:3';n.obj.position.set(p[0],0,p[1]);n.route=[];n.arrived=true;return p[0]}")
 pg.wait_for_timeout(1500);print('sela',pg.evaluate("()=>{const o=__G.npcs.sela.obj;return [o.position.toArray(),o.rotation.y,__G.npcs.sela.arrived]}"))
 sh('r8-stool',sx+1.6,-2.6,yaw(sx+1.6,-2.6,sx,-5.3),h=20.7,tp=False)
 # follow-cam on a walking umbrella NPC (they move, so pin the camera to them every frame)
 pg.evaluate(CL);pg.evaluate("__G.setTP(false)")
 ok=pg.evaluate("""()=>{let h=null;__G.scene.traverse(o=>{if(!h&&o.userData&&o.userData.umb&&o.visible)h=o;});if(!h)return false;let r=h;while(r.parent&&!r.userData.human)r=r.parent;
  const go=()=>{const p=r.getWorldPosition(new __G.THREE.Vector3());const fx=-Math.sin(r.rotation.y),fz=-Math.cos(r.rotation.y);__P.x=p.x+fz*2.2-fx*.6;__P.z=p.z-fx*2.2-fz*.6;__P.yaw=Math.atan2(-(p.x-__P.x),-(p.z-__P.z));__P.pitch=.12;window.__follow=requestAnimationFrame(go)};go();return true}""")
 print('umbrella follow',ok);pg.wait_for_timeout(2500);pg.screenshot(path='/workspace/neon-ladle/shots/r8-umbrella.png');pg.evaluate("cancelAnimationFrame(window.__follow)")
 sh('r8-causeway-crown',-75,-252,yaw(-75,-252,-60,-260))
 sh('r8-causeway-saltgate',-75,8,yaw(-75,8,-55,0))
 X,Z=60,800
 sh('r8-apt-living',X+1.2,Z+.4,math.pi/2,h=23)
 sh('r8-apt-bed',X+1.0,Z-.4,yaw(X+1,Z-.4,X+3.9,Z+2.3),h=23)
 sh('r8-apt-kitchen',X+.6,Z+.6,yaw(X+.6,Z+.6,X+2.8,Z-2.6),h=23)
 sh('r8-apt-bath',X-2.6,Z-.6,yaw(X-2.6,Z-.6,X-4.4,Z-2.6),h=23)
 sh('r8-apt-window',X-.5,Z-1.5,math.pi,h=23)
 sh('r8-apt-tv',X-2.4,Z+1.2,yaw(X-2.4,Z+1.2,X+1.73,Z+1.4),h=23,js="()=>{const t=__G.interact.find(i=>i.id=='apttvhome');if(t)t.fn()}")
 D=pg.evaluate("__G.CITY.doors.map(d=>[d.x,d.z,d.dir,d.name])");print('doors',D)
 for i,(x,z,d,n) in enumerate(D[:4]):
  sh(f'r8-door-{i}-'+''.join(c for c in n.lower() if c.isalnum())[:12],x+.6,z-d*3.0,0 if d<0 else math.pi,h=22)
  print(n,'prompt:',pg.evaluate("()=>{const n=__G.near;return n&&n.label}"))
 sh('r8-door-home',-6.2,-5.6,0,h=22);print('home prompt',pg.evaluate("()=>{const n=__G.near;return n&&n.label}"))
 sh('r8-door-map',0,-3,0,h=22,js="()=>__G.openMap()")
run(steps)
