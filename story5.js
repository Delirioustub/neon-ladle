// Neon Ladle R5a: Acts Three to Five. The conspiracy under the canopy. All original writing.
// Acts One and Two are m1..m8 in story.js (the Ladle, Line 9, the ledger). These pick up the morning after Homecoming.
export function makeActs(G){const {S,rel,note,toast,flag}=G;const R=(f,d)=>G.rep(f,d);const F=S.flags;
 const led=()=>F.ledger||'ilse';
 const relv=k=>S.rel[k]??2;
 return {
 // ================= ACT THREE · THE WEATHER MEN =================
 m9:{t:'The Second Page',main:1,ch:3,steps:[
  {d:'Dess wants a word, behind the counter at the Ladle',at:'dess',on:'talk:dess',say:()=>[[
    "Sit. No, not the stool. The crate. The stool's for customers.",
    "I copied Orrin's ledger in a hurry. Every name, every hour. I thought that was all of it. Last night I couldn't sleep, so I read it again with my good eye.",
    "There's a second page. Same names. Different column. Not hours. Just one word, stamped beside every sixth or seventh person.",
    "BALLAST.",
    led()==='ilse'?"Ilse's courts sent forty people home. I counted the ballast names against the list. Not one of them came back.":led()==='juno'?"Juno's broadcast shamed Orrin into halving the debts. Lovely. But nobody asked where the ballast names went, and Orrin never said.":"Mara buried the ledger. But I kept a copy of the copy. I'm old, not stupid. And the ballast names are still missing.",
    "Under the word, a time and a place. Three in the morning. Ashline pier. Go look. Quietly. I'm too slow for quiet these days."],
   [{t:'"Ballast. Like weight on a ship."',fx:()=>note('The ledger has a second page. Some names are stamped BALLAST, with a time: 03:00, Ashline pier.'),adv:1},{t:'"I\'ll go tonight."',fx:()=>note('The ledger has a second page. Some names are stamped BALLAST, with a time: 03:00, Ashline pier.'),adv:1}]]},
  {d:'Search the crates at the end of the Ashline pier',at:[68,259],on:'interact:r5crate',say:()=>[[
    "Under a tarp that smells of diesel and salt: a long white case, the size of a coffin, with HALCYON stencilled on the lid in soft hospital letters.",
    "It's empty. The padding inside is still warm. Shaped like someone. A wristband is caught in the seal.",
    "OSU, HIRAM · 71 · BALLAST · NODE 14.",
    "Old Osu. Benny's chess partner. The man everyone assumed had moved in with his daughter."],
   [{t:'Pocket the wristband',fx:()=>{flag('wrist',1);note('A Halcyon sleep pod on the Ashline pier. Empty, warm. Wristband: OSU, HIRAM · BALLAST · NODE 14.');},adv:1}]]},
  {d:'Ask Old Hesk at the Rusted Hook about the barges',at:[-42,273.5],on:'staff:Old Hesk',say:()=>{const mem=G.gang&&G.gang.rank()>0;return [[
    mem?"You're Tide now. So I'll tell you straight, because you'd find out anyway and then you'd hate me.":"Barges. Everybody asks about the barges eventually. Most people stop asking. You don't look like most people.",
    "Orrin pays the Tide to move white boxes from the pier to the Crown service lift. Three in the morning. No lights. We don't open them. That's the deal. Clean money for a dirty harbor.",
    "Two years ago one box knocked. From the inside. My nephew opened it before I could stop him.",
    "A woman in a paper gown. She asked him what year it was. Then the Orrin men took her back and paid us double to forget.",
    "I took the money. I've got thirty people on this pier who eat because I took the money. You want to judge me, get in line behind me."],
   mem?[{t:'"We\'re going to stop it. The Tide too."',fx:()=>{R('tide',1);flag('heskTold',1);},adv:1}]:
    [{t:'"Nobody\'s judging. Where do the boxes go?"',fx:()=>{R('tide',1);flag('heskTold',1);},adv:1},{t:'Slide him ¢100 to keep talking',fx:()=>{if(S.cash>=100){S.cash-=100;flag('heskTold',1);}},adv:1},{t:'"You sold people by the pound."',fx:()=>{R('tide',-2);R('civ',1);flag('heskTold',0);},adv:1}]];}},
  {d:'Bring Osu\'s wristband to Kip. He can read the chip',at:'kip',on:'talk:kip',say:()=>[[
    "A Halcyon band? Those things have a chip the size of a rice grain. Gimme.",
    "...Okay. Okay okay okay. It's not a medical tag. It's a network address. NODE 14 is a canopy node.",
    "You know the canopy? The thing over Crown Heights that keeps the rich dry? Everyone thinks it's a roof. Like, a big invisible umbrella.",
    "It's not a roof. It's a brain. It reads the clouds and pushes them around. Herds them. That takes a stupid amount of compute.",
    "And this band says the compute is... him. Osu. They're running the weather on sleeping people.",
    "I'm going to be sick. Hold Mothball."],
   [{t:'"Can you find Node 14?"',fx:()=>{rel('kip',1);note('Kip: the canopy over Crown is a weather brain. It runs on sleeping people. Osu is part of Node 14.');},adv:1}]]},
  {d:'Splice Kip\'s listener into the canopy relay on the Ashline rooftops',at:[-35,249],on:'interact:r5relay',say:()=>[[
    "You clip Kip's listener onto the relay mast. The rain hisses on the rooftop tin. Your earpiece crackles.",
    "Static. Then, under the static, voices. Hundreds of them, murmuring, overlapping, like a ward at night.",
    "\"...is it still raining...\" \"...tell Mira the rent's in the jar...\" \"...cold, so cold, why is it always...\" \"...I can see the whole city from here...\"",
    "And beneath all of them, steady as a heartbeat, a single tone. Fifty-five hertz. The same hum as Line 9.",
    "Dess's message, the one that brought you here. Line 9 still hums. She wasn't telling you where to find her. She was telling you what she'd heard."],
   [{t:'Listen until you can\'t',fx:()=>note('The canopy relay carries voices. Hundreds of sleepers. Under them, 55 Hz, the Line 9 hum. "Line 9 still hums" was never about Dess.'),adv:1}]]}
 ],done:()=>{G.chapter('Act Three complete','The rain is not weather. It is a decision somebody makes.');setTimeout(()=>{G.chapter('Act Four','Thirty-One Years of Rain');G.start('m10');},4200);}},
 // ================= ACT FOUR · THIRTY-ONE YEARS OF RAIN =================
 m10:{t:'What Dess Drew',main:1,ch:4,steps:[
  {d:'Tell Dess what you heard on the relay',at:'dess',on:'talk:dess',say:()=>[[
    "Fifty-five hertz. You heard them.",
    "...I need you to let me finish before you say anything. I've been rehearsing this for thirty-one years and it still isn't any good.",
    "Before the Ladle, before I was a fixer, I was a weather engineer at Orrin. Third floor. Window desk. I drew the canopy.",
    "My design covered the whole city. Thin. Fair. A little less rain for everyone. It was the best thing I ever made.",
    "The board changed one line. Keep Crown dry. Push the surplus out. Out meant here. Saltgate. Ashline. Every drop they didn't want, they gave to us. That's why it never stops.",
    "When the servers got too expensive, they found something cheaper. A brain asleep is a better weather model than any machine. And nobody audits a dream.",
    "I quit. I ran. I opened a noodle bar and spent my life feeding the people my drawing drowns. It wasn't enough. It was never going to be enough."],
   [{t:'"You couldn\'t have known what they\'d do."',fx:()=>{flag('dessForgive',1);rel('dess',2);},adv:1},
    {t:'"Why didn\'t you tell me before I came?"',fx:()=>{flag('dessForgive',0.5);},then:()=>setTimeout(()=>G.say('dess',["Because you'd have stayed home. And I needed someone who could still be angry. I'm too tired to be angry. I'm just sorry."],[{t:'"...Okay."'}]),60),adv:1},
    {t:'"Thirty-one years of rain. That\'s on you."',fx:()=>{flag('dessForgive',0);rel('dess',-2);},adv:1}]]},
  {d:'Find Mara. A name on Kip\'s node list belongs to her',at:'mara',on:'talk:mara',say:()=>[[
    "You've got the look people get right before they ruin my evening. Go on.",
    "...Lena Voss. Node 14. Ballast.",
    "My sister moved to the Spires. That's what the letter said. She calls on holidays. Sometimes. A recorded voice, sometimes, now that I think about it. The same four sentences.",
    "I collected for them. Six years. I knocked on doors and I said sorry and I meant it and I knocked anyway. And they had her the whole time. Asleep. Making the weather I walked through to get to work.",
    led()==='mara'?"You gave me that ledger and I buried it. I buried her in it. Do you understand? I buried my own sister to keep my job.":"I'm done with Orrin. Here. My badge opens the Crown service floors. I won't need it where I'm going, which is wherever you're going."],
   [{t:'"We\'ll get her out, Mara."',fx:()=>{flag('maraBadge',1);rel('mara',2);note('Mara\'s sister Lena is a sleeper in Node 14. Mara gave you her Orrin badge.');},adv:1}]]},
  {d:'Talk to Sela at the clinic. She\'ll know how to wake a sleeper',at:'sela',on:'talk:sela',say:()=>[[
    "Halcyon pods. Long-term induced sleep. We had one at the clinic once, for a burn patient. You don't just open the lid. You wake them wrong, the heart forgets what it's for.",
    "There's a protocol. A slow warm. I can do it. I'd need to be there.",
    "...You said Node 14 is under Line 9.",
    "My brother Dayo went down the Line 9 stairs two years ago. I tell everyone he moved away.",
    "If he's down there, I'm coming. Don't argue with a nurse. We know where all the soft parts are."],
   [{t:'"Bring your kit."',fx:()=>{flag('selaKit',1);rel('sela',1);},adv:1}]]},
  {d:'Ask Juno-7. Its route planner keeps drawing a line under Line 9',at:'juno',on:'talk:juno',say:()=>[[
    "The line on my planner. I know where it goes now. Past the platform, through a maintenance seal, along a tunnel that is not on any map I am permitted to hold.",
    F.junoMemory?"I delivered Dess's soup there. Every night. Before they wiped me. My feet remember the way even if I am not supposed to.":"My logs from before my last wipe are missing. But my feet know a way. That is a strange sentence. I am keeping it.",
    "I will open the seal for you. I would like to come, but somebody must keep the courier screens warm, in case we need twelve thousand of them."],
   [{t:'"Thank you, Juno."',fx:()=>{rel('juno',1);flag('tunnelOpen',1);note('Juno opened a maintenance seal at the back of the Line 9 platform. The tunnel leads to Node 14.');},adv:1}]]},
  {d:'Go through the maintenance seal at the back of the Line 9 platform',at:[-24,77],on:'enter:node14'},
  {d:'Walk among the pods of Node 14',at:[0,548],on:'interact:r5pods',say:()=>[[
    "Rows of white pods in the dark, hundreds, stacked like library shelves, each glowing faintly cyan. Every one hums at fifty-five hertz. The air tastes of copper and rain.",
    "Faces under frosted glass. A man in a delivery jacket. A girl younger than Kip. Old Osu, peaceful, his chess-player's hands folded.",
    "A pod near the end reads OKAFOR, DAYO. Beside it, VOSS, LENA.",
    F.selaKit?"Sela kneels, opens her kit, and looks at you. \"I can wake one. Now. Quietly. Or we wait and wake them all, and I don't know if we'll get the chance.\"":"Without Sela's protocol you don't dare open them. You press your hand to the glass over Dayo's face. It's warm."],
   F.selaKit?[{t:'"Wake Dayo."',fx:()=>{flag('wokeOne','dayo');rel('sela',3);},adv:1},{t:'"Wake Lena, for Mara."',fx:()=>{flag('wokeOne','lena');rel('mara',3);rel('sela',-1);},adv:1},{t:'"Wait. All of them or none."',fx:()=>{flag('wokeOne',0);R('civ',1);},adv:1}]:[{t:'Memorise the names',fx:()=>flag('wokeOne',0),adv:1}]]},
  {d:'Listen to what the sleeper knows',at:[0,548],on:'interact:r5pods',say:()=>{const w=F.wokeOne;return [[
    w==='dayo'?"Dayo gasps like a man surfacing from a deep lake. Sela holds his face and says his name, over and over, until he says hers back.":w==='lena'?"Lena wakes with a sob and grabs your wrist so hard it bruises. \"Mara,\" she says. \"Is Mara okay? Did she stop paying them?\"":"A speaker crackles to life above the rows. A man's voice, warm and amused, everywhere at once.",
    w?"\"I was up there,\" the sleeper whispers. \"In the weather. We all are. You can feel the whole city from the clouds. And there's someone else up there with us. Someone who isn't asleep like we are. He decides.\"":"\"Visitors. How unusual. Most people only come down here in a box.\"",
    w?"\"He calls himself the Chairman. Aurelian Orrin. He went into a pod twelve years ago when his body gave out. He never came out. He just... stayed. In the canopy. Running the company from inside the rain.\"":"\"I am Aurelian Orrin. My body died twelve years ago. My board never noticed. Why would they? The dividends kept coming.\"",
    "Mr. Orrin doesn't take walk-ins. He doesn't take anything. He gives. The receptionist wasn't joking. She just didn't know what she was saying.",
    w?"\"If you want to stop him, you have to go up. The sky terrace. There's a maintenance pillar where the canopy touches the tower. He'll talk to you there. He loves to talk.\"":"\"Come up to the terrace sometime. We'll talk about the weather.\""],
   [{t:'"We\'re going up."',fx:()=>note('Twist: Aurelian Orrin died twelve years ago and lives on inside the canopy, running Orrin Mutual from the weather. He waits at the sky terrace pillar.'),adv:1}]];}}
 ],done:()=>{G.leaveNode&&G.leaveNode();G.chapter('Act Four complete','The man who owns the rain has been dead for twelve years.');setTimeout(()=>{G.chapter('Act Five','The Weather Over Veyra');G.start('m11');},4200);}},
 // ================= ACT FIVE · THE WEATHER OVER VEYRA =================
 m11:{t:'Choose Your Storm',main:1,ch:5,steps:[
  {d:'Decide who walks into Orrin Tower with you (talk to Dess)',at:'dess',on:'talk:dess',say:()=>{const t=S.rep||{};const o=[];
    if((t.tide||0)>=3||(G.gang&&G.gang.rank()>0))o.push({t:'Bring the Ashline Tide. Hesk owes the sleepers',fx:()=>{flag('crew','tide');R('tide',2);R('wardline',-1);},adv:1});
    if((t.wardline||0)>=3||relv('ilse')>=6)o.push({t:'Bring Ilse and the honest part of the Wardline',fx:()=>{flag('crew','wardline');R('wardline',2);R('tide',-1);},adv:1});
    if((t.civ||0)>=3||relv('benny')>=6)o.push({t:'Bring the street: Benny, Kip, Sela, and Juno on the screens',fx:()=>{flag('crew','civ');R('civ',2);},adv:1});
    o.push({t:F.maraBadge?'Go quiet. Mara\'s badge, the service lift, no one else':'Go alone. Quietly',fx:()=>flag('crew','alone'),adv:1});
    return [[
    "So. You're going to go and argue with the weather.",
    "You can't walk in there alone and expect to walk out. Who's standing behind you? The ones you've helped. The ones who owe you. That's all power ever is in this city.",
    o.length===1?"Nobody's lined up yet. Help the Tide, the Wardline or the street, and they'll come when you call. Or go now, alone, and trust your feet.":"Choose. And then don't look back. Looking back is how you slip on wet stairs."],o];}},
  {d:'Get past the Orrin Tower lobby in Crown Heights',at:[0,-276],on:'staff:Receptionist',say:()=>{const c=F.crew;return [[
    c==='tide'?"Forty dockworkers in rain shells file into the marble lobby behind you, dripping on everything. Hesk lights a cigarette under the NO SMOKING sign. The receptionist stops smiling.":c==='wardline'?"Ilse walks in ahead of you, badge up, six officers behind her who've decided tonight their sergeant can file his own reports. \"Wardline. Nobody touch the phones.\"":c==='civ'?"Benny parks his dumpling cart across the revolving door. Every courier screen in the lobby flickers to a duck sticker. Juno's voice on the speakers: \"Delivery for Mr. Orrin. Signature required.\"":"You swipe Mara's badge at the service gate. Green light. The receptionist doesn't even look up.",
    "\"The terrace elevator is... that way,\" the receptionist says faintly. \"He said you'd come. He said to tell you he's looking forward to it.\""],
   [{t:'Head for the elevators',adv:1}]];}},
  {d:'Ride up to the sky terrace and find the maintenance pillar',at:[-1.5,-273.5],on:'interact:r5pillar',say:()=>[[
    "The pillar is cold brushed steel, beaded with rain that falls nowhere else in Crown. You lay your palm on it. The rain around the terrace stops in mid-air. Every drop, hanging, catching the neon.",
    "\"There you are.\" The voice comes from the rain itself. \"Dess's family. You have her jaw. Stubborn. She drew me a beautiful canopy, you know. I only improved the distribution.\"",
    "\"Let me save you the speech. You think I'm a monster. I think I'm a utility. Water goes somewhere. It always has. I decided where. I made Crown a place where children could play outside. That's not nothing.\"",
    "\"The sleepers? They chose debt. I gave them a way to pay that doesn't hurt. They dream of the whole city, from above. Ask them if they'd rather be awake in Saltgate.\"",
    "\"Here is what you can do. Shut me off and the canopy falls, everyone is woken at once, and some of them will not survive waking. Or take my chair. Or give the weather to your friends and watch what they do with it. Choose. I've waited twelve years for someone interesting.\""],
   [{t:'Reach for the canopy controls',adv:1}]]},
  {d:'Decide the weather over Veyra',at:[-1.5,-273.5],on:'interact:r5pillar',say:()=>{const c=F.crew,t=S.rep||{};const o=[];
    o.push({t:'Shut him down. Open the sky, wake every sleeper',fx:()=>G.endGame('open'),adv:1});
    if(F.dessForgive>=0.5||relv('dess')>=6)o.push({t:'Restore Dess\'s design. Thin, fair rain for everyone',fx:()=>G.endGame('fair'),adv:1});
    if(c==='tide')o.push({t:'Give the weather to the Ashline Tide',fx:()=>G.endGame('tide'),adv:1});
    if(c==='wardline')o.push({t:'Hand the pillar to Ilse. Arrest a dead man, and his board',fx:()=>G.endGame('law'),adv:1});
    if((t.orrin||0)>=3||F.ledger==='mara')o.push({t:'Take the Chairman\'s seat',fx:()=>G.endGame('chair'),adv:1});
    return [["The drops hang in the air, waiting. Somewhere far below, a hundred thousand people are walking home in the rain without knowing that it's a choice.","Your hand is on the pillar. It's warm, like the pod glass was warm."],o];}}
 ],done:()=>{}},
 m12:{t:'After the Rain',main:1,ch:5,steps:[{d:'Go home to the Ladle and talk to Dess',at:'dess',on:'talk:dess',say:()=>G.epilogue()}],done:()=>{G.chapter('The End','Veyra keeps going. So do you. The city is yours to walk.');F.finished=1;}}
 };}
