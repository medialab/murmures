import fs from 'node:fs';
import { spawn } from 'node:child_process';
import config from "../config.json" with {type: "json"};

// const outputPath = 'tests/recordtest.wav';
// const durationSeconds = 10;

const device = `plughw:${config.recordCard},0`;

// fs.mkdirSync('tests', { recursive: true });

export const createRecording = (outputPath) => {
  if (process.platform === 'linux') {
    const file = fs.createWriteStream(outputPath);

    const args = [
      '-D', device,
      '-f', 'S16_LE',
      '-r', '16000',
      '-c', '1',
      '-t', 'wav',
      // '-d', String(durationSeconds),
      '-'
    ];

    console.log(`Recording from ${device} to ${outputPath}...`);

    const rec = spawn('arecord', args, {
      stdio: ['ignore', 'pipe', 'pipe'],
    });

    rec.stdout.pipe(file);

    rec.stderr.on('data', (chunk) => {
      process.stderr.write(chunk);
    });

    rec.on('error', (error) => {
      console.error('Impossible de lancer arecord:', error);
      file.close();
      process.exit(1);
    });

    rec.on('close', (code) => {
      file.close();

      if (code === 0) {
        console.log(`Recording saved to ${outputPath}`);
      } else {
        console.error(`arecord exited with code ${code}`);
        process.exit(code);
      }
    });
    return {
      stop: () => {
        rec.kill();
        file.close();
      }
    }
  } else {
    const file = fs.createWriteStream(outputPath, { encoding: 'binary' })
    const recording = recorder.record({
      // sampleRate: 44100,
      // recorder: process.platform === 'linux' ? 'arecord' : undefined,
      // device: `plughw:${config.recordCard},0`,
      // sampleRate: 16000,
      // channels: 1,
      // audioType: 'wav',
      // threshold: 0,
      // verbose: true,
    })
    recording.stream()
      .pipe(file);
    return recording;
  }
}