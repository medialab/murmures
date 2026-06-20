import fs from "node:fs";
import os from "node:os";

const EV_KEY = 0x01;

// Codes Linux evdev courants.
// Tu peux compléter selon ton clavier/bouton.
const LINUX_KEY_CODES = {
  1: "ESCAPE",
  2: "1",
  3: "2",
  4: "3",
  5: "4",
  6: "5",
  7: "6",
  8: "7",
  9: "8",
  10: "9",
  11: "0",

  16: "Q",
  17: "W",
  18: "E",
  19: "R",
  20: "T",
  21: "Y",
  22: "U",
  23: "I",
  24: "O",
  25: "P",

  28: "ENTER",
  29: "LEFTCTRL",

  30: "A",
  31: "S",
  32: "D",
  33: "F",
  34: "G",
  35: "H",
  36: "J",
  37: "K",
  38: "L",

  42: "LEFTSHIFT",

  44: "Z",
  45: "X",
  46: "C",
  47: "V",
  48: "B",
  49: "N",
  50: "M",

  71: "NUMPAD 7",
  72: "NUMPAD 8",
  73: "NUMPAD 9",

  75: "NUMPAD 4",
  76: "NUMPAD 5",
  77: "NUMPAD 6",

  79: "NUMPAD 1",
  80: "NUMPAD 2",
  81: "NUMPAD 3",
  82: "NUMPAD 0",

  56: "LEFTALT",
  57: "SPACE",
  97: "RIGHTCTRL",
  100: "RIGHTALT",

  103: "UP",
  105: "LEFT",
  106: "RIGHT",
  108: "DOWN",
};

function normalizeLinuxKeyEvent(event) {
  if (event.type !== EV_KEY) return null;

  let state;

  if (event.value === 0) {
    state = "UP";
  } else if (event.value === 1) {
    state = "DOWN";
  } else if (event.value === 2) {
    state = "REPEAT";
  } else {
    state = `VALUE_${event.value}`;
  }

  return {
    key: LINUX_KEY_CODES[event.code] ?? `KEY_${event.code}`,
    state,
    code: event.code,
    source: "evdev",
    raw: event,
  };
}

function parseLinuxInputEvent(buffer, offset, eventSize) {
  // Linux 64 bits : struct input_event = 24 octets
  //   long tv_sec  : 8
  //   long tv_usec : 8
  //   uint16 type  : 2
  //   uint16 code  : 2
  //   int32 value  : 4
  //
  // Linux 32 bits : souvent 16 octets
  //   long tv_sec  : 4
  //   long tv_usec : 4
  //   uint16 type  : 2
  //   uint16 code  : 2
  //   int32 value  : 4

  if (eventSize === 24) {
    return {
      sec: Number(buffer.readBigInt64LE(offset)),
      usec: Number(buffer.readBigInt64LE(offset + 8)),
      type: buffer.readUInt16LE(offset + 16),
      code: buffer.readUInt16LE(offset + 18),
      value: buffer.readInt32LE(offset + 20),
    };
  }

  if (eventSize === 16) {
    return {
      sec: buffer.readUInt32LE(offset),
      usec: buffer.readUInt32LE(offset + 4),
      type: buffer.readUInt16LE(offset + 8),
      code: buffer.readUInt16LE(offset + 10),
      value: buffer.readInt32LE(offset + 12),
    };
  }

  throw new Error(`Unsupported evdev event size: ${eventSize}`);
}

function guessLinuxInputEventSize() {
  // Sur Raspberry Pi OS 64 bits : arm64 → 24 octets.
  // Sur Raspberry Pi OS 32 bits : arm → souvent 16 octets.
  // Tu peux forcer avec EVDEV_EVENT_SIZE=16 ou EVDEV_EVENT_SIZE=24.
  if (process.env.EVDEV_EVENT_SIZE) {
    return Number(process.env.EVDEV_EVENT_SIZE);
  }

  if (process.arch === "x64" || process.arch === "arm64") {
    return 24;
  }

  return 16;
}

function startEvdevKeyboardListener({ devicePath, onKey }) {
  if (!devicePath) {
    throw new Error(
      [
        "Sur Linux/Raspberry Pi, il faut indiquer un périphérique evdev.",
        "Exemple :",
        "  KEYBOARD_DEVICE=/dev/input/event3 node test-keyboard.js",
        "ou :",
        "  KEYBOARD_DEVICE=/dev/input/by-id/usb-XXXX-event-kbd node test-keyboard.js",
      ].join("\n")
    );
  }

  const eventSize = guessLinuxInputEventSize();

  console.log(`Backend clavier : evdev`);
  console.log(`Device : ${devicePath}`);
  console.log(`Event size : ${eventSize} octets`);

  const stream = fs.createReadStream(devicePath, {
    highWaterMark: eventSize * 64,
  });

  let leftover = Buffer.alloc(0);

  stream.on("data", (chunk) => {
    const buffer = Buffer.concat([leftover, chunk]);
    let offset = 0;

    while (offset + eventSize <= buffer.length) {
      const rawEvent = parseLinuxInputEvent(buffer, offset, eventSize);
      const normalizedEvent = normalizeLinuxKeyEvent(rawEvent);

      if (normalizedEvent) {
        onKey(normalizedEvent);
      }

      offset += eventSize;
    }

    leftover = buffer.subarray(offset);
  });

  stream.on("error", (error) => {
    if (error.code === "EACCES") {
      console.error(`Permission refusée pour ${devicePath}.`);
      console.error("Essaie avec sudo, ou ajoute ton utilisateur au groupe input :");
      console.error("  sudo usermod -aG input $USER");
      console.error("Puis redémarre la session ou le Raspberry Pi.");
    } else {
      console.error("Erreur evdev :", error);
    }

    process.exit(1);
  });

  return {
    stop() {
      stream.destroy();
    },
  };
}

async function startMacKeyboardListener({ onKey }) {
  console.log("Backend clavier : keyspy / macOS");

  const { GlobalKeyboardListener } = await import("keyspy");

  const keyboard = new GlobalKeyboardListener();

  keyboard.addListener((event, down) => {
    onKey({
      key: event.name,
      state: event.state,
      code: event.rawKey?.vKey,
      source: "keyspy",
      raw: event,
      down,
    });
  });

  return {
    stop() {
      keyboard.kill?.();
    },
  };
}

export async function startKeyboardListener({ devicePath, onKey }) {
  if (process.platform === "darwin") {
    return startMacKeyboardListener({ onKey });
  }

  if (process.platform === "linux") {
    return startEvdevKeyboardListener({
      devicePath: devicePath ?? process.env.KEYBOARD_DEVICE,
      onKey,
    });
  }

  throw new Error(`Plateforme non supportée : ${process.platform}`);
}