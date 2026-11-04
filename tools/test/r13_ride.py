# R13: ride the Ring Line on the elevated car; windows show the real city; Skip = fast travel.
import sys,os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
S='/workspace/neon-ladle/shots/'
def st(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(500);pg.add_style_tag(content='#dlg{display:none!important}');pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};__G.setTP(false)}")
 print('stations',pg.evaluate("JSON.stringify(Object.fromEntries(Object.entries(__G.CITY.stations).map(([k,s])=>[k,[s.x,s.z]])))"))
 for h,w,tag in [(22,'rain','night'),(13,'clear','day')]:
  pg.evaluate(f"()=>{{__S.min={h}*60;__ENV.set('{w}',true)}}")
  pg.evaluate("__G.ride('docks','crown')");pg.wait_for_timeout(1500)
  print('live',pg.evaluate("JSON.stringify(__G.riding)"),pg.evaluate("[__P.x,__P.y,__P.z].map(v=>+v.toFixed(1))"))
  pg.evaluate("__G.ts=6")
  for k,p in enumerate([.3,.6]):
   pg.wait_for_function(f"__G.RIDE.progress()>={p}",timeout=300000);pg.evaluate("__G.ts=0.001");lp()
   pg.evaluate("()=>{__P.yaw=-Math.PI/2+%s;__P.pitch=.06}"%(['0','0.5'][k]));pg.wait_for_timeout(1500);pg.screenshot(path=S+f'r13-ride-{tag}{k+1}.png')
   print(tag,k,pg.evaluate("[__P.x,__P.y,__P.z].map(v=>+v.toFixed(1))"));pg.evaluate("__G.ts=6")
  if tag=='night':
   pg.wait_for_function("!__G.riding",timeout=300000);pg.wait_for_timeout(1200);s=pg.evaluate("[__P.x,__P.y,__P.z].map(v=>+v.toFixed(1))");print('arrived',s,pg.evaluate("__G.CITY.stations.docks.spawn"))
  else:
   pg.evaluate("document.getElementById('rideSkip').click()");pg.wait_for_timeout(1500);print('skipped',pg.evaluate("[__P.x,__P.y,__P.z,!!__G.riding]"),pg.evaluate("__G.CITY.stations.docks.spawn"))
  pg.evaluate("__G.ts=1")
 pg.evaluate("__G.ride('mid','docks')");pg.wait_for_timeout(1200);pg.evaluate("__G.ts=.001");lp();pg.screenshot(path=S+'r13-ride-skipbutton.png');pg.evaluate("__G.ts=1;document.getElementById('rideSkip').click()");pg.wait_for_timeout(1200);print('skip2',pg.evaluate("[__P.x,__P.z,!!__G.riding]"))
run(st)
