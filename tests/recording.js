import recorder from 'node-record-lpcm16';
import fs from 'fs';

const file = fs.createWriteStream('tests/test.wav', { encoding: 'binary' })

const recording = recorder.record({
  sampleRate: 44100
})

recording.stream()
.pipe(file)


// Stop recording after three seconds
setTimeout(function () {
  recording.stop();
  file.close();
}, 10000);