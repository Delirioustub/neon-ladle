// Neon Ladle: main-cast voice lines (Kokoro-82M, local TTS) + recorded street ambience (CC0, see CREDITS.md).
// Self-contained: watches the dialogue box and the options menu, so game.js needs no changes.
import {CAST} from './story.js';
import {regionOf} from './city.js';
const VOICED=['mara','juno','benny','sela','kip','ilse','dess'];
const NAME={};for(const k of VOICED)if(CAST[k])NAME[CAST[k].n.toUpperCase()]=k;
const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(36);};
const OPT=Object.assign({voice:.9,street:.7},JSON.parse(localStorage.getItem('nlAudio2')||'{}'));
const saveOpt=()=>localStorage.setItem('nlAudio2',JSON.stringify(OPT));
const master=()=>{const S=window.__G&&window.__G.SET;return S?S.master:.8;};
let IDS=null;fetch('audio/voice/index.json').then(r=>r.json()).then(a=>{IDS=new Set(a);}).catch(()=>{IDS=new Set();});
const NL={played:[],ambOn:false,lastVoice:null};window.NLAudio=NL;
// ---------- voice ----------
const vEl=new Audio();vEl.preload='auto';
function stopVoice(){if(!vEl.paused){vEl.pause();}vEl.removeAttribute('src');}
function playLine(k,text){stopVoice();if(!IDS)return;const id=fnv(k+'|'+text);if(!IDS.has(id))return;
 vEl.src='audio/voice/'+id+'.mp3';vEl.volume=Math.min(1,OPT.voice*master());NL.lastVoice=id;NL.played.push(id);vEl.play().catch(()=>{});duck(1);}
vEl.onended=()=>duck(0);
NL.playLine=playLine;NL.stopVoice=stopVoice;
function hookDialog(){const dt=document.getElementById('dtext'),dl=document.getElementById('dlg'),dn=document.getElementById('dname');if(!dt||!dl){setTimeout(hookDialog,500);return;}
 let last='';
 new MutationObserver(()=>{const t=dt.textContent;if(dl.classList.contains('hide')){last='';stopVoice();duck(0);return;}
  if(t===last)return;last=t;const k=NAME[(dn.textContent||'').trim()];if(k)playLine(k,t);else{stopVoice();duck(0);}})
 .observe(dl,{subtree:true,childList:true,characterData:true,attributes:true,attributeFilter:['class']});}
// ---------- ambience (Web Audio loops, mixed by district, rain and indoors) ----------
let AC=null,bus=null;const L={};
const MIX={mid:{crowd:.8,traffic:.45,siren:.25},crown:{crowd:.35,traffic:.7,siren:.1},docks:{crowd:.45,traffic:.2,siren:.6},
 causeway:{crowd:.08,traffic:1,siren:.35},metro:{crowd:.6,traffic:.1,siren:.05},home:{crowd:.2,traffic:.3,siren:.15},node14:{crowd:0,traffic:0,siren:0}};
async function startAmb(){if(AC)return;AC=new (window.AudioContext||window.webkitAudioContext)();bus=AC.createGain();bus.gain.value=0;bus.connect(AC.destination);
 for(const n of ['crowd','traffic','rain','siren']){try{const b=await fetch('audio/amb/'+n+'.mp3').then(r=>r.arrayBuffer());const buf=await new Promise((res,rej)=>AC.decodeAudioData(b,res,rej));
  const s=AC.createBufferSource();s.buffer=buf;s.loop=true;const g=AC.createGain();g.gain.value=0;s.connect(g).connect(bus);s.start(0,Math.random()*buf.duration);L[n]={g,dur:buf.duration};}catch(e){console.warn('amb',n,e);}}
 NL.ambOn=true;NL.loaded=Object.keys(L);tick();setInterval(tick,700);}
let duckV=1;function duck(on){duckV=on?.55:1;}
function tick(){if(!AC)return;const P=window.__P,G=window.__G,E=window.__ENV;const t=AC.currentTime;
 const reg=P?regionOf(P.x,P.z):'mid';const m=MIX[reg]||MIX.mid;NL.region=reg;
 let inside=0;try{inside=G&&G.CITY&&G.CITY.inRoom(P.x,P.z,P.y+1)?1:0;}catch(e){}
 const rain=E&&E.st?E.st.rain:1;const io=inside?.25:1;
 const set=(n,v)=>{if(L[n])L[n].g.gain.setTargetAtTime(v,t,.8);};
 set('crowd',m.crowd*io);set('traffic',m.traffic*io*.7);set('siren',m.siren*io*.45);set('rain',(.1+.9*rain)*(inside?.35:.75)*(reg==='metro'?.3:1));
 bus.gain.setTargetAtTime(document.hidden?0:OPT.street*master()*duckV,t,.5);vEl.volume=Math.min(1,OPT.voice*master());}
const unlock=()=>{startAmb();if(AC&&AC.state==='suspended')AC.resume();};
['pointerdown','touchend','keydown'].forEach(e=>addEventListener(e,unlock,{passive:true}));
document.addEventListener('visibilitychange',()=>{if(document.hidden)stopVoice();tick();});
// ---------- options sliders (injected next to the existing ambience slider) ----------
function hookMenu(){const M=document.getElementById('menu');if(!M){setTimeout(hookMenu,500);return;}
 new MutationObserver(()=>{const a=document.getElementById('vAmb');if(!a||document.getElementById('vVoice'))return;
  const row=a.closest('.row');const mk=(id,l,v)=>{const d=document.createElement('div');d.className='row';d.innerHTML=`<span>${l}</span><input type="range" id="${id}" min="0" max="100" value="${Math.round(v*100)}">`;return d;};
  const v=mk('vVoice','Voice',OPT.voice),s=mk('vStreet','Street sounds',OPT.street);row.after(v);v.after(s);
  v.querySelector('input').oninput=e=>{OPT.voice=e.target.value/100;saveOpt();tick();};
  s.querySelector('input').oninput=e=>{OPT.street=e.target.value/100;saveOpt();tick();};}).observe(M,{childList:true,subtree:true});}
hookDialog();hookMenu();
