import sys,json;import os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
JS=open('/workspace/neon-ladle/tools/test/story.js').read()
def begin(pg):
 pg.click('#ccDone');pg.wait_for_timeout(800)
 for i in range(8):
  if pg.evaluate("!document.querySelector('#dlg').classList.contains('hide')"):pg.evaluate("document.querySelector('#dopts button').click()");pg.wait_for_timeout(200)
 pg.evaluate(JS)
def drive(pg,pref='[]',until="__S.flags.finished",rounds=12):
 out=None
 for r in range(rounds):
  out=pg.evaluate(f"JSON.stringify(__T.run({pref}))");pg.wait_for_timeout(6500)
  if pg.evaluate(until):break
 return json.loads(out)
def story(pg,shot,lp):
 begin(pg)
 # make relationship-gated choices possible (the test is about wiring, not grinding)
 pg.evaluate("for(const k in __G.npcs)__S.rel[k]=7;__S.q.s2='done';__S.q.s3='done'")
 o=drive(pg,"[/Bring the street/,/Shut him down/]")
 print('\n'.join(o['log']));print('BAD',o['bad']);print('finished',pg.evaluate('__S.flags.finished'),'q',json.dumps(o['q']))
import os
M=os.environ.get("MODE","story")
if M=="story":run(story)
END={'open':("[/Bring the street/,/Shut him down/]"),'fair':"[/Bring the street/,/Restore Dess/]",'tide':"[/Bring the Ashline Tide/,/Give the weather/]",'law':"[/Bring Ilse/,/Hand the pillar/]",'chair':"[/Go quiet|Go alone/,/Take the Chairman/]"}
import os
for e,pref in END.items():
 if M!='ends':continue
 if os.environ.get('ONLY') and os.environ['ONLY']!=e:continue
 def f(pg,shot,lp,pref=pref,e=e):
  begin(pg);pg.evaluate("for(const k in __G.npcs)__S.rel[k]=7;__S.q.s2='done';__S.q.s3='done';__S.rep=Object.assign(__S.rep||{},{tide:5,wardline:5,civ:5,orrin:5})")
  o=drive(pg,pref);fl=pg.evaluate("JSON.stringify(Object.fromEntries(Object.entries(__S.flags).filter(([k])=>/end|crew|ledger|finish/i.test(k))))")
  print('ENDING',e,'bad',o['bad'],'flags',fl)
  if e=='fair':lp();pg.screenshot(path='/workspace/neon-ladle/shots/r7-ending-'+e+'.png')
 run(f)
def shots(pg,shot,lp):
 begin(pg)
 # put the player at the fuse box at night, m1 on the fuse step, then fire it -> Juno marker must show
 pg.evaluate("__S.q.m1=3;__S.track='m1';__S.min=22*60");pg.evaluate("__G.interact.find(i=>i.id==='fuse').fn()");pg.wait_for_timeout(300)
 pg.evaluate("document.querySelector('#dopts button')&&document.querySelector('#dopts button').click()");pg.wait_for_timeout(1500)
 print('after fuse',pg.evaluate("JSON.stringify({q:__S.q,track:__S.track,tg:__G.stepTarget(__G.stepOf('m4')),wp:getComputedStyle(document.getElementById('wp')).display,juno:__G.placeFor('juno')})"))
 shot('r7-juno-marker',22,pp={'x':24,'z':-44,'yaw':3.14159,'pitch':0})
 print('wp',pg.evaluate("[document.getElementById('wp').style.display,document.getElementById('wp').textContent]"))
 shot('r7-hud',19,pp={'x':0,'z':2,'yaw':0,'pitch':0})
 print('tl',pg.evaluate("[...document.querySelectorAll('#tl > *')].map(e=>getComputedStyle(e).display+':'+e.textContent).join(' | ')"))
 pg.evaluate("__G.setTP(true)");shot('r7-causeway-ramp',20,pp={'x':-46,'z':0,'yaw':1.5708,'pitch':-.05})
 shot('r7-causeway-deck',20,pp={'x':-72,'z':-2,'yaw':0,'pitch':-.05})
 pg.evaluate("__G.setTP(false)")
if M=='shots':run(shots)
def mig(pg,shot,lp):pass
