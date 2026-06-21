#!/bin/bash

echo "Réglage du volume de toutes les cartes son..."

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
      | sed -n "s/Simple mixer control '\([^']*\)'.*/\1/p" \
      | while read -r control; do
          if amixer -c "$card" sget "$control" 2>/dev/null | grep -q "Playback"; then
            echo "  -> $control à 100%"
            amixer -c "$card" sset "$control" 100% unmute >/dev/null 2>&1 || true
          fi
        done
  done
fi

echo "Amplification de toutes les sorties Pulse/PipeWire..."

if command -v pactl >/dev/null 2>&1; then
  pactl list short sinks | awk '{print $1}' | while read -r sink; do
    echo "Sink $sink à 150%"
    pactl set-sink-mute "$sink" 0 2>/dev/null || true
    pactl set-sink-volume "$sink" 150% 2>/dev/null || true
  done
fi

if command -v wpctl >/dev/null 2>&1; then
  wpctl set-mute @DEFAULT_AUDIO_SINK@ 0 2>/dev/null || true
  wpctl set-volume @DEFAULT_AUDIO_SINK@ 1.5 2>/dev/null || true
fi


export NVM_DIR="/home/[replace_with_your_username]/.nvm"

if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
else
  echo "nvm introuvable dans $NVM_DIR"
  read
  exit 1
fi

nvm use 20

cd /home/[replace_with_your_username]/murmures || exit 1

echo "Lancement de Murmures..."
echo "Répertoire courant : $(pwd)"
echo "Node : $(which node)"
echo "npm : $(which npm)"
echo

nvm use 20
npm start

echo
echo "Le script s'est arrêté."
echo "Appuie sur Entrée pour fermer ce terminal."
read