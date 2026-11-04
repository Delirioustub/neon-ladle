import sys,os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
def st(pg,shot,lp):
 pg.wait_for_timeout(1500);pg.screenshot(path='/workspace/neon-ladle/shots/r12-creator.png')
 pg.click('#ccDone');pg.wait_for_timeout(500);pg.add_style_tag(content='#dlg{display:none!important}')
 pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};}")
 print(pg.evaluate("__G.scene.children.filter(o=>o.userData.human).length"), pg.evaluate("__G.scene.children.filter(o=>o.userData.robot).length"))
 pg.evaluate('__G.setTP(true)')
 for n,h,p in [('r12-street-mid',21,{'x':51,'z':-20,'y':0,'yaw':0,'pitch':-.05}),('r12-street-mid2',21,{'x':51,'z':20,'y':0,'yaw':3.14,'pitch':-.05}),('r12-street-crown',22,{'x':-48,'z':-262,'y':0,'yaw':0,'pitch':-.05}),('r12-street-docks',22,{'x':-39,'z':262,'y':0,'yaw':0,'pitch':-.05})]:
  shot(n,h,'rain',p);pg.wait_for_timeout(3000);pg.evaluate('for(let i=0;i<20;i++)__G.tickNPCs(.1)');pg.screenshot(path='/workspace/neon-ladle/shots/'+n+'.png')
 pg.evaluate('__G.setTP(false)')
 pg.evaluate('''()=>{const G=__G;const L=[{cls:'rich',top:0xd8d4cc,glow:{where:'collar',color:0xffe0a0}},{cls:'mid',sex:'f',top:0xff3fa4,glow:{where:'visor',color:0x3ff0ff}},{gang:'tide',top:0x2a2c22,glow:{where:'strip',color:0xff8a3d}},{robot:'CP_Robot_2Legs',glow:{color:0x3ff0ff}},{cls:'poor',top:0x3a3028},{gang:'wardline',top:0x1e2a44,hat:'cap'},{body:'android',top:0x8a8a9a},{cls:'mid',top:0x3ff0ff,body:'teen-character'},{robot:'CP_Flying',glow:{color:0xff3fa4}},{body:'cyborg',gang:'orrin',trim:0xc9b2ff,top:0x3a2a5a},{body:'ninja',gang:'tide'},{cls:'rich',sex:'f',top:0xe8e4e0,trims:['neck','wrists']}];
 window.__crowd=L.map((l,i)=>{const h=G.makeHuman(l);h.obj.position.set(48.6+(i%6)*1.1,0,-25-Math.floor(i/6)*1.6);h.obj.rotation.y=(i%3-1)*.4;h.play(i%4?'idle':'talk');G.scene.add(h.obj);return h;});}''')
 for n,h in [('r12-street-crowd-night',21),('r12-street-crowd-day',13)]:
  shot(n,h,'rain' if h>18 else 'clear',{'x':51.6,'z':-19.5,'y':0,'yaw':0,'pitch':-.12});pg.evaluate('for(const h of __crowd)h.mixer.update(.4)');pg.wait_for_timeout(1500);pg.screenshot(path='/workspace/neon-ladle/shots/'+n+'.png')
 print('fps-ish',pg.evaluate("new Promise(r=>{let n=0;const t=performance.now();const f=()=>{n++;if(performance.now()-t<3000)requestAnimationFrame(f);else r(n/3)};f();})"))
run(st)
