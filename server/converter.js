/* eslint-disable no-await-in-loop */
// import path from "path";
import fs from "fs";
import args from 'args';
import db from './db.js';
// import dotenv from "dotenv";
// dotenv.config();
// import pg from 'pg';
// const { Pool } = pg;
// const pool = new Pool();
// import { fileURLToPath } from "url";
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
// entry point

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
• Dry run: ${flags.dry}`
);

if (!(flags.path && fs.existsSync(flags.path))) {
  console.error(">> Wrong path! Exiting...");
  process.exit();
}

if (!flags.id) {
  console.error(">> Text ID is not set! Exiting...");
  process.exit();
}

if (flags.dry) {
  console.warn("\nThis is DRY RUN (no changes will be saved to database)");
}

const insertToken = async (pnum, snum, form, repr, type) => {
  if (flags.dry) {
    console.log(pnum, snum, form, repr, type);
  } else {
    await db.insertIntoStrings(flags.id, flags.lang, pnum, snum, form, repr, type);
  }
};

if (!flags.dry) {
  await db.deleteFromStrings(flags.id);
}

// const tokens = file.split(/(?<=[ .…!?»\n])/);
// // console.log(tokens);
// for (let i = 0; i < tokens.length; i++) {
//   const t = tokens[i];
//   if (t !== ' ' && t !== '\n' ){
//       console.log(`|${t}|`);
//   }
// }

let paragraphs = [];

try {
  paragraphs = fs.readFileSync(flags.path, "utf8").split("\n");
} catch (error) {
  console.error(error);
}

const paragraphsLength = paragraphs.length;
let sn = 0;

for (let p = 0; p < paragraphsLength; p++) {
  // console.log(paragraphs[p], "==");
  // const sentences = paragraphs[p].split(/([.…!?,:;«»]+)/);
  const sentences = paragraphs[p].split(/(?<=[.…!?»])\s+(?=[«–А-ЯЎІЁ])/);
  const sentencesLength = sentences.length;
  // console.log(sentences);
  for (let s = 0; s < sentencesLength; s++) {
    // enable print to debug
    // console.log("•", sentences[s]);
    process.stdout.write(sn + "\r");
    const sent = sentences[s].split(" ");
    for (let token of sent.filter(x => x)) {
      const withPuncts = token.split(/([^А-Яа-яA-Za-z\*\-])/);
      if (withPuncts.length > 1) {
        const word = withPuncts.shift();
        const puncts = withPuncts.filter(x => x);
        if (word) {
          await insertToken(p, sn, token, word, "word");
        }

        if (puncts.length === 1) {
          await insertToken(p, sn, puncts[0], puncts[0], word ? "ip" : "ip+");
        } else {
          const compound = puncts.join("");
          if (compound === "!.." || compound === "?..") {
            await insertToken(p, sn, compound, compound, "ip");
          } else {
            // print only puncts, drop word if int end, remain if in the beginning
            // console.error("■", p, sn, puncts, token);
            const regex = new RegExp(/^[А-Яа-яA-Za-z*-]+$/);

            for (let item of puncts) {
              if (item.match(regex)) {
                // if word
                await insertToken(p, sn, token, item, "word");
              } else {
                await insertToken(p, sn, item, item, "ip");
              }
            }
          }
        }
      } else {
        await insertToken(p, sn, token, token, "word");
      }
    }
    sn++;
  }
}

if (!flags.dry) {
  await db.setTextLoaded(flags.id);
}

// await pool.end();
console.log("\nDone!");
process.exit();
