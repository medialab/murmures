import fs from "fs-extra";
import { STATUSES } from "./constants.js";
import { discoverStories } from "./lib/misc.js";

const {readFileSync} = fs;

let stories = await discoverStories()
stories = stories.filter(f => f.status === STATUSES.SHAREABLE);

const printTexture = () => {
  const chars = [
    '▓', '▒', '░', '░', ' '
  ]

  const numberOfChars = parseInt(Math.random() * 100) + 100;
  let lineSize = parseInt(Math.random() * 20) + 50;
  let introTexture = '';
  let j = 0;
  for (let i = 0; i < numberOfChars; i++) {
    introTexture += chars[parseInt(Math.random() * chars.length)];
    j++;
    if (j > lineSize) {
      introTexture += '\n';
      lineSize = parseInt(Math.random() * 20) + 50;
      j = 0;
    }
  }
  return introTexture;
}

const outputStoryHTML = (story) => {
  const {basePath, id, title, date} = story;
  const txt = readFileSync(`${basePath}/transcription_partageable.txt`, 'utf8');
  return `<section class="story">
  <div class="header">
    <pre>${printTexture()}</pre>
    <h4>Nos quotidiens numériques</h4>
    <h1>Histoire n°${+id} : ${title}</h1>
    <h4>Confiée le ${new Date(date).toLocaleDateString()} <h4>
  </div>
  <article>
    ${txt.split('\n').map(p => `<p>${p}</p>`).join('\n')}
  </article>
  <!--  <pre style="text-align: right;">${printTexture()}</pre> -->
</section>
  `
}

const html = `
<!DOCTYPE html>
        <html lang="fr">
          <head>
            <meta charset="UTF-8">
            <meta name="viewport" content="width=device-width, initial-scale=1.0">
            <meta http-equiv="X-UA-Compatible" content="ie=edge">
            <title>Nos quotidiens numériques</title> 

            <link rel="preconnect" href="https://fonts.googleapis.com">
<link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
<link href="https://fonts.googleapis.com/css2?family=Anonymous+Pro:ital,wght@0,400;0,700;1,400;1,700&family=Noto+Sans:ital,wght@0,100..900;1,100..900&display=swap" rel="stylesheet">

            <link rel="stylesheet" type="text/css" href="resources/pagedjs-interface.css" />
            <link rel="stylesheet" type="text/css" href="resources/style.css" />
          </head>
          <body>
            ${stories.map(s => outputStoryHTML(s)).join('\n')}
            <script type="text/javascript" src="resources/paged.polyfill.js"></script>
          </body>

        </html>`
  fs.writeFileSync(`index.html`, html, 'utf8');
