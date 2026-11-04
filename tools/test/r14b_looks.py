import sys,os,json;sys.path.insert(0,os.path.dirname(__file__));from harness import run
JS="""async (a)=>{const [sets,name]=a;const G=__G,T=G.THREE;let cv=document.getElementById('studio');if(!cv){cv=document.createElement('canvas');cv.id='studio';cv.style.cssText='position:fixed;inset:0;width:100vw;height:100vh;z-index:99999';document.body.appendChild(cv);}
const r=window.__SR||(window.__SR=new T.WebGLRenderer({canvas:cv,antialias:true}));r.setSize(innerWidth,innerHeight,false);r.outputColorSpace=T.SRGBColorSpace;r.toneMapping=T.ACESFilmicToneMapping;r.toneMappingExposure=1.25;
const sc=new T.Scene();sc.background=new T.Color(0x2a2438);sc.add(new T.HemisphereLight(0xfff4ee,0x403850,1.6));const k=new T.DirectionalLight(0xffffff,2.4);k.position.set(1.5,2.5,3);sc.add(k);const f=new T.DirectionalLight(0x9fd8ff,1.0);f.position.set(-2,1.5,2);sc.add(f);
const hs=sets.map((l,i)=>{const h=G.makeHuman(l);h.obj.position.x=(i-(sets.length-1)/2)*a[2];sc.add(h.obj);h.mixer.update(.6);return h;});sc.updateMatrixWorld(true);
let y=0;for(const h of hs){const b=h.bones&&h.bones.Head;y+=b?b.getWorldPosition(new T.Vector3()).y:1.6;}y/=hs.length;
const cam=new T.PerspectiveCamera(a[3],innerWidth/innerHeight,.05,50);cam.position.set(0,y-.05,a[4]);cam.lookAt(0,y-.1,0);r.render(sc,cam);return y;}"""
S='/workspace/neon-ladle/shots/'
FULL=lambda bg:JS.replace("0x2a2438",bg).replace("cam.position.set(0,y-.05,a[4]);cam.lookAt(0,y-.1,0)","cam.position.set(0,1.0,a[4]);cam.lookAt(0,.95,0)")
def st(pg,shot,lp):
 pg.click('#ccDone');pg.wait_for_timeout(500)
 J=pg.evaluate("Object.assign({hi:1},__G.CAST.juno.look)")
 A=[J,{'android':1,'top':0x8a8a9a,'hi':1},{'android':1,'top':0x3ff0ff,'hi':1,'glow':{'where':'collar','color':0xff3fa4}},{'android':1,'top':0x2a2a34,'hi':1,'eye':0xffe14d}]
 pg.evaluate(JS,[A,'a',.6,30,2.4]);pg.wait_for_timeout(300);pg.screenshot(path=S+'r14b-androids.png')
 pg.evaluate(FULL('0x15121e'),[A,'a',.7,40,4]);pg.wait_for_timeout(300);pg.screenshot(path=S+'r14b-androids-full.png')
 L=pg.evaluate("(()=>{const R=[0xd8d4cc,0x1a1a22,0x3ff0ff,0xff3fa4,0x3a3028,0x2a2c22,0x5a5a6a,0x8a3a4a];return ['rich','rich','mid','mid','poor','poor','mid','mid'].map((c,i)=>({sex:i%2?'f':'m',cls:c,top:R[i],hi:1,n:i}));})()")
 pg.evaluate(FULL('0x15121e'),[L,'c',.6,40,4.6]);pg.wait_for_timeout(300);pg.screenshot(path=S+'r14b-neon-classes.png')
 G=[{'gang':'tide','top':0x2a2c22,'hi':1},{'gang':'tide','top':0x3a3028,'sex':'f','hi':1},{'gang':'wardline','top':0x1e2a44,'hat':'cap','hi':1},{'gang':'saint','top':0xe8e8f0,'hi':1},{'gang':'orrin','cls':'rich','top':0x3a2a5a,'trim':0xc9b2ff,'hi':1},{'gang':'orrin','sex':'f','top':0x2a2a3a,'trim':0xc9b2ff,'hi':1}]
 pg.evaluate(FULL('0x15121e'),[G,'g',.65,40,4.2]);pg.wait_for_timeout(300);pg.screenshot(path=S+'r14b-neon-gangs.png')
run(st)
