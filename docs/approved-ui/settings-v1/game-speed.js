export const GAME_SPEEDS=[.5,1,2,4];
let speed=1;
try{const saved=Number(globalThis.localStorage?.getItem('pierrot.game-speed'));if(GAME_SPEEDS.includes(saved))speed=saved;}catch{}
export const getGameSpeed=()=>speed;
export function setGameSpeed(value){
 if(!GAME_SPEEDS.includes(value))throw Error('Недопустимая скорость');
 globalThis.localStorage?.setItem('pierrot.game-speed',String(value));speed=value;return speed;
}
// Presentation timing only: rules, RNG, audio pitch and window motion stay independent.
export const gameDuration=ms=>ms/speed;
