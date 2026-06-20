import fs, { exists } from 'fs-extra';
import fm from 'front-matter';
import recorder from 'node-record-lpcm16';
import colors from 'colors';
import { getAudioDurationInSeconds } from 'get-audio-duration';

import config from "./config.json" with {type: "json"};

import { startKeyboardListener } from "./lib/keyboardListener.js";
import { createRecording } from './lib/recorder.js';
import player from './lib/player.js'
import { jsToFrontMatter, discoverStories } from './lib/misc.js';
import transcriber from './lib/transcriber.js';
import { printPrivatePart } from './lib/printer.js';
import {
  MODES,
  STATUSES,
  KEYS_MAP,
  KEYS_MAN
} from './constants.js'

const { readdir, statSync, readFileSync, existsSync, ensureDir, writeFile, remove } = fs;

const USE_PRINTER = true;

const reverseKeysMap = Object.entries(KEYS_MAP).reduce((res, [key, val]) => ({ ...res, [val]: key }), {})

const printMan = () => {
  console.log(colors.bgGreen('Nos quotidiens numériques'));
  console.log(colors.bgBlue('Mode d\'emploi :i'));
  console.log(colors.blue(
    Object.entries(KEYS_MAP)
      .map(([mode, key]) => {
        const expl = KEYS_MAN[mode];
        return `${key}: ${expl}`
      }).join('\n')
  )
  )
  console.log(colors.blue('==='));

}
printMan();

const allStories = await discoverStories();

/**
 * STATE VARIABLES
 */
let state = {
  activeMode: MODES.PLAYING,
  isActive: false,
  previousMode: undefined,
  player: undefined,
  availableStories: [...allStories.filter(f => f.status === STATUSES.SHAREABLE)],
  freshRecordMode: false,
  recording: undefined,
  activeRecordingFolderName: undefined
}
// console.log('active mode: ', state.activeMode);

const setActiveMode = (mode) => {
  const modeLabels = {
    STANDBY: 'en attente',
    RECORDING: 'enregistrement',
    PLAYING: 'écoute',
    REPLAYING: 'réécoute'
  }
  console.log(colors.bgBlue('mode actif : ' + modeLabels[mode]));
  state = {
    ...state,
    activeMode: mode,
    previousMode: mode
  }
}
const setPlayer = (player) => {
  // console.log('set player', player);
  state = {
    ...state,
    player
  }
}


