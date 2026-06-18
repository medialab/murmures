import fs from 'node:fs';
import path from 'node:path';
import { performance } from 'node:perf_hooks';
import { pipeline, env } from '@huggingface/transformers';

import pkg from 'wavefile';
const { WaveFile } = pkg;
// Dossier racine contenant ./Xenova/whisper-small
env.localModelPath = path.resolve('./models');

// Interdit tout téléchargement distant.
// Si un fichier manque localement, le script échouera au lieu de télécharger.
env.allowRemoteModels = false;
env.allowLocalModels = true;

const modelName = 'Xenova/whisper-small';

function loadWavAsFloat32Mono(filePath) {
  if (!fs.existsSync(filePath)) {
    throw new Error(`Fichier introuvable : ${filePath}`);
  }

  const buffer = fs.readFileSync(filePath);
  const wav = new WaveFile(buffer);

  // Whisper attend un signal mono float32 à 16 kHz.
  wav.toBitDepth('32f');
  wav.toSampleRate(16000);

  let samples = wav.getSamples();

  // Si le WAV est stéréo, on mélange en mono.
  if (Array.isArray(samples)) {
    const channels = samples;
    const length = channels[0].length;
    const mono = new Float32Array(length);

    for (let i = 0; i < length; i++) {
      let sum = 0;
      for (const channel of channels) {
        sum += channel[i];
      }
      mono[i] = sum / channels.length;
    }

    return mono;
  }

  return samples;
}

export default async function main(inputPath) {
  const resolvedPath = path.resolve(inputPath);

  console.log(`Audio : ${resolvedPath}`);
  console.log(`Modèle local : ${path.join(env.localModelPath, modelName)}`);
  console.log('Chargement du modèle local...');

  const transcriber = await pipeline(
    'automatic-speech-recognition',
    modelName
  );

  console.log('Lecture et conversion du WAV...');
  const audioData = loadWavAsFloat32Mono(resolvedPath);

  console.log('Transcription...');
  const start = performance.now();

  const result = await transcriber(audioData, {
    language: 'french',
    task: 'transcribe',
    return_timestamps: true,
    // Découpe l’audio long en segments de 30 secondes
    chunk_length_s: 30,
    // Chevauchement entre segments pour éviter les coupures de mots/phrases
    stride_length_s: 5,
  }); 

  const duration = ((performance.now() - start) / 1000).toFixed(2);

  console.log('\n--- TRANSCRIPTION ---\n');
  console.log(result.text);

  // if (result.chunks?.length) {
  //   console.log('\n--- TIMESTAMPS ---\n');

  //   for (const chunk of result.chunks) {
  //     const [start, end] = chunk.timestamp;
  //     console.log(`[${start}s → ${end}s] ${chunk.text}`);
  //   }
  // }

  console.log(`\nTerminé en ${duration}s`);
  return {
    transcription: result.text
  }
}