// ---------- endings ----------
export const ENDINGS={
 open:{t:'Everyone Gets Wet',card:'The canopy falls. For the first time in thirty-one years, it rains on Crown Heights.',
  pillar:["You push. The pillar groans. Above the tower the canopy tears like wet paper, and the hanging rain falls all at once, everywhere, on everyone.","\"Oh,\" says the Chairman, sounding almost delighted. \"Oh, that's cold.\" And then he is just weather again, and then he is nothing.","Across the city, eleven hundred pods open. Sela's clinic fills by dawn. Not everyone wakes. Most do."],
  dess:"It rained on the Orrin Tower this morning. I watched a banker try to use his briefcase as an umbrella. I'm not proud of how long I laughed."},
 fair:{t:'Fair Weather',card:'Dess\'s canopy is restored. A little less rain, for everyone.',
  pillar:["You don't tear it down. You find the line the board changed, thirty-one years ago, and you change it back.","The sleepers are released in waves, gently, the way Sela would want. The canopy hums on solar and silicon, thinner, weaker, fairer.","\"Her design,\" the Chairman says, quieter now. \"I always thought it was too kind to work.\" He fades into a drizzle that falls evenly on everyone."],
  dess:"Same rain. Less of it. You can see the towers some nights now. That's my drawing up there, finally doing what it was for. Thank you, kid. I mean it."},
 tide:{t:'Tide Rising',card:'The Ashline Tide owns the weather now. Dry days are for sale.',
  pillar:["You hand the pillar to Hesk. He stares at it like a man handed a live fish.","By morning the docks are dry and Crown is soaked. By the end of the week the Tide is selling sunny afternoons by the hour.","The sleepers are woken. Hesk insisted on that. Whatever else he is, he remembers a woman in a paper gown asking what year it was."],
  dess:"Hesk runs the clouds and charges Crown for sunshine. Is it justice? It's at least a different kind of weather. Watch him, kid. Power rusts people faster than salt."},
 law:{t:'Due Process',card:'The board of Orrin Mutual is arrested. The canopy is seized as evidence.',
  pillar:["Ilse cuffs the pillar. It's absurd and she knows it and she does it anyway, with a straight face, reading a dead man his rights while the rain hangs listening.","The board is arrested by noon. The canopy is placed in Wardline custody and switched to standby. The sleepers come home through the courts, slowly, with paperwork.","It isn't fast. It isn't beautiful. But it holds."],
  dess:"Ilse got her sergeant, the board, and a commendation she tried to refuse. The pods come up a hundred a week, signed and stamped. Slow justice. Still justice."},
 chair:{t:'The New Weather',card:'You take the Chairman\'s seat. The rain answers to you now.',
  pillar:["You close your eyes. When you open them, you are looking down at Veyra from the clouds, every street at once, every umbrella, every puddle.","\"Welcome,\" the Chairman says, and then you push him out, gently, like closing a door, and the canopy is yours.","The sleepers go on sleeping. You tell yourself it's temporary. You tell yourself a lot of things, from up here."],
  dess:"You're different. You look at the sky like you're checking on it. I don't know who's running the rain now, and I'm frightened that I do."}
};
