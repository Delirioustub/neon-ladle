import sys;sys.path.insert(0,'/workspace/neon-ladle/tools/test');from harness import run
SP=[('terrace',-3,46,-274,3.14,-.6,1),('terrace-down',0,46,-272.8,3.14,-1.0,1),('crown',-20,0,-262,1.57,-.15,1),('crown-night',-30,0,-258,-1.57,-.05,5),('salt',5,0,-2,1.57,-.2,1),('plaza',-22,0,50,0,-.2,1),('mara',26.5,0,-30,-1.57,-.05,9),('aptdoor',-6.2,0,-5.5,3.14,0,1),('aptdoor-mid',-36,0,-4.5,3.14,0,1)]
def st(pg,shot,lp):
  pg.click('text=Done');pg.wait_for_timeout(500);pg.evaluate('__G.setTP(false)')
  for i in range(8):
    if pg.is_visible('#dlg'):pg.mouse.click(420,300);pg.wait_for_timeout(300)
  for n,x,y,z,yaw,pit,h in SP:shot('r9-'+n,h=h,pp={'x':x,'y':y,'z':z,'yaw':yaw,'pitch':pit})
  print('MARA',pg.evaluate("(()=>{const n=__G.npcs.mara;return [n.obj.position.x,n.obj.position.z,n.obj.visible]})()"))
run(st)
