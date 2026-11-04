import sys,os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
def st(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(500);pg.evaluate('__G.setTP(false)');pg.add_style_tag(content='#dlg{display:none!important}')
 pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};const d=document.querySelector('#dlg');if(d&&!d.classList.contains('hide')){const b=[...document.querySelectorAll('#dopts button')];if(b.length)b[b.length-1].click();}}")
 for n,h,p in [('canal-head',21,{'x':58,'z':-40,'y':0,'yaw':0,'pitch':-.05}),('harbor-rise-north',22,{'x':58,'z':-66,'y':-.2,'yaw':0.1,'pitch':-.02}),('harbor-rise-bend',22,{'x':63,'z':-110,'y':-.6,'yaw':.3,'pitch':-.05}),
  ('harbor-rise-crown',22,{'x':76,'z':-184,'y':-.55,'yaw':-1.2,'pitch':0}),('overlook-road',22,{'x':94,'z':-209,'y':0,'yaw':3.14,'pitch':-.15}),('canal-foot',21,{'x':58,'z':40,'y':0,'yaw':3.14,'pitch':-.05}),
  ('harbor-rise-south',22,{'x':62,'z':90,'y':-.5,'yaw':3.3,'pitch':-.03}),('harbor-rise-docks',22,{'x':66,'z':188,'y':-.5,'yaw':2.8,'pitch':-.02}),('harbor-rise-day',13,{'x':54,'z':-142,'y':-.6,'yaw':-.2,'pitch':-.05})]:
  shot('r11b-'+n,h,'rain',p)
run(st)
