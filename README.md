
[WIP]

# Installation (WIP)

On mac:

```sh
brew install sox # audio recording
brew install git-lfs # git large files
git lfs install
# install whisper
mkdir -p models/Xenova
git clone https://huggingface.co/Xenova/whisper-small models/Xenova/whisper-small

git clone https://github.com/medialab/murmures.git
cd murmures

npm cache verify
export npm_config_arch=arm64
export npm_config_target_arch=arm64
export npm_config_build_from_source=true
npm install
```

On Linux (including WSL) platform, you will need libxkbcommon-x11 installed

```
sudo apt-get install git-lfs # git large file system
# install whisper
mkdir -p models/Xenova
git clone https://huggingface.co/Xenova/whisper-small models/Xenova/whisper-small
git clone https://huggingface.co/Xenova/whisper-tiny models/Xenova/whisper-tiny
git clone https://huggingface.co/Xenova/whisper-base models/Xenova/whisper-base

# install nvm – comment if you already have it
curl -o- https://raw.githubusercontent.com/nvm-sh/nvm/v0.40.5/install.sh | bash
nvm install 20
nvm use 20
# keyboard
sudo apt-get install -y libxkbcommon-x11-0
sudo apt install -y evtest
# cups related
sudo apt install build-essential python3 make g++ pkg-config cups libcups2-dev
sudo apt install cups
sudo cp /etc/cups/cupsd.conf /etc/cups/cupsd.conf.original
sudo chmod a-w /etc/cups/cupsd.conf.original

# audio recording
sudo apt install -y alsa-utils sox libsox-fmt-all

# clone repo
git clone https://github.com/medialab/murmures.git
cd murmures
npm i
# on debian rebuild printer
npm rebuild printer --build-from-source
```


On mac os tahoe, check `tests/printer.js`, if it doesn't work you'll have to perform this extra step:

```
rm -rf node_modules package-lock.json
npm cache verify

export npm_config_arch=arm64
export npm_config_target_arch=arm64
export npm_config_build_from_source=true

npm install
```

## After installation

Copy config file:

```
cp config.sample.json config.json
```

Find the name of the printer you are going to use.

Debian:

````
lpstat -p -d
```

Then in `config.json` modify `printerName` accordingly.

On debian/raspberry PI, you may also have to set your keyboard capture mode to X11:

````
Advanced Options
→ Wayland
→ X11
→ Reboot
````

Then :

````
Advanced Options
→ Wayland
→ X11
→ Reboot
````

You should also on debian identify the proper audio output:

```
aplay -l
```

Then modify `config.json` `audioCard` by setting the proper number. You can try different cards with the script `tests/play.js`.

Same thing for the recorder:

```
aplay -l
```

Then modify `config.json` `recordCard` by setting the proper number. You can try different cards with the script `tests/record.js`.

If sound is too low:

````
alsamixer
```

Then F6 > select your output (eg USB audio) > augment the sound > esc.

Then:

```
sudo alsactl store
```


# Usage

```
npm start
npm html # generate html paginated document of public stories
npm server # serve webserver with html paginated document of public stories
```

# Setup services for launching at startup on a raspberry pi

```
nano /home/rawbin/start-murmures.sh
```

Then paste:

```
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


export NVM_DIR="/home/rawbin/.nvm"

if [ -s "$NVM_DIR/nvm.sh" ]; then
  . "$NVM_DIR/nvm.sh"
else
  echo "nvm introuvable dans $NVM_DIR"
  read
  exit 1
fi

nvm use 20

cd /home/rawbin/murmures || exit 1

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
```

Then:

```
chmod +x /home/rawbin/start-murmures.sh
```

Then:

```
mkdir -p /home/rawbin/.config/autostart
nano /home/rawbin/.config/autostart/murmures.desktop
```

Then paste:

```
[Desktop Entry]
Type=Application
Name=Murmures
Comment=Lance Murmures dans un terminal au démarrage
Exec=lxterminal --title="Murmures" -e bash -lc "/home/rawbin/start-murmures.sh"
Terminal=false
X-GNOME-Autostart-enabled=true
```

Then:

```
chmod +x /home/rawbin/.config/autostart/murmures.desktop
```