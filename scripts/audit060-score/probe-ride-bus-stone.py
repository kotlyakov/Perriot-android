"""Run original APK callback privately; compare raw Stone getter chronology to JS."""
import ast,json,os,pathlib,subprocess,tempfile,zipfile
root=pathlib.Path(__file__).resolve().parents[2]
p=ast.parse((root/'scripts/reference-rng/generate-item7-fixtures.py').read_text())
harness=next(ast.literal_eval(n.value) for n in p.body if isinstance(n,ast.Assign) and isinstance(n.targets[0],ast.Name) and n.targets[0].id=='harness').split('local independent=')[0]
apk=pathlib.Path(os.environ.get('BALATRO_APK',root.parent/'project_sources/01-Balatro_1.0.1n_0.4_25_noPairip.apk'))
with zipfile.ZipFile(apk) as z: card,game,misc=[z.read('assets/'+n).decode().replace('\r\n','\n') for n in ['card.lua','game.lua','functions/misc_functions.lua']]
i=game.index('self.P_CENTERS = self.P_CENTERS or {');j=game.index('\n    }',i)+6
centers='local self={FTP_LOCKED=false}\n'+game[i:j]+'\nlocal centers=self.P_CENTERS\n'
probe='''
reset({});local bus=joker('j_ride_the_bus',false)
local cards={playing(11,'Hearts'),playing(5,'Spades','stone')}
G.hand.cards=cards
local draws=0;local original=math.random
math.random=function(lo,hi)if lo==100 and hi==1000000 then draws=draws+1 end return original(lo,hi)end
bus:calculate_joker({cardarea=G.jokers,before=true,scoring_hand=cards,full_hand=cards,poker_hands={},scoring_name='High Card'})
print(json({stoneGetterDraws=draws,mult=bus.ability.mult}))
'''
with tempfile.NamedTemporaryFile('w',suffix='.lua') as f:
 f.write('Moveable={extend=function()return {}end}\n'+card+'\n'+misc+'\n'+centers+harness+probe);f.flush()
 native=json.loads(subprocess.check_output([os.environ.get('NATIVE_LUAJIT',os.environ.get('LUAJIT_BIN','luajit')),f.name],text=True))
js="""import {item7BeforeScore} from './src/core/joker-score-effects.js';
const cards=[{id:'face',rank:11,suit:'hearts'},{id:'stone',rank:5,suit:'spades',enhancement:'stone'}];
const state={jokers:[{id:'bus',entityId:'j_ride_the_bus',mult:3}]};let draws=0;
item7BeforeScore(state,{handId:'high_card',playedCards:cards,scoringCards:cards,rankGetter:c=>c.enhancement==='stone'?(draws++,-123):c.rank});
console.log(JSON.stringify({stoneGetterDraws:draws,mult:state.jokers[0].mult}));"""
actual=json.loads(subprocess.check_output(['node','--input-type=module','-e',js],cwd=root,text=True))
print(json.dumps({'native':native,'actual':actual},indent=2))
assert native['stoneGetterDraws']==1 and actual['stoneGetterDraws']==0
