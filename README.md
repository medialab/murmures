
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

Find the name of the printer you are going to use.

Debian:

````
lpstat -p -d
```

Then in `config.json` modify `printerName` accordingly.

On debian/raspberry PI, you also have to set your keyboard capture mode to X11:

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

# Usage

```
npm start
npm html # generate html paginated document of public stories
npm server # serve webserver with html paginated document of public stories
```