# Close-up cast + crowd: open plaza, all other humans hidden, bright fill, ~2.5m.
import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));import harness
harness.P=os.environ.get('NLSHOTS',harness.P)
CAST=['mara','benny','sela','kip','ilse','juno','dess']
CROWD=[
  {'sex':'m','cls':'mid','body':'casual','top':0x2a3a48,'pants':0x1a1a22,'hair':{'style':'short','color':0x101010}},
  {'sex':'f','cls':'mid','body':'witch','top':0x3a2a2a,'pants':0x1a1a22,'hair':{'style':'long','color':0x101010}},
  {'sex':'m','cls':'rich','body':'astronaut','top':0xd8d4cc,'pants':0x2a2a3a,'hair':{'style':'short','color':0x303040}},
  {'sex':'f','cls':'rich','body':'scifi_f','top':0xe8e4e0,'pants':0x2a2a3a,'hair':{'style':'bun','color':0x2a1a10}},
  {'sex':'m','cls':'poor','body':'beach','top':0x3a3a28,'pants':0x2a2a20,'hair':{'style':'short','color':0x1a1410}},
  {'sex':'f','cls':'poor','body':'worker_f','top':0x4a3a30,'pants':0x2a2a28,'hair':{'style':'bun','color':0x0e0a0a}},
  {'sex':'m','cls':'mid','body':'swat','top':0x1e2a44,'pants':0x141c30,'hair':{'style':'buzz','color':0xc8b890}},
  {'sex':'f','cls':'mid','body':'hooded_f','top':0x2a2a30,'pants':0x1a1a22,'hat':'hood','hair':{'style':'bob','color':0x101010}},
]
def f(pg,shot,lp):
  J=pg.evaluate
  def close():
    for _ in range(10):
      if J("document.getElementById('dlg').classList.contains('hide')"):return
      J("()=>{const b=document.querySelectorAll('#dopts button');b.length&&b[b.length-1].click()}");pg.wait_for_timeout(90)
  pg.click('#ccDone');pg.wait_for_timeout(1600);close()
  J("""()=>{
    window.__R15_FREEZE=1;
    __ENV.set('rain',false);
    const THREE=__G.THREE, sc=__G.scene;
    // hide every human
    sc.traverse(o=>{ if(o.userData&&o.userData.human) o.visible=false; });
    if(__G.player) __G.player.obj.visible=false;
    __G.setTP(false);
    sc.traverse(o=>{
      if(o.isHemisphereLight){o.intensity=1.35; o.color.setHex(0xd0daf0); o.groundColor.setHex(0x5a4060);}
      if(o.isDirectionalLight){o.intensity=2.0; o.position.set(3,20,8);}
    });
    if(!window.__r15fill){
      const L=new THREE.PointLight(0xfff0dd, 4.0, 25, 1.1); L.position.set(0,2.6,2); sc.add(L); window.__r15fill=L;
      const L2=new THREE.DirectionalLight(0xffffff, 1.6); L2.position.set(-4,14,6); sc.add(L2); window.__r15fill2=L2;
    }
    // open plaza south of saltgate: z=40
    window.__R15_Z=40;
  }""")
  boxes=J("""(keys)=>{
    const THREE=__G.THREE, z=window.__R15_Z;
    const out=[];
    keys.forEach((k,i)=>{
      const n=__G.npcs[k]; if(!n){out.push({k,miss:1});return;}
      n.obj.visible=true; n.arrived=true; n.route=[]; n.state='idle';
      n.obj.position.set(-9+i*3.0,0,z); n.obj.rotation.y=Math.PI; // face +Z toward cam south of them? cam at z+3 looking -Z means face cam with rot 0 if looking -Z...
      // cam at z+3 looking yaw=0 (-Z), NPCs at z should face +Z = rotation.y = 0? Default model faces +Z. To face camera (toward +Z from NPC? Camera is at higher z looking -Z, so camera looks at NPC from +Z side. NPC should face +Z toward camera: rotation.y=0.
      n.obj.rotation.y=0;
      const b=new THREE.Box3().setFromObject(n.obj);
      out.push({k,body:n.obj.userData.body,h:+(b.max.y-b.min.y).toFixed(2),minY:+b.min.y.toFixed(2)});
    });
    return out;
  }""", CAST)
  print('CAST',json.dumps(boxes,indent=1))
  J("""()=>{
    const keys=['mara','benny','sela','kip','ilse','juno','dess']; const z=window.__R15_Z;
    const pin=()=>{
      // hide all humans then show cast
      __G.scene.traverse(o=>{ if(o.userData&&o.userData.human) o.visible=false; });
      keys.forEach((k,i)=>{const n=__G.npcs[k]; if(!n)return; n.arrived=true;n.route=[]; n.obj.position.set(-9+i*3.0,0,z); n.obj.rotation.y=0; n.obj.visible=true;});
      Object.assign(__P,{x:-0.5,z:z+2.6,y:0,yaw:0,pitch:-0.05});
      if(window.__r15fill) window.__r15fill.position.set(-0.5,2.5,z+1.8);
    };
    clearInterval(window.__r15pin); window.__r15pin=setInterval(pin,30); pin();
  }""")
  pg.wait_for_timeout(400);lp();lp();shot('r15-cast-lineup')
  for k in CAST:
    J("""(k)=>{
      const z=window.__R15_Z;
      __G.scene.traverse(o=>{ if(o.userData&&o.userData.human) o.visible=false; });
      const n=__G.npcs[k];
      clearInterval(window.__r15pin);
      const pin=()=>{ n.arrived=true;n.route=[]; n.obj.position.set(0,0,z); n.obj.rotation.y=0.2; n.obj.visible=true;
        Object.assign(__P,{x:0.2,z:z+2.5,y:0,yaw:0,pitch:-0.03});
        if(window.__r15fill) window.__r15fill.position.set(0.5,2.4,z+1.6);};
      window.__r15pin=setInterval(pin,30); pin();
    }""", k)
    pg.wait_for_timeout(300);lp();lp();shot(f'r15-cast-{k}')
  crowd=J("""(looks)=>{
    const THREE=__G.THREE, mk=__G.makeHuman, z=window.__R15_Z, sc=__G.scene;
    (window.__r15crowd||[]).forEach(o=>sc.remove(o.obj||o));
    window.__r15crowd=[];
    __G.scene.traverse(o=>{ if(o.userData&&o.userData.human) o.visible=false; });
    const info=[];
    looks.forEach((look,i)=>{
      const h=mk(look); const H=h.obj; H.position.set(-10.5+i*3.0,0,z); H.rotation.y=0.1; sc.add(H);
      window.__r15crowd.push(H); h.play&&h.play('idle');
      const b=new THREE.Box3().setFromObject(H);
      info.push({i,body:H.userData.body,h:+(b.max.y-b.min.y).toFixed(2)});
    });
    clearInterval(window.__r15pin);
    const pin=()=>{
      __G.scene.traverse(o=>{ if(o.userData&&o.userData.human && !(window.__r15crowd||[]).includes(o)) o.visible=false; });
      (window.__r15crowd||[]).forEach((H,i)=>{H.visible=true; H.position.set(-10.5+i*3.0,0,z); H.rotation.y=0.1;});
      Object.assign(__P,{x:-0.5,z:z+2.6,y:0,yaw:0,pitch:-0.05});
      if(window.__r15fill) window.__r15fill.position.set(-0.5,2.5,z+1.8);
    };
    window.__r15pin=setInterval(pin,30); pin();
    return info;
  }""", CROWD)
  print('CROWD',json.dumps(crowd,indent=1))
  pg.wait_for_timeout(400);lp();lp();shot('r15-crowd-lineup')
  for i in range(len(CROWD)):
    J("""(i)=>{
      const z=window.__R15_Z;
      __G.scene.traverse(o=>{ if(o.userData&&o.userData.human) o.visible=false; });
      const H=window.__r15crowd[i];
      clearInterval(window.__r15pin);
      const pin=()=>{ H.position.set(0,0,z); H.rotation.y=0.2; H.visible=true;
        Object.assign(__P,{x:0.2,z:z+2.5,y:0,yaw:0,pitch:-0.03});
        if(window.__r15fill) window.__r15fill.position.set(0.5,2.4,z+1.6);};
      window.__r15pin=setInterval(pin,30); pin();
    }""", i)
    pg.wait_for_timeout(280);lp();lp();shot(f'r15-crowd-{i}')
  print('DONE')
harness.run(f)
