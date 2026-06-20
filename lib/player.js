import { spawn } from "child_process";
import path from "path";

import p from 'play-sound';
import { getAudioDurationInSeconds } from 'get-audio-duration';
import config from "../config.json" with {type: "json"};

const playerLib = p({
  // player: process.platform === "linux" ? "aplay" : undefined,
  // aplay: process.platform === "linux" ? ['-D', 'plughw:2,0'] : undefined
});

export default async function playFile(thatPath) {
  const duration = await getAudioDurationInSeconds(thatPath);
  let child;
  let audio;

  if (process.platform === "linux") {
    const file = path.resolve(thatPath);

    const child = spawn("aplay", ["-D", `plughw:${config.audioCard},0`, file], {
      stdio: "inherit",
    });

    child.on("close", (code) => {
      console.log("aplay terminé avec code", code);
    });
  } else {
    audio = playerLib.play(thatPath, function (err) {
      if (err && !err.killed) throw err
    })
  }

  return {
    duration,
    kill: () => process.platform === 'linux' ? child.kill() : audio.kill()
  }
}