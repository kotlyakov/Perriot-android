import test from 'node:test';
import assert from 'node:assert/strict';
import {cardFlightDuration,shardFrames} from '../../src/ui/card-motion.js';
test('card flights respond to distance with bounded duration',()=>{
 assert.ok(cardFlightDuration(100)<cardFlightDuration(600));
 assert.equal(cardFlightDuration(0),180);assert.equal(cardFlightDuration(5000),480);
});
test('shatter pieces have distinct deterministic ballistic paths without random draws',()=>{
 const paths=Array.from({length:12},(_,i)=>shardFrames(i));
 assert.equal(new Set(paths.map(p=>p.at(-1).translate)).size,12);
 assert.ok(paths.every(p=>p.at(-1).opacity===0));
 assert.deepEqual(paths[3],shardFrames(3));
});
