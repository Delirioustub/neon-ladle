import sys;sys.path.insert(0,'.');from harness import run
import math,json
V=[('r16-vista',dict(x=101,z=-198,y=0,yaw=math.pi+0.12,pitch=-0.16)),('r16-overlook-valley',dict(x=99,z=-209,y=0,yaw=math.pi*0.97,pitch=-0.2)),('r16-falls-road',dict(x=93,z=-190,y=-0.45,yaw=-math.pi/2+0.25,pitch=-0.08)),('r16-falls-road2',dict(x=95,z=-200,y=-0.1,yaw=-math.pi/2-0.5,pitch=-0.12)),('r16-mouth',dict(x=70,z=222,y=0,yaw=-math.pi/2-0.35,pitch=-0.1)),('r16-falls-close',dict(x=96,z=-150,y=4,yaw=-math.pi/2-0.15,pitch=-0.3)),('r16-air-sea',dict(x=40,z=60,y=30,yaw=math.pi-0.3,pitch=-0.3)),('r16-bridge',dict(x=72,z=-50.5,y=0,yaw=-math.pi/2-0.15,pitch=-0.12)),('r16-overlook',dict(x=101,z=52,y=0,yaw=0.2,pitch=-0.15)),('r16-air-river',dict(x=70,z=-70,y=30,yaw=math.pi+0.5,pitch=-0.55)),('r16-air-falls',dict(x=80,z=-100,y=25,yaw=-0.7,pitch=-0.45)),('r16-air-city',dict(x=0,z=-150,y=40,yaw=math.pi,pitch=-0.35)),('r16-crown-vista',dict(x=96,z=-206,y=0,yaw=math.pi*0.92,pitch=-0.12)),
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
  st=pg.evaluate('''()=>{let best=null;for(const r of __G.W.walk){const q=r[5];if(!q||!q.seg)continue;const [ax,az,ay,bx,bz,by]=q.seg;const l=Math.hypot(bx-ax,bz-az);const g=(__G.TH(bx,bz)+by-__G.TH(ax,az)-ay)/l;if(az>-60)continue;if(!best||Math.abs(g)>Math.abs(best.g))best={g,ax,az,ay,bx,bz,hw:q.hw};}
   const b=best,dx=b.bx-b.ax,dz=b.bz-b.az,l=Math.hypot(dx,dz),nx=-dz/l,nz=dx/l,o=b.hw-.6;const up=b.g>0;const yaw=Math.atan2(-(up?dx:-dx),-(up?dz:-dz));return {x:b.ax+nx*o-(up?dx:-dx)/l*6,z:b.az+nz*o-(up?dz:-dz)/l*6,y:b.ay,yaw,pitch:-0.2,g:b.g};}''')
  print('stairs at',st)
  V.append(('r16-stairs-up',dict(x=st['x'],z=st['z'],y=st['y'],yaw=st['yaw'],pitch=-0.12)))
  V.append(('r16-stairs-down',dict(x=st['x'],z=st['z'],y=st['y'],yaw=st['yaw']+math.pi,pitch=-0.3)))
  for n,p in V:
    if only and n not in only:continue
    shot(n,float(__import__('os').environ.get('HR','22')),'clear',p)
  print(pg.evaluate("()=>JSON.stringify(__G.LAND.falls.map(f=>[Math.round(f.p.x),Math.round(f.p.z),+(f.top-f.bot).toFixed(1)]))"))
run(steps)
