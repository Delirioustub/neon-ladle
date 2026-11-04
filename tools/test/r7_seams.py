import sys,json;import os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
def f(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(500)
 pg.evaluate("__G.openGate&&0")
 pg.evaluate(open("/workspace/neon-ladle/tools/test/seams.js").read());r=json.loads(pg.evaluate("JSON.stringify(__SEAMS)"))
 W=json.loads(pg.evaluate("JSON.stringify(__G.W.walk)"))
 print('rects',r['rects'],'crossings',r['crossings'],'fails',len(r['fails']),'gaps',len(r['gaps']))
 for x in r['fails'][:40]:print('FAIL',x,W[x['a']],W[x['b']])
 for x in r['gaps']:print('GAP',x,W[x['a']],W[x['b']])
run(f)
