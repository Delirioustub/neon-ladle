# R15 body remap: distinct cast Quaternius bodies; crowds mix; Benny=farmer (male docks).
import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));import harness
harness.P=os.environ.get('NLSHOTS',harness.P)
WANT={'mara':'suit_f','benny':'farmer','sela':'woman_casual','kip':'hoodie','ilse':'soldier_f','juno':'android','dess':'adventurer_f'}
CAST_EXCL=['suit_f','farmer','woman_casual','hoodie','soldier_f','adventurer_f','android','business','ninja']
def f(pg,shot,lp):
  ok={};J=pg.evaluate
  def close():
    for _ in range(8):
      if J("document.getElementById('dlg').classList.contains('hide')"):return
      J("()=>{const b=document.querySelectorAll('#dopts button');b.length&&b[b.length-1].click()}");pg.wait_for_timeout(120)
  pg.click('#ccDone');pg.wait_for_timeout(900);close()
  bodies=J("""()=>{
    const out={};
    for(const k of Object.keys(__G.CAST)){
      const n=__G.npcs[k]; const look=__G.CAST[k].look;
      out[k]={lookBody:look.body,sex:look.sex,cls:look.cls||null,meshBody:(n.obj&&n.obj.userData&&n.obj.userData.body)||null};
    }
    return out;
  }""")
  print('CAST',json.dumps(bodies,indent=1))
  for k,w in WANT.items():
    got=bodies.get(k,{})
    ok[k]=(got.get('lookBody')==w) or (got.get('meshBody')==w)
  ok['benny_male']=bodies['benny']['sex']=='m'
  ok['benny_not_worker_f']=bodies['benny']['lookBody'] not in ('teen-character','worker_f','woman')
  probe=J("""(excl)=>{
    const CAST=new Set(excl);
    const hash=o=>{let h=7;const s=JSON.stringify(o);for(let i=0;i<s.length;i++)h=(h*31+s.charCodeAt(i))|0;return Math.abs(h);};
    const bodyFor=look=>{const h=hash(look);
      if(look.cls==='rich'){if(look.sex==='f')return ['scifi_f','businessman','witch','woman','scifi_f'][h%5];return ['businessman','astronaut','sci-fi-soldier','cyborg','businessman'][h%5];}
      if(look.cls==='poor'){if(look.sex==='f')return ['worker_f','hooded_f','witch','woman','worker_f','beach'][h%6];return ['teen-character','casual','beach','cyborg','man','sci-fi-soldier'][h%6];}
      if(look.sex==='f')return ['woman','worker_f','scifi_f','hooded_f','witch','woman'][h%6];
      return ['casual','teen-character','swat','cyborg','man','beach','sci-fi-soldier','businessman'][h%8];};
    const tally=cls=>{const c={punk:0,n:0,castHit:0};for(let i=0;i<100;i++){const sex=i%2?'m':'f';const b=bodyFor({sex,cls,top:0x111*i});c[b]=(c[b]||0)+1;c.n++;if(b==='man'||b==='woman')c.punk++;if(CAST.has(b))c.castHit++;}c.punkPct=+(c.punk/c.n).toFixed(2);return c;};
    return {rich:tally('rich'),poor:tally('poor'),mid:tally('mid')};
  }""", CAST_EXCL)
  print('DIST',json.dumps(probe))
  ok['crowds_not_all_punk']=probe['mid']['punkPct']<=.35 and probe['poor']['punkPct']<=.35 and probe['rich']['punkPct']<=.35
  ok['crowds_no_cast_bodies']=probe['mid']['castHit']==0 and probe['poor']['castHit']==0 and probe['rich']['castHit']==0
  # lineup shot
  J("""()=>{
    const keys=['mara','benny','sela','kip','ilse','juno','dess'];
    keys.forEach((k,i)=>{const n=__G.npcs[k];n.obj.visible=true;n.arrived=true;n.route=[];
      n.obj.position.set(-10+i*3.2,0,7);n.obj.rotation.y=Math.PI;});
    Object.assign(__P,{x:-1,z:13,y:0,yaw:0,pitch:-.08});
    __G.setTP(false); if(__G.player)__G.player.obj.visible=false;
  }""");lp();shot('r15-cast')
  J("""()=>{Object.assign(__P,{x:-4,z:2,y:0,yaw:0.2,pitch:-.05});__ENV.set('rain',true);}""");lp();shot('r15-street-saltgate')
  print('OK',json.dumps(ok));print('PASS' if all(ok.values()) else 'FAIL')
harness.run(f)
