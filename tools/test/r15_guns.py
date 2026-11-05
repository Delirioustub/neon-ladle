# R15: gunplay. Get the gun via Ninefingers' errand, draw, fire (tracers visible), hit enemies, reload, an enemy dies.
import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));import harness
harness.P=os.environ.get('NLSHOTS',harness.P)
def f(pg,shot,lp):
  ok={};J=pg.evaluate
  def close():
    for _ in range(8):
      if J("document.getElementById('dlg').classList.contains('hide')"):return
      J("()=>{const b=document.querySelectorAll('#dopts button');b.length&&b[b.length-1].click()}");pg.wait_for_timeout(150)
  pg.click('#ccDone');pg.wait_for_timeout(800);close()
  J("()=>{__S.cash=500;}")
  # errand
  J("()=>{const s=__G.CITY.staff.find(s=>s.k==='Ninefingers');__G.talk&&0;window.R5.shopOpts(s,window.__o=[]);}")
  opts=J("__o.map(o=>o.t)");print('PAWN',opts);ok['shop_lists_guns']=any('Kestrel' in o for o in opts) and any('errand' in o for o in opts)
  J("()=>{__o[0].fx();}");pg.wait_for_timeout(200);close()
  ok['errand_started']=J("__S.q.gunq===0")
  J("()=>{__G.interact.find(i=>i.id==='gq0').fn()}");J("()=>{__G.interact.find(i=>i.id==='gq1').fn()}")
  pg.wait_for_timeout(900);close();ok['got_gun']=J("__S.gun.has===1&&__S.gun.owned.includes('kestrel')")
  # go to the docks, near the pier and draw
  J("()=>{Object.assign(__P,{x:40,z:255,y:0,yaw:Math.PI*.5,pitch:0});}");lp()
  J("()=>R5.guns.draw()");pg.wait_for_timeout(600);ok['drawn']=J("R5.guns.drawn&&R5.guns._dbg.VM.visible")
  m0=J("__S.gun.mag.kestrel")
  J("()=>R5.guns.fire()");pg.wait_for_timeout(30);ok['tracer_visible']=J("R5.guns._dbg.tracers.some(t=>t.live&&t.m.visible)")
  pg.wait_for_timeout(500);ok['fired']=J("__S.gun.mag.kestrel")==m0-1
  # fight: force a shakedown event and start it
  J("()=>{R5.force('turf');}");pg.wait_for_timeout(1500)
  for i in range(10):
    if J("!!R5.ev&&!!R5.ev.enemies"):break
    J("()=>{R5.force('turf')}");pg.wait_for_timeout(800)
  close();ok['event']=J("!!R5.ev&&!!R5.ev.enemies")
  # aim at the first enemy's chest and shoot until it dies
  aim="""()=>{const f=R5.guns.fight;if(!f)return 'nofight';const n=f.ens.find(n=>n.hp>0);if(!n)return 'alldead';const T=__G.THREE;const c=n.a.h.bones&&n.a.h.bones.Spine?n.a.h.bones.Spine.getWorldPosition(new T.Vector3()):new T.Vector3(n.a.x,1.2,n.a.z);const p=__G.cam.position;const dx=c.x-p.x,dy=c.y-p.y,dz=c.z-p.z;__P.yaw=Math.atan2(-dx,-dz);__P.pitch=Math.atan2(dy,Math.hypot(dx,dz));return 'ok'}"""
  # put both enemies in open street in front of the player so walls don't eat the ray
  J("""()=>{const e=R5.ev;const P=__P;const f=[-Math.sin(P.yaw),-Math.cos(P.yaw)];
    let k=0;for(const a of e.enemies){const x=P.x+f[0]*8+(k?1.6:-1.6)*f[1],z=P.z+f[1]*8-(k?1.6:-1.6)*f[0];
      a.x=x;a.z=z;a.h.obj.position.set(x,__G.groundY(x,z,0),z);k++;}return true}""")
  started=J("()=>{const e=R5.ev;if(!e)return false;R5.forceFight(e,'saint');return !!R5.guns.fight}")
  ok['fight_started']=started
  J("()=>{__S.hp=1e9;for(const n of R5.guns.fight.ens){n.move=null;n.cd=99;n.mt=99;}}")
  aimH="""()=>{const f=R5.guns.fight;if(!f)return 'nofight';const n=f.ens.find(n=>n.hp>0);if(!n)return 'alldead';
    const T=__G.THREE;const c=n.a.h.bones&&n.a.h.bones.Head?n.a.h.bones.Head.getWorldPosition(new T.Vector3()):new T.Vector3(n.a.x,1.65,n.a.z);
    c.y+=.05;const p=__G.cam.position;const dx=c.x-p.x,dy=c.y-p.y,dz=c.z-p.z;
    __P.yaw=Math.atan2(-dx,-dz);__P.pitch=Math.atan2(dy,Math.hypot(dx,dz));return 'ok'}"""
  for i in range(24):
    r=J(aimH)
    if r!='ok':break
    J("()=>{__S.gun.mag.kestrel=Math.max(__S.gun.mag.kestrel,1);R5.guns.fire()}");pg.wait_for_timeout(180)
    if i==0:shot('r15-firefight')
    pg.wait_for_timeout(420)
    st=J("R5.guns.fight?R5.guns.fight.ens.map(n=>n.hp):'over'")
    if st=='over' or (isinstance(st,list) and all(h<=0 for h in st)):break
  st=J("R5.guns.fight?R5.guns.fight.ens.map(n=>n.hp):'over'");print('ENEMY_HP',st)
  ok['enemy_died']=st=='over' or (isinstance(st,list) and any(h<=0 for h in st))
  ok['decals_or_sparks']=J("R5.guns._dbg.decals.some(d=>d.m.visible)||R5.guns._dbg.sparks()>0")
  # reload — drain any in-progress reload first, then top off from a known state
  try:pg.wait_for_function("!R5.guns.reloading",timeout=5000)
  except Exception:print('pre-reload drain',J("[__S.gun.mag.kestrel,__S.gun.ammo,R5.guns.reloading,R5.guns.drawn]"))
  J("()=>{if(!R5.guns.drawn)R5.guns.draw();__S.gun.cur='kestrel';__S.gun.mag.kestrel=3;__S.gun.ammo=20;R5.guns.reload()}")
  try:pg.wait_for_function("!R5.guns.reloading&&__S.gun.mag.kestrel===12",timeout=10000)
  except Exception as e:print('reload timeout',J("[__S.gun.mag.kestrel,__S.gun.ammo,R5.guns.reloading,R5.guns.drawn,R5.guns.cur&&R5.guns.cur().n]"))
  ok['reload']=J("__S.gun.mag.kestrel===12&&__S.gun.ammo===11")
  print('OK',json.dumps(ok));print('PASS' if all(ok.values()) else 'FAIL')
harness.run(f)
