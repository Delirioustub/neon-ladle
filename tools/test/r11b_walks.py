# R11b: the tiers are physically joined. Walk and ride the Sea Walks end to end through the real loop + Input (no teleports):
# Velvet Canal -> Canal Head -> stair -> Sea Walk -> stair -> Halcyon overlook (Crown), and Canal Foot -> Sea Walk -> Net Market (Docks).
import sys,os,json,math;sys.path.insert(0,os.path.dirname(__file__));from harness import run
N=[(58,-53),(58,-64),(55,-84),(63,-112),(54,-142),(61,-170),(76,-185),(90,-189),(94,-197),(94,-207)]
S=[(58,53),(58,64),(62,88),(52,118),(62,148),(56,174),(66,188),(70.5,200),(70,212),(65,219.5),(55,220)]
ROUTES={'north':[(51,-40),(51,-46)]+N,'south':[(64.7,40),(64.7,46)]+S,'north-back':N[::-1]+[(51,-46),(51,-40)]}
R=[]
def steps(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(800)
 if os.environ.get('MODE')!='shots':pg.set_viewport_size({'width':240,'height':120})
 pg.evaluate("import('./input.js').then(m=>window.__IN=m.Input)");pg.wait_for_timeout(300)
 pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};}")
 closer="()=>{const d=document.querySelector('#dlg');if(d&&!d.classList.contains('hide')){const b=[...document.querySelectorAll('#dopts button')];if(b.length)b[b.length-1].click();}__G.R5.clear();}"
 for mode in ['walk','bike']:
  for name,wp in ROUTES.items():
   x,z=wp[0];pg.evaluate(closer)
   pg.evaluate(f"()=>{{const G=__G;G.dismountBike(true);G.ts={3 if mode=='walk' else 1.5};Object.assign(__P,{{x:{x},z:{z},y:0}});__S.bike={{x:{x},z:{z},y:0,h:0}};if('{mode}'=='bike')G.mountBike();}}")
   k=1;miny=9;stall=0;best=1e9;ok=False;trace=[]
   for i in range(900):
    pg.wait_for_timeout(150);pg.evaluate(closer)
    tx,tz=wp[k]
    st=pg.evaluate(f"()=>{{const dx={tx}-__P.x,dz={tz}-__P.z,yw=Math.atan2(-dx,-dz);if(__G.bk.on){{__S.bike.h=yw;__G.bk.look=0;}}else __P.yaw=yw;__IN.move.x=0;__IN.move.y=-1;return [__P.x,__P.z,__P.y,Math.hypot(dx,dz)]}}")
    miny=min(miny,st[2])
    if i%20==0:trace.append([round(v,2) for v in st])
    if st[3]<(1.2 if mode=='bike' else .6):
     k+=1
     if k>=len(wp):ok=True;break
     best=1e9;stall=0;continue
    if st[3]<best-.05:best=st[3];stall=0
    else:stall+=1
    if stall>60:break
   pg.evaluate("()=>{__IN.move.y=0;__G.ts=1}")
   end=pg.evaluate("[__P.x,__P.z,__P.y]")
   ok=ok and abs(end[2])<.05 and miny<-.5
   R.append((mode,name,ok,k,[round(v,2) for v in end],round(miny,2)));print(R[-1],flush=True)
   if not ok:print(trace);shot(f'r11b-stuck-{mode}-{name}')
 pg.evaluate("()=>{__G.dismountBike(true)}")
run(steps)
print('FAILS',sum(1 for r in R if not r[2]))
