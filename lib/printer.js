
import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import driver from 'printer';
import fs from 'fs-extra';
import buffer from 'buffer'
import config from '../config.json' with {type: "json"};

const { printerName } = config;

const postScriptText = fs.readFileSync('resources/postscript.md', 'utf-8');
const choiceText = fs.readFileSync('resources/choix.md', 'utf-8');


// to list printers: 
// lpstat -p

const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,                                  // Printer type: 'star' or 'epson'
  width: 48,                                                // Number of characters in one line
  interface: `printer:${printerName}`, // 'tcp://xxx.xxx.xxx.xxx',                       // Printer interface
  // characterSet: CharacterSet.PC852_LATIN2,  // Printer character set
  characterSet: CharacterSet.PC850_MULTILINGUAL,  // Printer character set
  driver,
  removeSpecialCharacters: false,                           // Removes special characters - default: false
  lineCharacter: "-",                                       // Set character for lines - default: "-"
  breakLine: BreakLine.WORD,                                // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
  options: {                                                 // Additional options
    timeout: 5000                                           // Connection timeout (ms) [applicable only for network printers] - default: 3000
  }
});

const printText = md => {
  md.split('\n').forEach(line => {
    let txt = line;
    if (line.startsWith('# ')) {
      txt = line.substr(2);
      printer.setTextSize(1, 1);
    } else {
      printer.setTextNormal();
    }
    const latin1Buffer = buffer.transcode(Buffer.from(txt.replace(/'/g, ' ')), "utf8", "latin1");
    txt = latin1Buffer.toString("latin1");
    printer.println(txt);
  })
}

const printTexture = () => {
  const chars = [
    '▓', '▒', '░', '░', ' '
  ]

  const numberOfChars = Math.random() * 200 + 200;
  let introTexture = '';
  for (let i = 0; i < numberOfChars; i++) {
    introTexture += chars[parseInt(Math.random() * chars.length)]
  }
  printer.println(introTexture)
}

export const printPrivatePart = async (metadata, transcription, PRINT_LEGAL = true) => {
  console.log('metadata', metadata)
  const isConnected = await printer.isPrinterConnected();     // Check if printer is connected, return bool of status
  if (isConnected) {
    printTexture();

    printer.setTextSize(2, 2);

    // printer.alignCenter();
    // printer.drawLine();
    printer.println("Nos");
    printer.println("quotidiens");
    printer.println("numériques");
    printer.setTextSize(3, 3);
    printer.println('---------------');
    printer.println(`Histoire n°${+metadata.id}`);
    printer.println(`${new Date(metadata.date).toLocaleDateString()}`);
    printer.println();
    printer.println(`Titre :`);
    printer.setTextSize(1, 1);
    printer.println(`............`);
    printer.println(`............`);
    printer.println(`............`);
    printer.println();
    printer.setTextSize(0, 0);
    printer.setTextNormal();
    printTexture();
    printer.setTextSize(1, 1);

    printer.println(transcription);
    printer.println('');
    printer.println('');
    printer.setTextSize(0, 0);
    printer.setTextNormal();
    printTexture();
    printer.println('');
    printer.println('');
    printer.cut();
    printer.setTextSize(1, 1);
    printer.underline();
    printer.println(`Part à garder par la personnes qui a raconté l'histoire`);
    printer.setTextNormal();
    printer.setTextSize(1, 1);
    printer.println(`Choix sur l'histoire n°${+metadata.id} confiée au projet Nos Quotidiens numériques le ${new Date(metadata.date).toLocaleDateString()}`);
    printText(choiceText);
    printer.cut();
    printer.setTextSize(1, 1);
    printer.underline();
    printer.println(`Part à garder par l'équipe (découper ci-dessus)`);
    printer.setTextNormal();
    printer.setTextSize(1, 1);
    printer.println(`Choix sur l'histoire n°${+metadata.id} confiée au projet Nos Quotidiens numériques le ${new Date(metadata.date).toLocaleDateString()}`);
    printText(choiceText);
    printer.println('');
    printer.println('');
    printer.println('');

    printer.cut();
    if (PRINT_LEGAL) {
      printText(postScriptText);
      printer.cut();
    }
    
    try {
      let execute = printer.execute()
      console.log("Print done!");
    } catch (error) {
      console.error("Print failed:", error);
    }
  }
}