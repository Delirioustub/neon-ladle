# R15 visual QA: draw VM, fire tracer, impact, firefight, reload
import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));import harness
harness.P=os.environ.get('NLSHOTS','/tmp/r15gunshots/')
os.makedirs(harness.P,exist_ok=True)
def f(pg,shot,lp):
  J=pg.evaluate
  def close():
    for _ in range(10):
      if J("document.getElementById('dlg').classList.contains('hide')"):return
      J("()=>{const b=document.querySelectorAll('#dopts button');b.length&&b[b.length-1].click()}");pg.wait_for_timeout(120)
  pg.click('#ccDone');pg.wait_for_timeout(900);close()
  J("()=>{__S.cash=800;__S.hp=999;__ENV.set('rain',false);__S.flags.gunDrawHint=1;__S.flags.gunHint=1;__S.gang={id:'tide',rank:2};}")
  J("""()=>{
    R5.guns.give('kestrel',48,true);
    R5.guns.give('rattler',48,true);
    __S.gun.cur='kestrel';
    Object.assign(__P,{x:40,z:255,y:0,yaw:Math.PI*.5,pitch:-0.22});
    if(__G.player) __G.player.obj.visible=false;
    __G.setTP(false);
  }""")
  lp();lp();lp()
  J("()=>{R5.guns._dbg.rebuildStatics();R5.guns.draw()}")
  pg.wait_for_timeout(500)
  print('VM',J("""()=>{const g=R5.guns._dbg;return{drawn:R5.guns.drawn,vmVis:g.VM.visible,statics:g.statics(),muzzle:g.vmGun&&[...Object.values(g.vmGun.userData.muzzle)]}}"""))
  shot('r15-vm-draw')
  # fire into ground/building ahead
  J("()=>{__P.pitch=-0.28;__S.gun.mag.kestrel=12;__S.gun.cur='kestrel'}")
  pg.wait_for_timeout(80)  # one frame
  J("()=>R5.guns.fire()")
  # poll until tracer advances
  for _ in range(20):
    live=J("R5.guns._dbg.tracers.filter(t=>t.live).map(t=>({s:+t.s.toFixed(2),len:+t.len.toFixed(1),vis:t.m.visible}))")
    if live and live[0]['s']>1: break
    pg.wait_for_timeout(16)
  print('TRACERS',live)
  shot('r15-tracer')
  pg.wait_for_timeout(700)
  fx=J("""()=>({sparks:R5.guns._dbg.sparks(),decals:R5.guns._dbg.decals.filter(d=>d.m.visible).length,last:R5.guns._dbg.lastFire})""")
  print('IMPACT',fx)
  shot('r15-impact')
  J("()=>{__S.gun.mag.kestrel=2;__S.gun.ammo=40;R5.guns.reload()}")
  pg.wait_for_timeout(450);shot('r15-reload')
  try:pg.wait_for_function("!R5.guns.reloading",timeout=4000)
  except Exception:pass
  J("()=>{__S.gun.cur='rattler';R5.guns.draw()}");pg.wait_for_timeout(450);shot('r15-vm-smg')
  # open plaza for firefight — docks boardwalk facing -Z into open water/street
  J("""()=>{
    __S.gun.cur='kestrel'; R5.guns.draw();
    Object.assign(__P,{x:20,z:255,y:0,yaw:Math.PI*.5,pitch:-0.05});
    __S.gang={id:'tide',rank:2}; R5.force('shakedown');
  }""")
  pg.wait_for_timeout(800)
  for i in range(14):
    info=J("""()=>({ev:!!R5.ev, en:!!(R5.ev&&R5.ev.enemies), type:R5.ev&&R5.ev.type, reg:__G.regionOf(__P.x,__P.z), dlg:!document.getElementById('dlg').classList.contains('hide'), gang:__S.gang})""")
    print('EV',i,info)
    if info.get('en'): break
    J("""()=>{
      document.getElementById('dlg').classList.add('hide');
      __S.gang={id:'tide',rank:2}; __P.y=0;
      R5.force('shakedown');
    }""")
    pg.wait_for_timeout(700)
  close()
  placed=J("""()=>{
    const e=R5.ev; if(!e||!e.enemies) return {ok:false, why:!e?'noev':'noen'};
    const P=__P; const f=[-Math.sin(P.yaw),-Math.cos(P.yaw)];
    let k=0, pos=[];
    for(const a of e.enemies){
      const x=P.x+f[0]*8+(k?1.5:-1.5)*f[1], z=P.z+f[1]*8-(k?1.5:-1.5)*f[0];
      a.x=x;a.z=z; a.h.obj.visible=true; a.h.obj.position.set(x,__G.groundY(x,z,0),z); pos.push([+x.toFixed(1),+z.toFixed(1)]); k++;
    }
    R5.forceFight(e,'saint');
    if(!R5.guns.fight) return {ok:false, why:'nofight'};
    for(const n of R5.guns.fight.ens){n.move=null;n.cd=99;n.mt=99;}
    __S.hp=1e9; return {ok:true,pos,n:e.enemies.length};
  }""")
  print('FIGHT',placed)
  pg.wait_for_timeout(300)
  if not placed or not placed.get('ok'):
    print('NO_FIGHT'); print('VISUAL_PARTIAL'); return
  J("""()=>{
    const f=R5.guns.fight; if(!f) return false; const n=f.ens.find(n=>n.hp>0); if(!n) return false;
    const T=__G.THREE; const c=n.a.h.bones.Spine.getWorldPosition(new T.Vector3());
    const p=__G.cam.position; const dx=c.x-p.x,dy=c.y-p.y,dz=c.z-p.z;
    __P.yaw=Math.atan2(-dx,-dz); __P.pitch=Math.atan2(dy,Math.hypot(dx,dz));
    __S.gun.cur='kestrel'; __S.gun.mag.kestrel=12; R5.guns.fire(); return true;
  }""")
  for _ in range(15):
    if J("R5.guns._dbg.tracers.some(t=>t.live&&t.s>2)"):break
    pg.wait_for_timeout(16)
  shot('r15-firefight')
  for i in range(16):
    r=J("""()=>{
      const f=R5.guns.fight; if(!f) return 'over';
      const n=f.ens.find(n=>n.hp>0); if(!n) return 'alldead';
      const T=__G.THREE; const c=n.a.h.bones&&n.a.h.bones.Head?n.a.h.bones.Head.getWorldPosition(new T.Vector3()):new T.Vector3(n.a.x,1.65,n.a.z);
      c.y+=.05; const p=__G.cam.position; const dx=c.x-p.x,dy=c.y-p.y,dz=c.z-p.z;
      __P.yaw=Math.atan2(-dx,-dz); __P.pitch=Math.atan2(dy,Math.hypot(dx,dz));
      __S.gun.mag.kestrel=12; R5.guns.fire(); return 'ok';
    }""")
    if r!='ok':break
    pg.wait_for_timeout(380)
  pg.wait_for_timeout(700)
  st=J("R5.guns.fight?R5.guns.fight.ens.map(n=>n.hp):'over'")
  print('HP',st)
  shot('r15-death')
  print('VISUAL_OK')
harness.run(f)
