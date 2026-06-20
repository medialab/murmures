import { spawn, exec } from "child_process";
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

    console.log('exec sound adjustment')
    await exec(`
if command -v pactl >/dev/null 2>&1; then
  pactl list short sinks | awk '{print $1}' | while read -r sink; do
    echo "Réglage sink Pulse/PipeWire: $sink"
    pactl set-sink-mute "$sink" 0 2>/dev/null || true
    pactl set-sink-volume "$sink" 100% 2>/dev/null || true
  done
fi

if command -v amixer >/dev/null 2>&1 && command -v aplay >/dev/null 2>&1; then
  aplay -l | awk -F'[: ]+' '/^card /{print $2}' | sort -nu | while read -r card; do
    echo "Réglage carte ALSA: $card"

    amixer -c "$card" scontrols \
      | sed -n "s/Simple mixer control '\([^']*\)'.*/\\1/p" \
      | while read -r control; do
          if amixer -c "$card" sget "$control" 2>/dev/null | grep -q "Playback"; then
            echo "  -> $control à 100%"
            amixer -c "$card" sset "$control" 100% unmute >/dev/null 2>&1 || true
          fi
        done
  done
fi`, (error, stdout, stderr) => {
      if (error) {
        console.error(`exec error with sound control: ${error}`);
      }
    });
    console.log('done sound adjustment');

    child = spawn("aplay", ["-D", `plughw:${config.audioCard},0`, file], {
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