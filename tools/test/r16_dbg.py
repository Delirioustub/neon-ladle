import sys;sys.path.insert(0,'.');from harness import run
import math,json
js=sys.argv[1];name=sys.argv[2];pp=json.loads(sys.argv[3])
def steps(pg,shot,lp):
  pg.click('#ccDone');pg.wait_for_timeout(1200)
  for _ in range(8):
    if pg.evaluate("document.getElementById('dlg').classList.contains('hide')"):break
    pg.evaluate("()=>{const b=document.querySelectorAll('#dopts button');b.length&&b[b.length-1].click()}");pg.wait_for_timeout(120)
  shot(name,22,'clear',pp,js)
  print(pg.evaluate("()=>window.__dbg||''"))
run(steps)
