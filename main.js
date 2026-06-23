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
import store, { PRESS_ESC, PRESS_PLAY, PRESS_DELETE, PRESS_REC, PRESS_REPLAY, SET_PHONE_IS_ACTIVE } from './app.js';

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
      const state = store.getState();

      if (e.key === "ESCAPE" && e.state === "DOWN") {
        store.dispatch({type: PRESS_ESC});
      }
      const { phoneIsActive } = state;
      if (e.state === 'UP' && reverseKeysMap[e.key]) {

        const action = reverseKeysMap[e.key];
        switch (action) {
          case 'HANGON':
            if (state.phoneIsActive) {
              console.log('ça raccroche');
              store.dispatch({type: SET_PHONE_IS_ACTIVE, payload: false});
            } else {
              console.log('ça décroche')
              store.dispatch({type: SET_PHONE_IS_ACTIVE, payload: true});
            }
            break;
          case 'PLAYMODE':
            store.dispatch({type: PRESS_PLAY});
            break;
          case 'RECMODE':
            store.dispatch({type: PRESS_REC});
            break;
          case 'REPLAYMODE':
            store.dispatch({type: PRESS_REPLAY});
            break;
          case 'DELETE':
            store.dispatch({type: PRESS_DELETE});
            break;
          default:
            break;
        }
      }
    })

  },
});

process.stdin.resume();
