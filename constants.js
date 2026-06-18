
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
  // HANGUP: 'RETURN',
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