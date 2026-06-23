import { createStore } from "redux";
import fs from 'fs-extra';
import fm from 'front-matter';
import recorder from 'node-record-lpcm16';
import colors from 'colors';
import { getAudioDurationInSeconds } from 'get-audio-duration';

import player from './lib/player.js'
import { createRecording } from './lib/recorder.js';
import { jsToFrontMatter, discoverStories } from "./lib/misc.js";
import transcriber from './lib/transcriber.js';
import { printPrivatePart } from './lib/printer.js';

import { PHONE_MODES, PHONE_STATUSES, STATUSES } from "./constants.js";
import config from "./config.json" with {type: "json"};

const { writeFileSync, ensureDirSync, readdir, statSync, readFileSync, existsSync, ensureDir, writeFile, remove } = fs;

/**
 * ACTION NAMES
 */
export const SET_PHONE_IS_ACTIVE = "SET_PHONE_IS_ACTIVE";
export const PRESS_REC = "PRESS_REC";
export const PRESS_PLAY = "PRESS_PLAY";
export const PRESS_REPLAY = "PRESS_REPLAY";
export const PRESS_DELETE = "PRESS_DELETE";
export const PRESS_ESC = "PRESS_ESC";

export const SET_PHONE_MODE = "SET_PHONE_MODE";
export const SET_PHONE_STATUS = "SET_PHONE_STATUS";
export const SET_LATEST_RECORDED_STORY_ID = "SET_LATEST_RECORDED_STORY_ID";
export const SET_ALL_STORIES = "SET_ALL_STORIES";
export const SET_SHAREABLE_STORIES = "SET_SHAREABLE_STORIES";
export const SET_LISTENABLE_STORIES = "SET_LISTENABLE_STORIES";
export const SET_LISTENED_STORY_ID = "SET_LISTENED_STORY_ID";

export const END_OF_AUDIO = "END_OF_AUDIO";
export const PLAY_NEXT_STORY = "PLAY_NEXT_STORY";

export const SET_PLAYER = "SET_PLAYER";
export const SET_RECORDER = "SET_RECORDER";
export const SET_ACTIVE_RECORDING_FOLDER_NAME = "SET_ACTIVE_RECORDING_FOLDER_NAME";
export const WAIT_BEFORE_NEXT_STORY = "WAIT_BEFORE_NEXT_STORY";

export const DELETE_STORY = "DELETE_STORY";
export const CREATE_STORY = "CREATE_STORY";

const allStories = await discoverStories();
console.log(allStories);

const shareableStories = allStories.filter(s => s.status === STATUSES.SHAREABLE)

const initialState = {
  phoneIsActive: false,
  phoneMode: PHONE_MODES.PLAYING,
  phoneStatus: PHONE_STATUSES.LISTENING_IDLE,
  allStories,
  shareableStories,
  listenableStories: [...shareableStories],
  activeSoundPlayer: undefined,
  listenedStoryId: undefined,
  listenedStoryBasePath: undefined,
};

function pickANewStory(state, newState) {
  console.log('pick a new story');
  if (!state.shareableStories.length) {
    console.log(colors.red('No stories to play'));
    return newState;
  }
  if (state.listenableStories.length === 0) {
    newState.listenableStories = [...state.shareableStories];
  }
  const randomStoryIndex = parseInt(Math.random() * state.listenableStories.length);
  const storyToPlay = newState.listenableStories[randomStoryIndex];
  newState.listenedStoryId = storyToPlay.id;
  newState.listenedStoryBasePath = storyToPlay.basePath;
  newState.phoneStatus = PHONE_STATUSES.PRE_LISTENING;
  newState.listenableStories = newState.listenableStories.filter((f, i) => i !== randomStoryIndex);
  return newState;
}

