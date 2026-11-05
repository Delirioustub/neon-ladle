# R15 cast lineup + street screenshots with frozen NPCs and open plaza.
import sys,os;sys.path.insert(0,os.path.dirname(__file__));import harness
harness.P=os.environ.get('NLSHOTS',harness.P)
def f(pg,shot,lp):
  J=pg.evaluate
  def close():
    for _ in range(8):
      if J("document.getElementById('dlg').classList.contains('hide')"):return
      J("()=>{const b=document.querySelectorAll('#dopts button');b.length&&b[b.length-1].click()}");pg.wait_for_timeout(120)
  pg.click('#ccDone');pg.wait_for_timeout(1200);close()
  # freeze NPC routing so lineup sticks
  J("""()=>{
    window.__R15_FREEZE=1;
    const keys=['mara','benny','sela','kip','ilse','juno','dess'];
    // open plaza near origin, away from stalls: x along -20..0, z around -8
    keys.forEach((k,i)=>{
      const n=__G.npcs[k]; if(!n) return;
      n.obj.visible=true; n.arrived=true; n.route=[]; n.state='idle';
      n.obj.position.set(-18+i*3.0, 0, -8);
      n.obj.rotation.y = Math.PI; // face +Z toward camera at more +Z? default +Z; PI faces -Z
      // actually face camera: camera will be south (+Z) looking north (-Z), so NPCs face +Z = rot 0
      n.obj.rotation.y = 0;
      if(n.lookAt) try{n.lookAt.x=n.obj.position.x;n.lookAt.z=n.obj.position.z+2;}catch(e){}
    });
    // hide crowds for clean cast shot
    for(const [k,n] of Object.entries(__G.npcs)){
      if(!keys.includes(k)) n.obj.visible=false;
    }
    if(__G.player) __G.player.obj.visible=false;
    __G.setTP(false);
    // camera south of lineup looking -Z (yaw=0)
    Object.assign(__P,{x:-9, z:2, y:0, yaw:0, pitch:-0.12});
    __ENV.set('rain',false);
  }""")
  # patch tick to honor freeze if possible
  J("""()=>{
    if(!window.__tickNPC_patched){
      window.__tickNPC_patched=1;
      const o=__G.tickNPCs||window.tickNPCs;
      // soft: re-pin each frame while freeze
      const pin=()=>{
        if(!window.__R15_FREEZE) return;
        const keys=['mara','benny','sela','kip','ilse','juno','dess'];
        keys.forEach((k,i)=>{const n=__G.npcs[k]; if(!n)return;
          n.arrived=true;n.route=[];n.obj.position.set(-18+i*3.0,0,-8);n.obj.rotation.y=0;n.obj.visible=true;});
        Object.assign(__P,{x:-9,z:2,y:0,yaw:0,pitch:-0.12});
      };
      setInterval(pin,50);
    }
  }""")
  pg.wait_for_timeout(400);lp();lp();shot('r15-cast')
  info=J("""()=>{
    const keys=['mara','benny','sela','kip','ilse','juno','dess'];
    return keys.map(k=>{const n=__G.npcs[k];return {k,x:+n.obj.position.x.toFixed(1),z:+n.obj.position.z.toFixed(1),vis:n.obj.visible,body:n.obj.userData.body};});
  }""")
  print('PIN',info)
  # street with crowds restored
  J("""()=>{
    window.__R15_FREEZE=0;
    for(const n of Object.values(__G.npcs)) n.obj.visible=true;
    Object.assign(__P,{x:-4, z:6, y:0, yaw:0.35, pitch:-0.05});
    __ENV.set('rain',true);
  }""")
  pg.wait_for_timeout(600);lp();lp();shot('r15-street')
  print('SHOTS_OK')
harness.run(f)
