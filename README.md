
[WIP]

# Installation (WIP)

Download whisper model into the models folder:

```
brew install git-lfs
git lfs install

mkdir -p models/Xenova
git clone https://huggingface.co/Xenova/whisper-small models/Xenova/whisper-small
```

On mac install sox for audio recording:

```
brew install sox
```

On Linux (including WSL) platform, you will need libxkbcommon-x11 installed
```
sudo apt-get install -y libxkbcommon-x11-0
```

Then as usual:
```
npm i
```

On mac os tahoe, if problem with dlopen when runing tests/printer.js you'll have to perform this extra step:

```
rm -rf node_modules package-lock.json
npm cache verify

export npm_config_arch=arm64
export npm_config_target_arch=arm64
export npm_config_build_from_source=true

npm install
```