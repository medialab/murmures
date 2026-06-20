import { startKeyboardListener } from "../lib/keyboardListener.js";
import config from "../config.json" with {type: "json"};

console.log(`Platform: ${process.platform}`);
console.log(`Arch: ${process.arch}`);
console.log("Appuie sur ESCAPE pour quitter.");

const listener = await startKeyboardListener({
  devicePath: process.platform === "linux" ? config.keyboardDevice || process.env.KEYBOARD_DEVICE : undefined,

  onKey(event) {
    console.log({
      key: event.key,
      state: event.state,
      code: event.code,
      source: event.source,
    });

    if (event.key === "ESCAPE" && event.state === "DOWN") {
      console.log("Arrêt.");
      listener.stop();
      process.exit(0);
    }
  },
});

process.stdin.resume();