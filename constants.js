export const PHONE_MODES = {
  RECORDING: 'RECORDING',
  PLAYING: 'PLAYING'
};
export const PHONE_STATUSES = {
  PRE_LISTENING: "PRE_LISTENING",
  LISTENING: "LISTENING",
  POST_LISTENING: "POST_LISTENING",

  PRE_RECORDING: "PRE_RECORDING",
  RECORDING: "RECORDING",
  PROCESSING_RECORDING: "PROCESSING_RECORDING",
  POST_RECORDING: "POST_RECORDING",

  RECORDING_IDLE: "RECORDING_IDLE",
  LISTENING_IDLE: "LISTENING_IDLE",
  // PRE_RELISTENING: "PRE_RELISTENING",
  RELISTENING: "RELISTENING",
  DELETING: "DELETING"
}

export const MODES = {
  STANDBY: 'STANDBY',
  RECORDING: 'RECORDING',
  PLAYING: 'PLAYING',
  REPLAYING: 'REPLAYING'
}

export const STATUSES = {
  SHAREABLE: 'partageable',
  UNDECIDED: 'en attente',
  PRIVATE: 'équipe uniquement'
}

// const KEYS_MAP = {
//   // HANGUP: 'RETURN',
//   HANGON: 'SPACE',
//   PLAYMODE: 'O',
//   RECMODE: 'P',
//   REPLAYMODE: 'I',
//   DELETE: 'BACKSPACE'
// }

export const KEYS_MAP = {
  // HANGON: 'RETURN',
  // PLAYMODE: 'U',
  // RECMODE: 'I',
  // REPLAYMODE: 'O',
  // DELETE: 'P'


  HANGON: 'NUMPAD 0',
  PLAYMODE: 'NUMPAD 1',
  RECMODE: 'NUMPAD 2',
  REPLAYMODE: 'NUMPAD 3',
  DELETE: 'NUMPAD 9'
}
export const KEYS_MAN = {
  HANGON: 'décrocher ou raccrocher',
  PLAYMODE: 'passer en mode lecture',
  RECMODE: 'passer en mode enregistrement',
  REPLAYMODE: 'passer en mode réécoute',
  DELETE: 'supprimer la dernière histoire enregistrée'
}

export const WAIT_BEFORE_NEXT_STORY = 3 * 1000;