function mainReducer(state = initialState, action) {
  const { type, payload } = action;
  console.log(type);
  let newState = { ...state };
  switch (type) {

    case SET_PHONE_IS_ACTIVE:
      newState.phoneIsActive = payload;
      // phone sets to active
      if (payload) {
        if (state.phoneMode === PHONE_MODES.PLAYING) {
          newState = pickANewStory(state, newState);
        } else if (state.phoneMode === PHONE_MODES.RECORDING) {
          if (state.phoneStatus === PHONE_STATUSES.RECORDING_IDLE) {
            newState.phoneStatus = PHONE_STATUSES.PRE_RECORDING;
          }
        }
        // phone sets to inactive
      } else {
        if (newState.player) {
          newState.player.kill();
        }
        if (state.phoneMode === PHONE_MODES.RECORDING && state.phoneStatus === PHONE_STATUSES.RECORDING) {
          newState.phoneStatus = PHONE_STATUSES.PROCESSING_RECORDING;
        }
      }
      return newState;

    case SET_PLAYER:
      return {
        ...newState,
        player: payload
      }
    case SET_RECORDER:
      return {
        ...newState,
        recorder: payload
      };
    case SET_ACTIVE_RECORDING_FOLDER_NAME:
      return {
        ...newState,
        activeRecordingFolderName: payload
      }
    case END_OF_AUDIO:
      if (state.player?.path === payload) {
        if (state.phoneStatus === PHONE_STATUSES.PRE_LISTENING) {
          newState.phoneStatus = PHONE_STATUSES.LISTENING;
        } else if (state.phoneStatus === PHONE_STATUSES.LISTENING) {
          newState.phoneStatus = PHONE_STATUSES.POST_LISTENING;
        } else if (state.phoneStatus === PHONE_STATUSES.PRE_RECORDING) {
          newState.phoneStatus = PHONE_STATUSES.RECORDING;
        } else if (state.phoneStatus === PHONE_STATUSES.DELETING) {
          newState.phoneStatus = PHONE_STATUSES.RECORDING_IDLE;
        }
      }

      return newState;
    case PLAY_NEXT_STORY:
      if (state.phoneStatus === PHONE_STATUSES.POST_LISTENING && state.phoneIsActive === true) {
        newState.phoneStatus = PHONE_STATUSES.LISTENING;
        newState = pickANewStory(state, newState);
        return newState;
      }
    case PRESS_REC:
      if (newState.phoneMode !== PHONE_MODES.RECORDING) {
        newState.phoneMode = PHONE_MODES.RECORDING;
      }
      if (newState.phoneIsActive) {
        // recording was on, triggers end of recording
        if (newState.phoneStatus === PHONE_STATUSES.RECORDING) {
          newState.phoneStatus = PHONE_STATUSES.PROCESSING_RECORDING;
          // was in pre-recording (intro message), skip to recording
        } else if (newState.phoneStatus === PHONE_STATUSES.PRE_RECORDING) {
          newState.phoneStatus = PHONE_STATUSES.RECORDING;
          // was in recording idle (after story deletion for instance)
        } else if (newState.phoneStatus === PHONE_STATUSES.RECORDING_IDLE) {
          newState.phoneStatus = PHONE_STATUSES.PRE_RECORDING;
          // was in playing mode, start recording process
        } else {
          newState.phoneStatus = PHONE_STATUSES.PRE_RECORDING;
        }
      } else {
        newState.phoneStatus = PHONE_STATUSES.RECORDING_IDLE;
      }
      return newState;
    case PRESS_PLAY:
      if (newState.phoneMode !== PHONE_MODES.PLAYING) {
        newState.phoneMode = PHONE_MODES.PLAYING;
      }
      // security: any play actions disables replay/delete of previously
      // recorded story
      newState.activeRecordingFolderName = undefined;
      newState.recorder = undefined;

      if (newState.phoneIsActive) {
        if (newState.phoneMode === PHONE_MODES.PLAYING) {
          newState = pickANewStory(state, newState);
        }
        newState.phoneStatus = PHONE_STATUSES.PRE_LISTENING;
      } else {
        newState.phoneStatus = PHONE_STATUSES.LISTENING_IDLE;
      }
      return newState;
    case PRESS_REPLAY:
      if (newState.phoneMode === PHONE_MODES.RECORDING && newState.activeRecordingFolderName) {
        newState.phoneStatus = PHONE_STATUSES.RELISTENING;
      }
      return newState;
    case PRESS_DELETE:
      if (newState.phoneMode === PHONE_MODES.RECORDING && newState.activeRecordingFolderName) {
        newState.phoneStatus = PHONE_STATUSES.DELETING;
      }
      return newState;
    case SET_PHONE_MODE:
      return {
        ...state,
        phoneMode: payload
      }
    case SET_PHONE_STATUS:
      return {
        ...state,
        phoneStatus: payload
      }
    case SET_LATEST_RECORDED_STORY_ID:
      return {
        ...newState,
        lastestRecordedStoryId: payload
      }
    case SET_ALL_STORIES:
      return {
        ...newState,
        allStories: payload
      }
    case SET_SHAREABLE_STORIES:
      return {
        ...newState,
        shareableStories: payload
      }
    case SET_LISTENABLE_STORIES:
      return {
        ...newState,
        listenableStories: payload
      }
    case SET_LISTENED_STORY_ID:
      return {
        ...newState,
        listenedStoryId: payload
      }
    case DELETE_STORY:
      return state;
    case CREATE_STORY:
      return {
        ...newState,
        allStories: [...allStories, payload]
      }
    default:
      return state;
  }
}

