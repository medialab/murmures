import { ThermalPrinter, PrinterTypes, CharacterSet, BreakLine } from 'node-thermal-printer';
import driver from 'printer';
import fs from 'fs';
import { markdown } from 'markdown';
import { execute } from 'html2thermal';
import buffer from 'buffer'
import config from '../config.json' with {type: "json"};

const { printerName } = config;

const postScriptText = markdown.toHTML(fs.readFileSync('resources/postscript.md', 'utf-8'));


// to list printers: 
// lpstat -p

const printer = new ThermalPrinter({
  type: PrinterTypes.EPSON,                                  // Printer type: 'star' or 'epson'
  width: 48,                                                // Number of characters in one line
  interface: `printer:${printerName}`, // 'tcp://xxx.xxx.xxx.xxx',                       // Printer interface
  characterSet: CharacterSet.PC852_LATIN2,  // Printer character set
  driver,
  removeSpecialCharacters: false,                           // Removes special characters - default: false
  lineCharacter: "=",                                       // Set character for lines - default: "-"
  breakLine: BreakLine.WORD,                                // Break line after WORD or CHARACTERS. Disabled with NONE - default: WORD
  options: {                                                 // Additional options
    timeout: 5000                                           // Connection timeout (ms) [applicable only for network printers] - default: 3000
  }
});
const isConnected = await printer.isPrinterConnected();     // Check if printer is connected, return bool of status
if (isConnected) {
  // console.log(printer);
  printer.setTextSize(3, 3);
  // printer.alignCenter();
  printer.drawLine();
  printer.println("Nos quotidiens numériques");
  printer.setTextSize(2, 2);
  printer.println(`Histoire n°3, 26/05/2026`);
  printer.drawLine();
  printer.setTextNormal();

  // printer.alignCenter();
  // printer.println("Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque id ullamcorper nulla. Morbi condimentum felis id leo malesuada bibendum. Phasellus eget turpis et magna facilisis aliquam. Fusce at arcu ut magna vehicula condimentum. Morbi interdum massa sed mattis tincidunt. Praesent et rhoncus ipsum. Integer vel luctus enim. Phasellus faucibus, leo ac varius iaculis, mi orci accumsan quam, ac gravida erat nisl sit amet nisl. Donec lectus leo, tincidunt luctus ipsum sed, imperdiet viverra odio. Aenean quis maximus nulla. Etiam id libero tempor, convallis massa nec, fringilla dui. Cras nisl nisl, dapibus pellentesque quam id, pharetra fringilla lorem. Nullam condimentum nisi leo, quis ornare leo mattis. ");
  // printer.setTypeFontB()
  // printer.println(" Lorem ipsum dolor sit amet, consectetur adipiscing elit. Pellentesque id ullamcorper nulla. Morbi condimentum felis id leo malesuada bibendum. Phasellus eget turpis et magna facilisis aliquam. Fusce at arcu ut magna vehicula condimentum. Morbi interdum massa sed mattis tincidunt. Praesent et rhoncus ipsum. Integer vel luctus enim. Phasellus faucibus, leo ac varius iaculis, mi orci accumsan quam, ac gravida erat nisl sit amet nisl. Donec lectus leo, tincidunt luctus ipsum sed, imperdiet viverra odio. Aenean quis maximus nulla. Etiam id libero tempor, convallis massa nec, fringilla dui. Cras nisl nisl, dapibus pellentesque quam id, pharetra fringilla lorem. Nullam condimentum nisi leo, quis ornare leo mattis. ");
  printer.cut();
  try {
    // let execute = printer.execute();
    // const commands = convert(postScriptText, 'PC852_LATIN2')
    const latin1Buffer = buffer.transcode(Buffer.from(postScriptText), "utf8", "latin1");
    const latin1String = latin1Buffer.toString("latin1");
    execute(printer, latin1String)
    console.log("Print done!");
  } catch (error) {
    console.error("Print failed:", error);
  }
}