import sys;sys.path.insert(0,'/workspace/neon-ladle/tools/test');from harness import run
def st(pg,shot,lp):
  pg.click('text=Done');pg.wait_for_timeout(500);pg.evaluate('__G.setTP(false)');pg.add_style_tag(content='#dlg{display:none!important}')
  pg.evaluate("()=>{__S.min=3*60;}");pg.wait_for_timeout(1000)
  print('PLACE',pg.evaluate("__G.placeFor('mara')"))
  pg.evaluate("()=>{const n=__G.npcs.mara;n.route=[];n.obj.position.set(23.9,0,-30);}");pg.wait_for_timeout(1500)
  print('MARA',pg.evaluate("(()=>{const n=__G.npcs.mara;return [n.obj.position.x,n.obj.position.z,n.obj.visible]})()"),'walk-in-front',pg.evaluate("(()=>{__P.y=0;return [__G.walkable(24.6,-30),__G.walkable(23.9,-30)]})()"))
  for yaw in [0,1.57,3.14,-1.57]:shot('r9-mara-%s'%yaw,pp={'x':24.4,'y':0,'z':-26,'yaw':yaw,'pitch':-.05})
run(st)
