
import fs from 'fs-extra';
import fm from 'front-matter';

const { readdir, statSync, readFileSync, existsSync, ensureDir, writeFile, remove } = fs;

export const jsToFrontMatter = (obj) => {
  return `---
${
  Object.entries(obj).map(([key, val]) => {
    return `${key}: ${val + ''}`
  }).join('\n')
}
---`
}

export const discoverStories = async () => {
  const files = await readdir('stories');
  const folders = files.filter(f => statSync(`stories/${f}`).isDirectory())
    .filter(folder => {
      const basePath = `stories/${folder}`;
      const missingFiles = ['audio.wav', 'metadata.md', '_transcription_auto.txt', 'transcription_partageable.txt'].filter(f => !existsSync(`${basePath}/${f}`));
      if (missingFiles.length) {
        console.log('missing files: ', missingFiles.map(f => `${basePath}/${f}`).join(', '));
      } else {
        return true;
      }
    })
    .map(folder => {
      const basePath = `stories/${folder}`;
      try {
        const metadata = fm(fs.readFileSync(`${basePath}/metadata.md`, 'utf8'));
        return {
          ...metadata.attributes,
          basePath
        }
      } catch (e) {
        console.log('could not decode', `${basePath}/metadata.md`)
      }

    }).filter(f => f);
  return folders//.filter(f => f.status === STATUSES.SHAREABLE);
}
