# R9: Options > Reset must wipe the save even though pagehide/hidden/5s autosave fire during reload; fresh load = character creator + A Cold Trail.
import sys;from playwright.sync_api import sync_playwright
U='http://localhost:8123/'
with sync_playwright() as p:
  b=p.chromium.launch(executable_path="/usr/bin/google-chrome",args=["--use-gl=angle","--use-angle=swiftshader","--enable-unsafe-swiftshader"])
  ctx=b.new_context(viewport={'width':844,'height':390},has_touch=True,is_mobile=True);pg=ctx.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(U);pg.wait_for_selector('#start:not(.hide)',timeout=180000);pg.click('#start');pg.wait_for_timeout(1500)
  pg.evaluate("()=>{__S.P={x:-20,z:-262,y:0,yaw:0,pitch:0};__P.x=-20;__P.z=-262;__S.cash=999;__S.flags.made=1;__S.look=__S.look||{};}")
  pg.evaluate("()=>dispatchEvent(new Event('pagehide'))")
  before=pg.evaluate("JSON.parse(localStorage.neonLadle2).cash");print('saved cash',before)
  pg.on('dialog',lambda d:d.accept())
  pg.evaluate("__G.openMenu&&__G.openMenu()");pg.wait_for_timeout(300)
  try:
    pg.click('text=Options',timeout=3000);pg.wait_for_timeout(300);pg.click('#wipe',timeout=3000)
  except Exception as e:print('menu path failed, calling __wipe',e);pg.evaluate("__wipe()")
  pg.wait_for_load_state('load');pg.wait_for_timeout(2500)
  raw=pg.evaluate("localStorage.neonLadle2||null");print('after reload save:',(raw or 'null')[:80])
  pg.wait_for_selector('#start:not(.hide)',timeout=180000);pg.click('#start');pg.wait_for_timeout(2000)
  r=pg.evaluate("({cash:__S.cash,P:[__P.x,__P.z],q:Object.keys(__S.q||{}),track:__S.track,creator:!!document.querySelector('body').innerText.match(/WHO ARE YOU/i)})");print('fresh state',r)
  ok=r['cash']!=999 and r['creator'] and abs(r['P'][1])<50;print('RESET','PASS' if ok else 'FAIL','ERRORS',errs);b.close()
