import sys,json
from playwright.sync_api import sync_playwright
import os;U=os.environ.get('NLU','http://localhost:8123/');P='/workspace/neon-ladle/shots/'
def run(steps,fresh=True):
 with sync_playwright() as p:
  b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
  pg=b.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True).new_page();errs=[]
  pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto(U);pg.wait_for_selector('#start:not(.hide)',timeout=180000);pg.click('#start');pg.wait_for_timeout(1200)
  def lp():pg.wait_for_timeout(900);pg.evaluate('for(let i=0;i<8;i++)__G.LP.update(.5,__G.cam)');pg.wait_for_timeout(1200)
  def shot(name,h=None,w=None,pp=None,js=None):
    if h is not None:pg.evaluate(f"()=>{{__S.min={h}*60;__ENV.set('{w or 'rain'}',true);__ENV.st.wet=1}}")
    if pp:pg.evaluate(f"()=>{{Object.assign(__P,{json.dumps(pp)})}}")
    if js:pg.evaluate(js)
    lp();pg.screenshot(path=P+name+'.png')
  steps(pg,shot,lp)
  print('ERRORS',errs);b.close()
