import sys,json;import os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
CASES={'m8done':{'q':{'m1':'done','m4':'done','m5':'done','m6':'done','m7':'done','m8':'done'},'flags':{'intro':1,'dessHome':1,'gateOpen':1},'track':'m8'},
 'm10done':{'q':{'m1':'done','m4':'done','m5':'done','m6':'done','m7':'done','m8':'done','m9':'done','m10':'done'},'flags':{'intro':1,'dessHome':1,'gateOpen':1},'track':None},
 'r6old':{'q':{'m1':2,'m2':'done','m3':1},'flags':{'intro':1},'track':'m3'},
 'corrupt':'{not json'}
def f(pg,shot,lp):
 for k,v in CASES.items():
  pg.evaluate(f"localStorage.setItem('neonLadle2',{json.dumps(v if isinstance(v,str) else json.dumps(v))})")
  p2=pg.context.new_page();p2.goto('http://localhost:8123/');p2.wait_for_selector('#start:not(.hide)',timeout=180000);p2.click('#start');p2.wait_for_timeout(4000)
  print(k,p2.evaluate("JSON.stringify({q:__S.q,track:__S.track})"));p2.evaluate("window.save=null");p2.close()
run(f)
