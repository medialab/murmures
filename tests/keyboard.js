import { GlobalKeyboardListener } from "keyspy";

const keyboard = new GlobalKeyboardListener();

console.log("Démarrage du listener clavier global…");
console.log("Appuie sur ESC pour quitter.");

keyboard.addListener((event, down) => {
  console.log({
    name: event.name,
    state: event.state,
    raw: event.rawKey?._nameRaw,
    vKey: event.rawKey?.vKey,
    downKeys: Object.keys(down || {}).filter((key) => down[key]),
  });

  if (event.name === "ESCAPE" && event.state === "DOWN") {
    console.log("Arrêt.");
    process.exit(0);
  }
});

process.stdin.resume();