// Input layer: produces abstract intents (move vector, look deltas, interact).
// The game reads Input.move / consumes Input.look and subscribes to Input.on('interact').
// Touch is the primary device; keyboard + mouse are wired too so desktop works with no game changes.
export const Input={move:{x:0,y:0},look:{dx:0,dy:0},lookSens:1,_h:{},enabled:true,
 on(ev,fn){(this._h[ev]=this._h[ev]||[]).push(fn);},emit(ev,a){(this._h[ev]||[]).forEach(f=>f(a));},
 consumeLook(){const l={dx:this.look.dx,dy:this.look.dy};this.look.dx=this.look.dy=0;return l;}};
export function initInput({surface,joyEl,knobEl}){
 const joy={id:null,ox:0,oy:0};let lookId=null,lx=0,ly=0,lookStart=null;const R=60,MAX=48;
 const resetJoy=()=>{joy.id=null;Input.move.x=Input.move.y=0;knobEl.style.transform='';joyEl.style.opacity=.5;joyEl.style.left='';joyEl.style.top='';joyEl.style.bottom='';};
 surface.addEventListener('pointerdown',e=>{if(!Input.enabled)return;
  if(e.pointerType==='mouse'){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;lookStart={x:e.clientX,y:e.clientY,t:performance.now()};return;}
  if(e.clientX<innerWidth*.42&&joy.id===null){joy.id=e.pointerId;joy.ox=e.clientX;joy.oy=e.clientY;joyEl.style.left=(e.clientX-R)+'px';joyEl.style.top=(e.clientY-R)+'px';joyEl.style.bottom='auto';joyEl.style.opacity=.9;}
  else if(lookId===null){lookId=e.pointerId;lx=e.clientX;ly=e.clientY;lookStart={x:e.clientX,y:e.clientY,t:performance.now()};}});
 addEventListener('pointermove',e=>{
  if(e.pointerId===joy.id){let dx=e.clientX-joy.ox,dy=e.clientY-joy.oy;const d=Math.hypot(dx,dy);if(d>MAX){dx*=MAX/d;dy*=MAX/d;}Input.move.x=dx/MAX;Input.move.y=dy/MAX;knobEl.style.transform=`translate(${dx}px,${dy}px)`;}
  else if(e.pointerId===lookId){Input.look.dx+=(e.clientX-lx)*Input.lookSens;Input.look.dy+=(e.clientY-ly)*Input.lookSens;lx=e.clientX;ly=e.clientY;}});
 const up=e=>{if(e.pointerId===joy.id)resetJoy();if(e.pointerId===lookId){lookId=null;if(lookStart&&Math.hypot(e.clientX-lookStart.x,e.clientY-lookStart.y)<10&&performance.now()-lookStart.t<300)Input.emit('tap',{x:e.clientX,y:e.clientY});lookStart=null;}};
 addEventListener('pointerup',up);addEventListener('pointercancel',up);
 // keyboard (desktop-ready)
 const keys={};const kv=()=>{if(joy.id!==null)return;Input.move.x=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0);Input.move.y=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);};
 addEventListener('keydown',e=>{if(e.repeat)return;keys[e.code]=1;kv();if(e.code==='KeyE'||e.code==='Space')Input.emit('interact');if(e.code==='KeyV')Input.emit('toggleView');if(e.code==='Escape'||e.code==='Tab'){Input.emit('menu');e.preventDefault();}});
 addEventListener('keyup',e=>{keys[e.code]=0;kv();});addEventListener('blur',()=>{for(const k in keys)keys[k]=0;kv();resetJoy();});
}
