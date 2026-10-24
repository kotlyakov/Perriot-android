import {readFile,writeFile} from 'node:fs/promises';
const source=await readFile('src/ui/menu-windows.js','utf8');
const helpers=source.slice(source.indexOf('const el='),source.indexOf('export function handInfoRows'));
const tabs=source.slice(source.indexOf('export function tabbedWindow'),source.indexOf('// Source structure')).replace('export ','');
const settings=source.slice(source.indexOf('export function createSettingsView'),source.indexOf('export function createRunInfoView')).replace('export ','');
const paper=(await readFile('src/ui/settings-paper.js','utf8')).replace('export ','');
const font=(await readFile('web/fonts/Rubik.ttf')).toString('base64');
const css=await readFile('web/window-review.css','utf8');
const markup=`<div id="pierrot-settings-visible" class="viz-dotted-background">
<style>
@font-face{font-family:Rubik;src:url(data:font/ttf;base64,${font})}
${css}
#pierrot-settings-visible{box-sizing:border-box;padding:16px 8px;font-family:Rubik,sans-serif;color:#f0e5c8}
#pierrot-settings-visible dialog.menu-dialog{display:block;position:relative;inset:auto;margin:0 auto;transform:none;width:100%;max-width:700px;box-sizing:border-box;padding:14px}
#pierrot-settings-visible .menu-window-tabs{margin-bottom:24px}
#pierrot-settings-visible .native-settings{min-height:160px;box-sizing:border-box;padding:14px 8px}
#pierrot-settings-visible .settings-speed,#pierrot-settings-visible .settings-row{width:100%;max-width:550px;box-sizing:border-box}
#pierrot-settings-visible #dialog-body{padding:14px;min-height:0}
#pierrot-settings-visible .settings-speed-track{gap:12px}
#pierrot-settings-visible .settings-speed-track button{height:48px;font-size:22px}
#pierrot-settings-visible input[type=range]{accent-color:#f59b05;touch-action:pan-y}
#pierrot-settings-visible #dialog-actions{display:none}
@media(max-width:420px){#pierrot-settings-visible{padding:10px 2px}#pierrot-settings-visible dialog.menu-dialog{padding:10px;border-width:4px}#pierrot-settings-visible #dialog-body{padding:10px}#pierrot-settings-visible .menu-window-tabs button{font-size:20px}#pierrot-settings-visible .settings-speed-track{gap:8px}}
</style>
<dialog open class="menu-dialog" data-window="settings" aria-label="Настройки"><div id="dialog-body">
<section class="menu-window"><nav class="menu-window-tabs"><button aria-selected="true">Игра</button><button aria-selected="false">Звук</button></nav><div class="menu-window-content native-settings"><div class="settings-speed"><span>Скорость игры</span><div class="settings-speed-track"><button aria-pressed="false">0,5×</button><button aria-pressed="true">1×</button><button aria-pressed="false">2×</button><button aria-pressed="false">4×</button></div></div></div></section>
</div></dialog>
<script>
(()=>{const root=document.getElementById('pierrot-settings-visible');const GAME_SPEEDS=[.5,1,2,4];let speed=1;const getGameSpeed=()=>speed,setGameSpeed=value=>speed=value;
${helpers}
${paper}
${tabs}
${settings}
root.querySelector('#dialog-body').replaceChildren(createSettingsView());})();
</script>
</div>`;
await writeFile('/workspace/pierrot-settings-paper.html',markup);
new Function(markup.match(/<script>([\s\S]*?)<\/script>/)[1]);console.log('Settings preview generated; script syntax PASS');
