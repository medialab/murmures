import p from 'play-sound';

const player = p()
console.log(player)

// sound.play('tests/test.wav')
var audio = player.play('tests/test.wav', function(err){
  if (err && !err.killed) throw err
})

setTimeout(() => audio.kill(), 4000)