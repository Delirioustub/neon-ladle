import json,subprocess,soundfile as sf,numpy as np,os
from kokoro_onnx import Kokoro
k=Kokoro('kokoro-v1.0.int8.onnx','voices-v1.0.bin')
V={'mara':(['af_nicole','bf_emma'],[.6,.4],0.95,'en-us',''),
   'sela':(['af_heart'],[1],0.97,'en-us',''),
   'ilse':(['bf_isabella','af_kore'],[.6,.4],1.02,'en-gb',''),
   'kip':(['am_puck'],[1],1.1,'en-us',''),
   'dess':(['bf_alice','bf_lily'],[.5,.5],0.86,'en-gb',',asetrate=24000*0.94,aresample=24000,atempo=1.064'),
   'juno':(['am_echo'],[1],0.95,'en-us',',chorus=0.6:0.9:25:0.4:0.25:2,aecho=0.8:0.6:12:0.25'),
   'benny':(['am_onyx','am_fenrir'],[.5,.5],0.98,'en-us','')}
def voice(names,w):
    return sum(k.get_voice_style(n)*x for n,x in zip(names,w))
L=json.load(open('final.json'))
for i,l in enumerate(L):
    o=f"out/{l['id']}.mp3"
    if os.path.exists(o):continue
    n,w,sp,lang,flt=V[l['sp']]
    a,sr=k.create(l['t'],voice=voice(n,w),speed=sp,lang=lang)
    sf.write('/tmp/x.wav',a,sr)
    subprocess.run(['ffmpeg','-loglevel','error','-y','-i','/tmp/x.wav','-af','highpass=f=70'+flt+',loudnorm=I=-18:TP=-2','-ac','1','-ar','22050','-c:a','libmp3lame','-b:a','32k',o],check=True)
    print(i,l['sp'],flush=True)
