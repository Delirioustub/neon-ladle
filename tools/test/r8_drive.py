# R8: drive the hover bike AND walk every causeway ramp end-to-end into each district through the real game loop + Input,
# including off-centre lanes; then check no scenery stands in drivable space (tools/test/scenery.js). MODE=shots writes r8 screenshots.
import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));from harness import run
R=[];SC=[]
# (name, start x, lane z, target x): start on the causeway spine, head east (+x) down the ramp into the district
ROUTES=[(n,-73,zc+dz,-40) for n,zc in [('saltgate',0),('crown',-260),('docks',260)] for dz in (-2.2,0,2.2)]
def steps(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(800)
 pg.evaluate("import('./input.js').then(m=>window.__IN=m.Input)");pg.wait_for_timeout(300)
 pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};}")
 closer="()=>{const d=document.querySelector('#dlg');if(d&&!d.classList.contains('hide')){const b=[...document.querySelectorAll('#dopts button')];if(b.length)b[b.length-1].click();}__G.R5.clear();}"
 for mode in ['bike','walk']:
  for name,x,z,tx in ROUTES:
   pg.evaluate(closer)
   pg.evaluate(f"""()=>{{const G=__G;G.dismountBike(true);Object.assign(__P,{{x:{x},z:{z},y:0,yaw:-Math.PI/2}});__S.bike={{x:{x},z:{z},y:0,h:-Math.PI/2}};if('{mode}'=='bike')G.mountBike();__IN.move.x=0;__IN.move.y=-1;}}""")
   best=x;stall=0
   for i in range(400):
    pg.wait_for_timeout(250);pg.evaluate(closer);pg.evaluate("__IN.move.y=-1")
    # keep the heading pinned east so the test measures walls, not steering drift
    pg.evaluate(f"()=>{{if(__G.bk.on)__S.bike.h=-Math.PI/2;else __P.yaw=-Math.PI/2;__P.z+=({z}-__P.z)*.2}}")
    px=pg.evaluate("[__P.x,__P.z]")
    if px[0]>=tx:break
    if px[0]>best+.05:best=px[0];stall=0
    else:stall+=1
    if stall>40:break
   pg.evaluate("__IN.move.y=0");ok=px[0]>=tx;R.append((mode,name,z,ok,[round(v,2) for v in px]))
   if not ok:shot(f'r8-stuck-{mode}-{name}-{z}')
 pg.evaluate("()=>{__G.dismountBike(true)}")
 pg.evaluate(open(os.path.join(os.path.dirname(__file__),'scenery.js')).read())
 SC.extend(pg.evaluate("__SCENERY()"))
run(steps)
for r in R:print(r)
print('SCENERY',len(SC),json.dumps(SC[:30]))
print('FAILS',sum(1 for r in R if not r[3])+len(SC))
