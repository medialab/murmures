import { spawn } from "child_process";
import path from "path";

import p from 'play-sound';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import config from "../config.json" with {type: "json"};

const playerLib = p({
  // player: process.platform === "linux" ? "aplay" : undefined,
  // aplay: process.platform === "linux" ? ['-D', 'plughw:2,0'] : undefined
});

export default async function playFile(path) {
  const duration = await getAudioDurationInSeconds(path);
  let child;
  let audio;

  if (process.plateform === "linux") {
    const file = path.resolve(path);

    const child = spawn("aplay", ["-D", `plughw:${config.audioCard},0`, file], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      console.log("aplay terminé avec code", code);
    });
  } else {
    audio = playerLib.play(path, function (err) {
      if (err && !err.killed) throw err
    })
  }

  return {
    duration,
    kill: () => process.plateform === 'linux' ? child.kill() : audio.kill()
  }
}