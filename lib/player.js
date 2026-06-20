import p from 'play-sound';
import {getAudioDurationInSeconds} from 'get-audio-duration';

const playerLib = p({
  player: process.platform === "linux" ? "aplay" : undefined,
  aplay: process.platform === "linux" ? ['-D', 'plughw:2,0'] : undefined
});

export default async function playFile(path) {
  const duration = await getAudioDurationInSeconds(path);
    // sound.play('tests/test.wav')
  const audio = playerLib.play(path, function(err){
    if (err && !err.killed) throw err
  })
  return {
    duration,
    kill: () => audio.kill()
  }
}