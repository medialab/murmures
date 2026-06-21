
[WIP]

# Installation (WIP)

On mac:

```sh
git clone https://github.com/medialab/murmures.git
cd murmures

# dependencies
brew install sox # audio recording
brew install git-lfs # git large files
git lfs install

# install whisper
mkdir -p models/Xenova
git clone https://huggingface.co/Xenova/whisper-small models/Xenova/whisper-small
git clone https://huggingface.co/Xenova/whisper-small models/Xenova/whisper-base
git clone https://huggingface.co/Xenova/whisper-small models/Xenova/whisper-tiny

npm cache verify
export npm_config_arch=arm64
export npm_config_target_arch=arm64
export npm_config_build_from_source=true
npm install
```

On Linux (including WSL) platform:

```sh
# clone repo
git clone https://github.com/medialab/murmures.git
cd murmures

# install dependencies
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

# install dependencies
npm i
# on debian rebuild printer
npm rebuild printer --build-from-source
```

## After installation

Find the name of the printer you are going to use. On Debian:

```sh
lpstat -p -d
```

Copy config file:

```sh
cp config.sample.json config.json
```

Then in `config.json` modify `printerName` accordingly. Adjust other settings as you which

On debian/raspberry PI, you may also have to set your keyboard capture mode to X11:

```sh
sudo raspi-config
```

Then:

```sh
Advanced Options
→ Wayland
→ X11
→ Reboot
```

Then when running `echo $XDG_SESSION_TYPE` you should get `x11`.

You should also on debian identify the proper audio output:

```sh
aplay -l
```

Then modify `config.json` `audioCard` by setting the proper number. You can try different cards with the script `tests/play.js`.

Same thing for the recorder:

```sh
arecord -l
```

Then modify `config.json` `recordCard` by setting the proper number. You can try different cards with the script `tests/record.js`.

If sound is too low:

```sh
alsamixer
```

Then F6 > select your output (eg USB audio) > augment the sound > esc.

Then:

```sh
sudo alsactl store
```


# Usage

```sh
npm start # default script, starts the app
npm html # generate html paginated document of public stories
npm server # serve webserver with html paginated document of public stories
```

# Setup services for launching at startup on a raspberry pi

```sh
nano /home/rawbin/start-murmures.sh
```

Then paste `start-murmures.sh` content into it (replace `replace_with_your_username` with your username).

Then give it execution rights:

```sh
chmod +x /home/rawbin/start-murmures.sh
```

Then create an autostart script:

```sh
mkdir -p /home/rawbin/.config/autostart
nano /home/rawbin/.config/autostart/murmures.desktop
```

Then paste the content of `autostart-murmures.desktop` (replace `replace_with_your_username` with your username).

Then give it execution rights:

```sh
chmod +x /home/rawbin/.config/autostart/murmures.desktop
```

You're done!