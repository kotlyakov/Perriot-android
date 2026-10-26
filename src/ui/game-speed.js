export const GAME_SPEEDS=[.5,1,2,4];
let speed=1;
try{const saved=Number(globalThis.CardStorage?globalThis.CardStorage.read('game-speed'):globalThis.localStorage?.getItem('pierrot.game-speed'));if(GAME_SPEEDS.includes(saved))speed=saved;}catch{}
export const getGameSpeed=()=>speed;
export function setGameSpeed(value){
 if(!GAME_SPEEDS.includes(value))throw Error('Недопустимая скорость');
 if(globalThis.CardStorage){if(globalThis.CardStorage.writeGameSpeed(String(value))!==true)throw Error('Game speed write failed');}
 else globalThis.localStorage?.setItem('pierrot.game-speed',String(value));
 speed=value;return speed;
}
// Presentation timing only: rules, RNG, audio pitch and window motion stay independent.
export const gameDuration=ms=>ms/speed;


// Reading has a perceptual floor even when physical card flights run at 4×.
export const scorePopDuration=()=>Math.max(600,gameDuration(600));
export const scoreEventDuration=ms=>Math.max(180,gameDuration(ms));
