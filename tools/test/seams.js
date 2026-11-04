// R7 seam walk test: for every pair of walk rects on the same level that touch or overlap, walk across
// their shared edge (at several points along it) and report any step that walkable() refuses.
// Also lists near-miss gaps (0 < gap < 1.2m) that look continuous but are not joined.
window.__SEAMS=(()=>{const G=__G,W=G.W.walk;const fails=[],gaps=[];let crossings=0;const y0=__P.y;
 const lvl=r=>r[4]||0;
 // a gap is fine when some walk line from A's centre-side to B's crosses it (a door rect bridges a facade)
 const gapBridge=(A,B,y)=>{const cx=(Math.max(A[0],B[0])+Math.min(A[1],B[1]))/2,cz=(Math.max(A[2],B[2])+Math.min(A[3],B[3]))/2;for(let d=-6;d<=6;d+=.25){const ax=(A[0]+A[1])/2,bz=(B[2]+B[3])/2;const zx=Math.max(A[0],B[0])<Math.min(A[1],B[1]);/* overlap in x => gap along z */if(zx){const x=Math.min(Math.max(cx+d,Math.max(A[0],B[0])+.4),Math.min(A[1],B[1])-.4);const za=(A[2]+A[3])/2<bz?A[3]-.5:A[2]+.5,zb=(A[2]+A[3])/2<bz?B[2]+.5:B[3]-.5;if(!walkLine(x,za,x,zb,y))return true;}else{const z=Math.min(Math.max(cz+d,Math.max(A[2],B[2])+.4),Math.min(A[3],B[3])-.4);const xa=ax<(B[0]+B[1])/2?A[1]-.5:A[0]+.5,xb=ax<(B[0]+B[1])/2?B[0]+.5:B[1]-.5;if(!walkLine(xa,z,xb,z,y))return true;}}return false;};
 const walkLine=(x0,z0,x1,z1,y)=>{__P.y=y;const n=Math.ceil(Math.hypot(x1-x0,z1-z0)/.1);for(let i=0;i<=n;i++){const t=i/n,x=x0+(x1-x0)*t,z=z0+(z1-z0)*t;if(!G.walkable(x,z))return [x,z];}return null;};
 for(let a=0;a<W.length;a++)for(let b=a+1;b<W.length;b++){const A=W[a],B=W[b];if(Math.abs(lvl(A)-lvl(B))>.01)continue;const y=lvl(A);
  // x-overlap and z-overlap intervals (negative = gap)
  const ox0=Math.max(A[0],B[0]),ox1=Math.min(A[1],B[1]),oz0=Math.max(A[2],B[2]),oz1=Math.min(A[3],B[3]);const ox=ox1-ox0,oz=oz1-oz0;
  if(ox<-1.2||oz<-1.2)continue;
  if(ox<0&&oz>.7){if(!gapBridge(A,B,y))gaps.push({a,b,axis:'x',gap:-ox,at:[ox1,ox0,oz0,oz1],y});continue;}
  if(oz<0&&ox>.7){if(!gapBridge(A,B,y))gaps.push({a,b,axis:'z',gap:-oz,at:[ox0,ox1,oz1,oz0],y});continue;}
  if(ox<0||oz<0)continue;
  // touching/overlapping. Cross along whichever direction has the larger shared span, if both rects extend beyond the overlap
  const tests=[];
  if(oz>.7){// shared span runs along z: walk in x from A-only side to B-only side
   const aL=A[0]<ox0-.01,aR=A[1]>ox1+.01,bL=B[0]<ox0-.01,bR=B[1]>ox1+.01;
   const xa=aL&&bR?[Math.max(A[0],ox0-1),Math.min(B[1],ox1+1)]:aR&&bL?[Math.min(A[1],ox1+1),Math.max(B[0],ox0-1)]:null;
   if(xa)for(let k=1;k<=5;k++){const z=oz0+.35+(oz-.7)*k/6;tests.push([xa[0],z,xa[1],z]);}}
  if(ox>.7){const aD=A[2]<oz0-.01,aU=A[3]>oz1+.01,bD=B[2]<oz0-.01,bU=B[3]>oz1+.01;
   const za=aD&&bU?[Math.max(A[2],oz0-1),Math.min(B[3],oz1+1)]:aU&&bD?[Math.min(A[3],oz1+1),Math.max(B[2],oz0-1)]:null;
   if(za)for(let k=1;k<=5;k++){const x=ox0+.35+(ox-.7)*k/6;tests.push([x,za[0],x,za[1]]);}}
  for(const [x0,z0,x1,z1] of tests){
   // start/end must themselves be walkable (body fits); skip ends that sit against an inner obstacle
   __P.y=y;if(!G.walkable(x0,z0)||!G.walkable(x1,z1))continue;crossings++;const f=walkLine(x0,z0,x1,z1,y);if(f)fails.push({a,b,from:[x0,z0],to:[x1,z1],stuck:f.map(v=>+v.toFixed(2)),y});}}
 __P.y=y0;return {rects:W.length,crossings,fails,gaps};})();
