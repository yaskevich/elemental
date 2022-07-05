import fs from 'fs';
import args from 'args';
import nlp from './nlp.js';

args
  .option('path', 'Path to file with text', '')
  .option('lang', 'Two-letter language code', 'en')
  .option('id', 'Text ID from UI (number)')
  .option('format', 'Text file format', 'txt')
  .option('dry', 'Dry run', false);
// .example('--path ./essay.txt --lang fr id 5 format html --dry', '');

const flags = args.parse(process.argv);
// console.log(flags);
console.log(
  `To get details about available arguments run: node converter.js --help
• Path: ${flags.path}
• Language: ${flags.lang}
• ID: ${flags.id}
• Format: ${flags.format}
• Dry run: ${flags.dry}`,
);

if (!(flags.path && fs.existsSync(flags.path))) {
  console.error('>> Wrong path! Exiting...');
  process.exit();
}

if (!flags.dry && !flags.id) {
  console.error('>> Text ID is not set! Exiting...');
  process.exit();
}

if (flags.dry) {
  console.warn('\nThis is DRY RUN (no changes will be saved to database)');
}

const content = fs.readFileSync(flags.path, 'utf8');

if (flags.format === 'txt') {
  const result = await nlp.importText(false, flags.id, flags.lang, content, flags.dry);
  console.log(result);
} else if (flags.format === 'perseus') {
  console.log('Format: Perseus XML');
  const result = await nlp.processTEI(content, flags.format);
  console.log(result);
}

console.log('\nDone!');
process.exit();