const store = createStore(mainReducer);

/**
 * Triggers
 */
let oldState;
store.subscribe(async () => {
  const newState = store.getState();
  if (oldState?.phoneIsActive && !newState.phoneIsActive) {
    if (newState.player) {
      newState.player.kill();
    }
  }
  if (newState.phoneIsActive) {
    console.log(oldState?.phoneStatus, '>>>', newState.phoneStatus);
    // pre intro rec
    if (
      (oldState?.phoneStatus !== newState.phoneStatus && newState.phoneStatus === PHONE_STATUSES.PRE_RECORDING)
      ||
      (oldState?.phoneIsActive === false && newState.phoneStatus === PHONE_STATUSES.PRE_RECORDING)
    ) {
      if (newState.player) {
        newState.player.kill();
      }
      console.log('play intro');
      const thatPath = 'resources/nqn_avant_enregistrement.wav';
      const storyPlayer = await player(thatPath);
      store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
      setTimeout(() => {
        store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
      }, storyPlayer.duration * 1000);
      // pre-recording -> recording
    } else if (oldState?.phoneStatus === PHONE_STATUSES.PRE_RECORDING && newState.phoneStatus === PHONE_STATUSES.RECORDING) {
      if (newState.player) {
        newState.player.kill();
      }
      setTimeout(() => {
        const highestId = newState.allStories.length ? Math.max(...newState.allStories.map(a => +a.id)) : 0;
        console.log('highest id', highestId);
        const id = (highestId + 1 + '').padStart(3, "0");
        console.log('create story with id', id);
        const dateRedux = new Date().toISOString().split('T')[0].replace(/-/g, '');
        const folderName = `${id}_${dateRedux}`;
        ensureDirSync(`stories/${folderName}`);
        const metadata = {
          date: new Date().toISOString(),
          id,
          duration: '',
          title: '',
          status: STATUSES.PRIVATE
        }
        console.log('metadata 1', metadata);
        writeFileSync(`stories/${folderName}/metadata.md`, jsToFrontMatter(metadata), 'utf8');

        store.dispatch({ type: SET_ACTIVE_RECORDING_FOLDER_NAME, payload: folderName })
        store.dispatch({ type: CREATE_STORY, payload: metadata });
        const recorder = createRecording(`stories/${folderName}/audio.wav`);
        store.dispatch({ type: SET_RECORDER, payload: recorder });
      })

      // story in ongoing transcription message
    } else if (oldState?.phoneIsActive === false && oldState?.phoneStatus === newState.phoneStatus && newState.phoneStatus === PHONE_STATUSES.PROCESSING_RECORDING) {
      if (newState.player) {
        newState.player.kill();
      }
      const thatPath = 'resources/nqn_en_cours_de_transcription.wav';
      const storyPlayer = await player(thatPath);
      store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
      setTimeout(() => {
        store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
      }, storyPlayer.duration * 1000);
      // hang on after recording and processing finished
    } else if (oldState?.phoneIsActive === false && newState.phoneStatus === PHONE_STATUSES.POST_RECORDING) {
      if (newState.player) {
        newState.player.kill();
      }
      const thatPath = 'resources/nqn_actions_histoire.wav';
      const storyPlayer = await player(thatPath);
      store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
      setTimeout(() => {
        store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
      }, storyPlayer.duration * 1000);
      // new story to listen to
    } else if (newState.phoneStatus === PHONE_STATUSES.PRE_LISTENING && newState.listenedStoryId !== oldState?.listenedStoryId) {
      if (newState.player) {
        newState.player.kill();
      }
      const thatPath = `${newState.listenedStoryBasePath}/prelude.wav`;
      const storyPlayer = await player(thatPath);
      store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
      setTimeout(() => {
        store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
      }, storyPlayer.duration * 1000)
      // re listening recorded story
    } else if (
      (oldState?.phoneStatus !== PHONE_STATUSES.RELISTENING && newState.phoneStatus === PHONE_STATUSES.RELISTENING)
      || (!oldState?.phoneIsActive && newState.phoneStatus === PHONE_STATUSES.RELISTENING)
    ) {
      if (newState.player) {
        newState.player.kill();
      }
      if (newState.activeRecordingFolderName && newState.phoneMode === PHONE_MODES.RECORDING) {
        const thatPath = `stories/${newState.activeRecordingFolderName}/audio.wav`;
        const storyPlayer = await player(thatPath);
        store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
        setTimeout(() => {
          store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
        }, storyPlayer.duration * 1000)
      }
      

      // deleting recorded story
    } else if (oldState?.phoneStatus !== PHONE_STATUSES.DELETING && newState.phoneStatus === PHONE_STATUSES.DELETING) {
      if (newState.activeRecordingFolderName && newState.phoneMode === PHONE_MODES.RECORDING) {
        console.log(`suppression du dossier ${newState.activeRecordingFolderName}`);
        await remove(`stories/${newState.activeRecordingFolderName}`);
        if (newState.player) {
          newState.player.kill();
        }
        const thatPath = 'resources/nqn_confirmation_suppression.wav';
        const storyPlayer = await player(thatPath);
        store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
        setTimeout(() => {
          store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
        }, storyPlayer.duration * 1000);
      }
      // pre-listening > listening
    } else if (oldState?.phoneStatus === PHONE_STATUSES.PRE_LISTENING && newState.phoneStatus === PHONE_STATUSES.LISTENING) {
      if (newState.player) {
        newState.player.kill();
      }
      const thatPath = `${newState.listenedStoryBasePath}/audio.wav`;
      const storyPlayer = await player(thatPath);
      store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
      setTimeout(() => {
        store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
      }, storyPlayer.duration * 1000);
      // wait after played story
    } else if (oldState?.phoneStatus === PHONE_STATUSES.LISTENING && newState.phoneStatus === PHONE_STATUSES.POST_LISTENING) {
      setTimeout(() => {
        store.dispatch({ type: PLAY_NEXT_STORY })
      }, WAIT_BEFORE_NEXT_STORY);
    }
    // phone inactive
  } else {

  }
  // triggers no matter if the phone is hang up or not
  // recording -> post-recording
  if (oldState?.phoneStatus === PHONE_STATUSES.RECORDING && newState.phoneStatus === PHONE_STATUSES.PROCESSING_RECORDING) {
    setTimeout(async () => {
      console.log('stopper le recorder');
      if (newState.recorder) {
        console.log('je stoppe le recorder');
        await newState.recorder.stop();
      } else {
        console.log(newState);
        console.log('no recorder');
      }
      // if phone is active play message transcription
      if (newState.phoneIsActive) {
        console.log('should play transcription ongoing');
        if (newState.player) {
          newState.player.kill();
        }
        const thatPath = 'resources/nqn_en_cours_de_transcription.wav';
        const storyPlayer = await player(thatPath);
        store.dispatch({ type: SET_PLAYER, payload: storyPlayer })
        setTimeout(() => {
          store.dispatch({ type: END_OF_AUDIO, payload: thatPath })
        }, storyPlayer.duration * 1000);
      }
      console.log(colors.blue(`début de la transcription`));
      const audioPath = `stories/${newState.activeRecordingFolderName}/audio.wav`;
      const duration = await getAudioDurationInSeconds(audioPath);
      const { transcription = '' } = await transcriber(audioPath);
      await fs.writeFile(`stories/${newState.activeRecordingFolderName}/_transcription_auto.txt`, transcription.trim(), 'utf8')
      await fs.writeFile(`stories/${newState.activeRecordingFolderName}/transcription_partageable.txt`, transcription.trim(), 'utf8')
      const metadata = fm(fs.readFileSync(`stories/${newState.activeRecordingFolderName}/metadata.md`, 'utf8')).attributes;
      metadata.duration = duration;
      // store.dispatch({ type: SET_RECORDER, payload: undefined })

      await writeFile(`stories/${newState.activeRecordingFolderName}/metadata.md`, jsToFrontMatter(metadata), 'utf8');
      if (config.usePrinter !== undefined ? config.usePrinter : true) {
        console.log(colors.green('impression du résultat'));
        printPrivatePart(metadata, transcription.trim(), config.printLegal !== undefined ? config.printLegal : true);
      }
      store.dispatch({ type: SET_PHONE_STATUS, payload: PHONE_STATUSES.POST_RECORDING });

    })

    // @todo update story
    // printMan();

  }

  oldState = newState;
})

export default store;