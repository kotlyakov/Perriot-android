import {spawnSync} from 'node:child_process';
import {createRequire} from 'node:module';
import {dirname} from 'node:path';
import {fileURLToPath} from 'node:url';

const require=createRequire(import.meta.url);
const modulePath=require.resolve(process.env.PLAYWRIGHT_MODULE??(process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES?process.env.CODEX_PRIMARY_RUNTIME_NODE_MODULES+'/playwright':'playwright'));
const {chromium}=require(modulePath);
// Older checks use this variable as a module directory, not a runtime API.
const env={...process.env,PLAYWRIGHT_MODULE:modulePath,CODEX_PRIMARY_RUNTIME_NODE_MODULES:dirname(dirname(modulePath)),CHROMIUM_PATH:process.env.CHROMIUM_PATH||chromium.executablePath()};
const suites=['arcana-pack','effect-mechanism','scored-retrigger','playing-card-identity','joker-cashout','joker-deck-money','wheel-polychrome','generated-tarots','strength-suit-tarots','hanged-death-card','devil-gold-card','tower-stone-card','justice-glass-card','chariot-steel-card','lovers-wild-card','magician-lucky-card','targeted-enhancement-tarots','fool-tarot','enter-run-race','targetless-tarots','celestial-pack','planet-consumables','expanded-boss','showdown-selection','victory-endless','feedback','next-ante','boss-flow','shop-return','shop','start-screen','browser','score-flow','card-visual','mobile-layout','deck-reference','typography','hand-gap','cashout-flow','cashout-review045','shop-state','blind-selection-state'];
for(const suite of ['item7b','item7a',...suites]){
  console.log('UI suite: '+suite);
  const result=spawnSync(process.execPath,['scripts/check-ui.mjs'],{cwd:fileURLToPath(new URL('../',import.meta.url)),env:{...env,UI_CHECK_SCRIPT:'tests/ui/'+suite+'-check.mjs'},stdio:'inherit'});
  if(result.error)throw result.error;
  if(result.status!==0)process.exit(result.status??1);
}




