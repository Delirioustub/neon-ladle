# R14b: ride shots incl. a look at the seated passengers (bench clipping) and the Crown canopy.
import sys,os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
S='/workspace/neon-ladle/shots/'
def st(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(500);pg.add_style_tag(content='#dlg{display:none!important}');pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};__G.setTP(false)}")
 for h,w,tag in [(22,'rain','night'),(13,'clear','day')]:
  pg.evaluate(f"()=>{{__S.min={h}*60;__ENV.set('{w}',true)}}")
  pg.evaluate("__G.ride('docks','crown')");pg.wait_for_timeout(1500);pg.evaluate("__G.ts=6")
  for k,(p,yaw,pit) in enumerate([(.3,'-Math.PI/2',.06),(.5,'Math.PI',-.25),(.7,'0',-.25),(.85,'-Math.PI/2+0.5',.06)]):
   pg.wait_for_function(f"__G.RIDE.progress()>={p}",timeout=300000);pg.evaluate("__G.ts=0.001");lp()
   pg.evaluate(f"()=>{{__P.yaw={yaw};__P.pitch={pit}}}");pg.wait_for_timeout(1500);pg.screenshot(path=S+f'r14b-train-{tag}{k+1}.png');pg.evaluate("__G.ts=6")
  pg.evaluate("document.getElementById('rideSkip').click()");pg.wait_for_timeout(1500);pg.evaluate("__G.ts=1")
 pg.evaluate("()=>{__G.setTP&&__G.setTP(false);Object.assign(__P,{x:-53,y:0,z:-246,yaw:Math.PI,pitch:.35})}");pg.wait_for_timeout(1500);lp();pg.screenshot(path=S+'r14b-train-canopy.png')
run(st)
