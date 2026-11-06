# R16: first-person walking shots, driven through the real loop + Input (no teleports): up Harbor Rise from Canal Head to Crown, then back down.
import sys,os,json,math;sys.path.insert(0,os.path.dirname(__file__));from harness import run
N=[(58,-53),(58,-64),(55,-84),(63,-112),(54,-142),(61,-170),(76,-185),(90,-189),(94,-197),(94,-207)]
HR=float(os.environ.get('HR','20.5'))
def steps(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(800)
 pg.evaluate("import('./input.js').then(m=>window.__IN=m.Input)");pg.wait_for_timeout(300)
 pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};}")
 closer="()=>{const d=document.querySelector('#dlg');if(d&&!d.classList.contains('hide')){const b=[...document.querySelectorAll('#dopts button')];if(b.length)b[b.length-1].click();}__G.R5.clear();}"
 for name,wp,snap in [('up',N,{3:'r16-walk-up-1',5:'r16-walk-up-2',7:'r16-walk-up-3'}),('down',N[::-1],{3:'r16-walk-down-1',5:'r16-walk-down-2',7:'r16-walk-down-3'})]:
  x,z=wp[0];pg.evaluate(f"()=>{{__G.ts=2;Object.assign(__P,{{x:{x},z:{z},y:0}});__S.min={HR}*60;__ENV.set('clear',true);}}")
  k=1
  for i in range(700):
   pg.wait_for_timeout(150);pg.evaluate(closer)
   tx,tz=wp[k]
   st=pg.evaluate(f"()=>{{const dx={tx}-__P.x,dz={tz}-__P.z,yw=Math.atan2(-dx,-dz);__P.yaw+=(((yw-__P.yaw+Math.PI*3)%(Math.PI*2))-Math.PI)*.5;__P.pitch={'-0.05' if name=='up' else '-0.16'};__IN.move.x=0;__IN.move.y=-1;return Math.hypot(dx,dz)}}")
   if st<.7:
    k+=1
    if k in snap:
     pg.evaluate("()=>{__IN.move.y=0;__G.ts=1}");pg.wait_for_timeout(400)
     pg.evaluate(f"()=>{{const dx={wp[k][0]}-__P.x,dz={wp[k][1]}-__P.z;__P.yaw=Math.atan2(-dx,-dz)}}");lp();pg.screenshot(path=__import__('harness').P+snap[k]+'.png');pg.evaluate("()=>{__G.ts=2}")
    if k>=len(wp):break
  pg.evaluate("()=>{__IN.move.y=0;__G.ts=1}")
  print(name,'reached',k,pg.evaluate("[__P.x,__P.z,__P.y]"))
run(steps)
