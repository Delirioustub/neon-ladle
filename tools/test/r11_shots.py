import sys;sys.path.insert(0,'/workspace/neon-ladle/tools/test');from harness import run
SP=[('plaza',62,0,-262,-1.57,-.05,21),('plaza-day',62,0,-262,-1.57,-.05,13),('overlook',94,0,-204,3.14,-.2,21),('overlook-day',94,0,-204,3.14,-.25,12),('overlook-east',103,0,-250,-1.57,-.5,22),('promenade',94,0,-227,0,-.05,21),('docks-alley',42,0,252,0,-.05,22),('netmarket',30,0,222,-1.9,-.05,22),('quay',62,0,212,-1.57,-.15,22),('salt-edge',46,0,0,-1.57,-.2,22),('lift-salt',42,0,-3,3.14,0,21)]
def st(pg,shot,lp):
  pg.click('text=Done');pg.wait_for_timeout(500);pg.evaluate('__G.setTP(false)')
  pg.add_style_tag(content='#dlg{display:none!important}')
  for n,x,y,z,yaw,pit,h in SP:shot('r11-'+n,h=h,pp={'x':x,'y':y,'z':z,'yaw':yaw,'pitch':pit})
  print('WALK',pg.evaluate("[[62,-262],[100,-250],[94,-220],[100,-208],[42,240],[45,215],[62,212],[42,-4.5]].map(([x,z])=>[x,z,__G.walkable(x,z)])"))
  print('LIFT',pg.evaluate("['halcyonlift','halcyonup','hcb-266.5','netquay'].map(i=>!!__G.interact.find(q=>q.id===i)||!!(__G.CITY.inter||[]).find(q=>q.id===i))"))
  print('RUNS',pg.evaluate("Object.fromEntries(Object.entries(window.__pedRuns||{}).map(([k,v])=>[k,v.length]))"))
run(st)
