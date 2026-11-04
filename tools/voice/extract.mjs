import {createRequire} from 'module';const require=createRequire(import.meta.url);
import * as acorn from 'acorn';import * as walk from 'acorn-walk';import fs from 'fs';
const CAST=['mara','juno','benny','sela','kip','ilse','dess'];const R='/workspace/neon-ladle/';
const out=new Map();let givers={};
const strOf=n=>n.type==='Literal'&&typeof n.value==='string'?n.value:(n.type==='TemplateLiteral'&&n.expressions.length===0?n.quasis[0].value.cooked:null);
const keyOf=p=>p.key&&(p.key.name??p.key.value);
const SKIP=new Set(['ask','ev','n','role','home','t','d','lock','title','hi','desc','tag','label']);
for(const f of ['story.js','story5.js','r5.js','game.js']){
 const src=require('child_process').execSync('git -C '+R+' show HEAD:'+f).toString();const ast=acorn.parse(src,{ecmaVersion:'latest',sourceType:'module'});
 walk.ancestor(ast,{Property(n){if(keyOf(n)==='giver'&&strOf(n.value)){/*record parent quest key later*/}}});
 walk.ancestor(ast,{ObjectExpression(n,anc){for(const p of n.properties){if(p.type==='Property'&&keyOf(p)==='giver'){const par=anc[anc.length-2];if(par&&par.type==='Property')givers[keyOf(par)]=strOf(p.value);}}}});
 const visit=(n,anc)=>{const s=strOf(n);if(!s||s.length<6||!/[a-z]/.test(s))return;
  let sp=null,ok=false,arr=false;{const L=anc.length;const p1=anc[L-2],p3=anc[L-4];if(p1&&p1.type==='ArrayExpression'&&p1.elements[0]===n&&p3&&p3.type==='Property'&&keyOf(p3)==='o')return;}
  for(let i=anc.length-2;i>=0;i--){const a=anc[i];
   if(a.type==='ArrayExpression')arr=true;
   if(a.type==='Property'){const k=keyOf(a);if(i===anc.length-2&&SKIP.has(k))return;
     if(k==='look'||k==='opts')return;
     if(CAST.includes(k)&&!sp){sp=k;ok=true;}
     if(k==='say')ok=true;
     if(/^s\d+$/.test(k)&&i===anc.length-2&&!sp){sp='OFFER:'+k;ok=true;}}
   if(a.type==='CallExpression'){const c=a.callee;const nm=c.name||(c.property&&c.property.name);
     if(['note','toast','flag','qStart','rep','rel'].includes(nm))return;
     if(nm==='say'){ok=true;const a0=strOf(a.arguments[0]);if(a0&&!sp)sp=CAST.includes(a0)?a0:'X';}}
   if(a.type==='ObjectExpression'&&!sp){for(const p of a.properties)if(p.type==='Property'&&['at','giver'].includes(keyOf(p))){const v=strOf(p.value);if(v&&CAST.includes(v))sp=v;}}
   if(a.type==='VariableDeclarator'&&a.id.name==='CAST')return;}
  if(!ok||!sp||sp==='X')return;out.set(sp+'|'+s,{sp,s,f});};
 walk.ancestor(ast,{Literal:visit,TemplateLiteral:visit});}
const res=[];for(const v of out.values()){if(v.sp.startsWith('OFFER:'))v.sp=givers[v.sp.slice(6)];if(v.sp)res.push(v);}
fs.writeFileSync('lines.json',JSON.stringify(res,null,1));
const c={};res.forEach(r=>c[r.sp]=(c[r.sp]||0)+1);console.log(res.length,c,givers);
const fnv=s=>{let h=0x811c9dc5;for(let i=0;i<s.length;i++){h^=s.charCodeAt(i);h=Math.imul(h,0x01000193)>>>0;}return h.toString(36);};
const NAR=/^(She|Her|He|His|They|Neither|Under|A|An|The|Behind|Inside|Somewhere|Someone|Nobody|For a)\b|^(Mara|Sela|Ilse|Kip|Dess|Juno|Benny|Juno-7)\b[^.]*\b(says|said|looks|leans|laughs|smiles|takes|holds|is|was|has)\b/;
let fin=[];for(const r of res){let s=r.s,t=null;
 if(!/\s/.test(s))continue;
 const q=s.match(/"([^"]+)"/g);
 if(q){const inner=q.map(x=>x.slice(1,-1));const outside=s.replace(/"[^"]+"/g,'').trim();
   t=(outside.length<3)?inner.join(' '):inner.join(' ... ');}
 else if(!NAR.test(s))t=s;
 if(!t)continue;
 if(r.sp==='juno'&&t===t.toUpperCase())t=t.toLowerCase().replace(/(^|[.!?]\s+)([a-z])/g,(m,a,b)=>a+b.toUpperCase());
 t=t.replace(/¢/g,' credits ').replace(/♥/g,'');
 fin.push({id:fnv(r.sp+'|'+r.s),sp:r.sp,s:r.s,t});}
fs.writeFileSync('final.json',JSON.stringify(fin,null,1));const c2={};fin.forEach(r=>c2[r.sp]=(c2[r.sp]||0)+1);console.log('final',fin.length,c2);
