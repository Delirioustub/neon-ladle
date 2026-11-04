# R10b: every main-quest step, 8 times of day (incl. night/curfew 1:30/3:00, storm): each NPC the step points at or listens for
# must be spawned after the player was far away, visible, at its place, on walkable ground, near the waypoint, and in CAST.
import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));from harness import run
import r7_story as R
def f(pg,shot,lp):
 R.begin(pg);pg.evaluate("window.__PRES=1;__ENV.set('storm',true);for(const k in __G.npcs)__S.rel[k]=7;__S.q.s2='done';__S.q.s3='done'")
 o=R.drive(pg,"[/Bring the street/,/Shut him down/]")
 print('\n'.join(o['log']));print('BAD',len(o['bad']));print('\n'.join(o['bad']))
run(f)
