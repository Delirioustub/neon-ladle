import sys,json;sys.path.insert(0,'/workspace/neon-ladle/tools/test');from harness import run
JS=open('/workspace/neon-ladle/tools/test/props.js').read()
def st(pg,shot,lp):
  pg.evaluate(JS);h=pg.evaluate('__PROPS()');print('PROP_HITS',len(h));
  for x in h:print(json.dumps(x))
run(st)