const listener = await startKeyboardListener({
  devicePath: process.platform === "linux" ? config.keyboardDevice || process.env.KEYBOARD_DEVICE : undefined,

  onKey(e) {
    return new Promise(async () => {
      console.log({
        key: e.key,
        state: e.state,
        code: e.code,
        source: e.source,
      });

      if (e.key === "ESCAPE" && e.state === "DOWN") {
        console.log("Arrêt.");
        listener.stop();
        process.exit(0);
      }
      const { activeMode } = state;
      if (e.state === 'UP' && reverseKeysMap[e.key]) {

        const action = reverseKeysMap[e.key];
        switch (action) {
          case 'HANGON':
            if (state.isActive) {
              console.log('combiné raccroché')
              // setActiveMode(MODES.STANDBY);
              if (state.player) {
                await state.player.kill();
              }
              if (state.recording) {
                console.log(`arrêt de l'enregistrement`);
                await state.recording.stop();
                state.recording = undefined;
                console.log(`début de la transcription`);
                const audioPath = `stories/${state.activeRecordingFolderName}/audio.wav`;
                const duration = await getAudioDurationInSeconds(audioPath);
                const { transcription = '' } = await transcriber(audioPath);
                await fs.writeFile(`stories/${state.activeRecordingFolderName}/_transcription_auto.txt`, transcription.trim(), 'utf8')
                await fs.writeFile(`stories/${state.activeRecordingFolderName}/transcription_partageable.txt`, transcription.trim(), 'utf8')
                const metadata = fm(fs.readFileSync(`stories/${state.activeRecordingFolderName}/metadata.md`, 'utf8')).attributes;
                metadata.duration = duration;
                await writeFile(`stories/${state.activeRecordingFolderName}/metadata.md`, jsToFrontMatter(metadata), 'utf8');
                if (USE_PRINTER) {
                  console.log(colors.green('impression du résultat'));
                  printPrivatePart(metadata, transcription.trim());
                }

                printMan();
                state.freshRecordMode = true;
              }
              state.isActive = false;
            } else {
              console.log('combiné décroché')
              state.isActive = true;
              if (activeMode === MODES.STANDBY) {
                setActiveMode(MODES.PLAYING);
              }
              if (activeMode === MODES.PLAYING || activeMode === MODES.STANDBY) {
                if (!allStories.length) {
                  console.log(colors.red('No stories to play'));
                  return;
                }
                if (state.availableStories.length === 0) {
                  state.availableStories = [...allStories.filter(f => f.status === STATUSES.SHAREABLE)];
                }

                const randomStoryIndex = parseInt(Math.random() * state.availableStories.length);
                const storyToPlay = state.availableStories[randomStoryIndex];
                // console.log(storyToPlay)
                state.availableStories = state.availableStories.filter((_s, i) => i !== randomStoryIndex);
                if (state.player) {
                  state.player.kill();
                }
                const storyPlayer = await player(`${storyToPlay.basePath}/audio.wav`);
                setPlayer(storyPlayer);
                console.log(`lecture de l'histoire ${storyToPlay.id} (${storyToPlay.title}) – ${parseInt(storyPlayer.duration)} secondes`);
                await new Promise((resolve) => {
                  setTimeout(() => {
                    resolve();
                  }, storyPlayer.duration * 1000)
                });
                console.log('histoire finie')
                // @todo système de réponse
                // if (state.isActive) {
                //     if (state.player) {
                //     state.player.kill();
                //   }
                //   console.log(`message de fin`);
                //   const msg = await player('resources/nqn_fin_histoire.wav');
                //   setPlayer(msg);
                //   await new Promise((resolve) => {
                //     setTimeout(() => {
                //       resolve();
                //     }, msg.duration * 1000)
                //   })
                //   console.log('la suite')
                // }

              } else if (activeMode === MODES.REPLAYING) {
                if (state.freshRecordMode && state.activeRecordingFolderName) {
                  const draft = await player(`stories/${state.activeRecordingFolderName}/audio.wav`);
                  setPlayer(draft);
                  console.log('lecture du replay d\'une durée de ', draft.duration);
                  await new Promise((resolve) => {
                    setTimeout(() => {
                      resolve();
                    }, draft.duration * 1000)
                  });
                  printMan();
                }
              } else if (activeMode === MODES.RECORDING) {
                const stories = await discoverStories();

                const highestId = stories.length ? Math.max(...stories.map(a => +a.id)) : -1;
                const id = (highestId + 1 + '').padStart(3, "0");

                const intro = await player('resources/nqn_avant_enregistrement.wav');
                setPlayer(intro);
                console.log(colors.green(`lecture de l'intro de ${parseInt(intro.duration)} s`));
                await new Promise((resolve) => {
                  setTimeout(() => {
                    resolve();
                  }, intro.duration * 1000 - 2 * 1000)
                })
                console.log(`début de l'enregistrement`);

                const dateRedux = new Date().toISOString().split('T')[0].replace(/-/g, '');
                console.log(dateRedux);
                console.log('id', id)
                const folderName = `${id}_${dateRedux}`;
                await ensureDir(`stories/${folderName}`);
                const metadata = {
                  date: new Date().toISOString(),
                  id,
                  duration: '',
                  title: '',
                  status: STATUSES.PRIVATE
                }
                await writeFile(`stories/${folderName}/metadata.md`, jsToFrontMatter(metadata), 'utf8');
                const recording = createRecording(`stories/${folderName}/audio.wav`);

                // const file = fs.createWriteStream(`stories/${folderName}/audio.wav`, { encoding: 'binary' })
                // const recording = recorder.record({
                //   // sampleRate: 44100,
                //   recorder: process.platform === 'linux' ? 'arecord' : undefined,
                //   device: `plughw:${config.recordCard},0`,
                //   sampleRate: 16000,
                //   channels: 1,
                //   audioType: 'wav',
                //   threshold: 0,
                //   verbose: true,
                // })
                // recording.stream()
                //   .pipe(file);
                state.recording = recording;
                state.activeRecordingFolderName = folderName;
              }
            }
            break;
          case 'PLAYMODE':
            setActiveMode(MODES.PLAYING);
            break;
          case 'RECMODE':
            setActiveMode(MODES.RECORDING);
            break;
          case 'REPLAYMODE':
            setActiveMode(MODES.REPLAYING);
            break;
          case 'DELETE':
            if (state.freshRecordMode && state.activeRecordingFolderName) {
              console.log(`suppression du dossier ${state.activeRecordingFolderName}`)
              await remove(`stories/${state.activeRecordingFolderName}`)
              state.freshRecordMode = undefined;
              state.activeRecordingFolderName = undefined;
            }
            break;
          default:
            break;
        }
      }
    })

  },
});

process.stdin.resume();
