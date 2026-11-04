# R14b: vehicles (Quaternius parked cars in Crown, hover/sky traffic over Saltgate and the causeway)
import sys,os;sys.path.insert(0,os.path.dirname(__file__));from harness import run
S='/workspace/neon-ladle/shots/'
def st(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(500);pg.add_style_tag(content='#dlg{display:none!important}');pg.evaluate("()=>{__G.R5.clear();__G.R5.force=()=>{};__G.setTP(false)}")
 for h,w,tag in [(22,'rain','night'),(14,'clear','day')]:
  pg.evaluate(f"()=>{{__S.min={h}*60;__ENV.set('{w}',true)}}")
  for n,(x,y,z,yaw,pit) in {'crown':(-14,0,-252,-1.9,-.12),'crown2':(16,0,-262,1.2,-.1),'sky':(0,0,-2,0.3,.45),'causeway':(-66,6,-30,3.0,.25)}.items():
   pg.evaluate(f"()=>{{Object.assign(__P,{{x:{x},y:{y},z:{z},yaw:{yaw},pitch:{pit}}})}}");pg.wait_for_timeout(2500);lp();pg.screenshot(path=S+f'r14b-cars-{n}-{tag}.png')
if os.environ.get("MODE")!="studio":run(st)
STUDIO="""async ()=>{const T=__G.THREE;const C=await import('/cars.js');await C.carsLoaded;let cv=document.createElement('canvas');cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:99999';document.body.appendChild(cv);
const r=new T.WebGLRenderer({canvas:cv,antialias:true});r.setSize(innerWidth,innerHeight,false);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;
const sc=new T.Scene();sc.background=new T.Color(0x15121e);sc.add(new T.HemisphereLight(0xfff4ee,0x403850,1.4));const k=new T.DirectionalLight(0xffffff,2);k.position.set(2,4,3);sc.add(k);
const fl=new T.Mesh(new T.PlaneGeometry(40,20),new T.MeshStandardMaterial({color:0x222230,roughness:.4}));fl.rotation.x=-Math.PI/2;sc.add(fl);
const L=[['car','crown',0],['police','crown',0],['car','salt',1],['taxi','salt',0],['car','docks',2],['car','docks',3],['hover','salt',0],['sky','docks',4],['hover','crown',1]];
L.forEach(([k2,d,s],i)=>{const g=new T.Group();g.position.set((i%5-2)*2.6,k2==='hover'?.4:0,Math.floor(i/5)*-5);g.rotation.y=.6;sc.add(g);C.carSlot(g,k2,d,s);});
const cam=new T.PerspectiveCamera(40,innerWidth/innerHeight,.1,100);cam.position.set(0,4.5,9);cam.lookAt(0,.3,-2.5);r.render(sc,cam);}"""
def studio(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(800);pg.evaluate(STUDIO);pg.wait_for_timeout(500);pg.screenshot(path=S+'r14b-cars-lineup.png')
if __name__=='__main__' and os.environ.get('MODE')=='studio':run(studio)
