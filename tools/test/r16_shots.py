import sys;sys.path.insert(0,'.');from harness import run
import math,json
V=[('r16-air-river',dict(x=70,z=-70,y=30,yaw=math.pi+0.5,pitch=-0.55)),('r16-air-falls',dict(x=80,z=-100,y=25,yaw=-0.7,pitch=-0.45)),('r16-air-city',dict(x=0,z=-150,y=40,yaw=math.pi,pitch=-0.35)),('r16-crown-vista',dict(x=96,z=-206,y=0,yaw=math.pi*0.92,pitch=-0.12)),
   ('r16-source',dict(x=100,z=-214,y=0,yaw=-math.pi/2-0.3,pitch=-0.25)),
   ('r16-road-up',dict(x=60,z=-120,y=-0.6,yaw=0.1,pitch=0.05)),
   ('r16-road-down',dict(x=60,z=-150,y=-0.6,yaw=math.pi,pitch=-0.08)),
   ('r16-saltgate',dict(x=-30,z=0,y=0,yaw=-math.pi/2,pitch=0)),
   ('r16-canalhead',dict(x=66,z=-50,y=0,yaw=-math.pi/2,pitch=-0.1)),
   ('r16-docks-road',dict(x=62,z=150,y=-0.6,yaw=math.pi,pitch=-0.05)),
   ('r16-docks',dict(x=60,z=221,y=0,yaw=-math.pi/2-0.6,pitch=-0.05))]
only=sys.argv[1:] 
def steps(pg,shot,lp):
  pg.click('#ccDone');pg.wait_for_timeout(1200)
  for _ in range(8):
    if pg.evaluate("document.getElementById('dlg').classList.contains('hide')"):break
    pg.evaluate("()=>{const b=document.querySelectorAll('#dopts button');b.length&&b[b.length-1].click()}");pg.wait_for_timeout(120)
  pg.evaluate("()=>{__S.min=22*60}")
  for n,p in V:
    if only and n not in only:continue
    shot(n,float(__import__('os').environ.get('HR','22')),'clear',p)
  print(pg.evaluate("()=>JSON.stringify(__G.LAND.falls.map(f=>[Math.round(f.p.x),Math.round(f.p.z),+(f.top-f.bot).toFixed(1)]))"))
run(steps)
