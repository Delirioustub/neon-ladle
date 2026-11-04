import sys;sys.path.insert(0,'/workspace/neon-ladle/tools/test');from harness import run
SP=[('pier',50,0,258.5,-1.57,-.15,13),('pier-back',70,0,261,1.57,-.15,13),('docks-street',-20,0,260,-1.57,0,22),('docks-sign-back',10,0,262,1.57,.25,22),('crown-signs',-10,0,-262,1.57,.2,22)]
def st(pg,shot,lp):
  pg.click('text=Done');pg.wait_for_timeout(500);pg.evaluate('__G.setTP(false)')
  pg.add_style_tag(content='#dlg{display:none!important}')
  for n,x,y,z,yaw,pit,h in SP:shot('r10-'+n,h=h,pp={'x':x,'y':y,'z':z,'yaw':yaw,'pitch':pit})
  print('SIGNS2',pg.evaluate('window.__signs2'))
  print('RUNS',pg.evaluate("Object.fromEntries(Object.entries(window.__pedRuns||{}).map(([k,v])=>[k,v.length]))"))
  print('DOORBLOCKS',pg.evaluate("Object.values(__G.CITY.apts).map(a=>[a.door,__G.CITY.block.filter(b=>Math.hypot((b[0]+b[1])/2-a.door[0],(b[2]+b[3])/2-a.door[1])<2.5).length])"))
  print('WHITEBOX',pg.evaluate("""(()=>{const o=[];__G.scene.traverse(m=>{if(!m.isMesh||m.isInstancedMesh||!m.geometry||m.geometry.type!=='BoxGeometry')return;const t=m.material;if(!t||t.map||!t.color||t.isMeshBasicMaterial)return;const c=t.color;const l=(c.r+c.g+c.b)/3;const p=m.geometry.parameters;if(l>.6&&p.width*p.height*p.depth>.3){const v=m.getWorldPosition(new __G.THREE.Vector3());o.push([v.x.toFixed(1),v.y.toFixed(1),v.z.toFixed(1),c.getHexString()]);}});return o})()"""))
run(st)
