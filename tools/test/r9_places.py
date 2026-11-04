import sys;sys.path.insert(0,'/workspace/neon-ladle/tools/test');from harness import run
def st(pg,shot,lp):
  r=pg.evaluate("""()=>{const G=__G,bad=[];const py=__P.y;for(const k of Object.keys(G.npcs)){for(const h of [0,120,330,540,700,900]){}}
   const P=G.PLACES;__P.y=0;for(const [k,v] of Object.entries(P)){if(!Array.isArray(v)||v[2]==='sit')continue;const ok=G.walkable(v[0]+Math.sin(v[3]||0)*.9,v[1]+Math.cos(v[3]||0)*.9)||G.walkable(v[0]-.9,v[1])||G.walkable(v[0]+.9,v[1])||G.walkable(v[0],v[1]-.9)||G.walkable(v[0],v[1]+.9);if(!ok)bad.push(k);}__P.y=py;return {n:Object.keys(P).length,bad};}""")
  print('PLACES',r)
run(st)
