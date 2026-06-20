// import p from 'play-sound';

// const player = p({
//   player: process.platform === "linux" ? "aplay" : undefined,
//   aplay: process.platform === "linux" ? ['-D', 'plughw:2,0'] : undefined
// })
// console.log(player)

// // sound.play('tests/test.wav')
// var audio = player.play('tests/test.wav', function(err){
//   if (err && !err.killed) throw err
// })

import play from "../lib/player.js";

const audio = await play("tests/test.wav")
console.log(audio)
setTimeout(() => audio.kill(), 4000)