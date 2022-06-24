"use strict";
/* eslint-disable no-await-in-loop */

import fs from "fs";
// import path from "path";
import db from './db.js';
// import dotenv from "dotenv";
// dotenv.config();
// import pg from 'pg';
// const { Pool } = pg;
// const pool = new Pool();
// import { fileURLToPath } from "url";
// const __dirname = path.dirname(fileURLToPath(import.meta.url));
const dryRun = false;
// entry point
(async () => {
  console.log("ARGUMENTS: <path> <2-character language code> <text ID> <format>");
  const args = process.argv.slice(2);
  const lang = args[1] && args[1].length === 2 ? args[1] : "en";
  const textId = Number(args[2]) || '';
  const fileFormat = args[3] ? args[3].trim() : "txt";
  const textPath = args[0] || "";
  const message = `• Path: ${textPath}\n• Language: ${lang}\n• ID: ${textId}\n• Format: ${fileFormat}`;
  console.log(message);

  if (!textId) {
    console.error("Text ID is not set! Exiting...");
    process.exit();
  }

  if (dryRun) {
    console.warn("Dry run...");
  }

  if (textPath && fs.existsSync(textPath)) {
    const file = fs.readFileSync(textPath, "utf8");
    await db.deleteFromStrings(textId);

    // const tokens = file.split(/(?<=[ .…!?»\n])/);
    // // console.log(tokens);
    // for (let i = 0; i < tokens.length; i++) {
    //   const t = tokens[i];
    //   if (t !== ' ' && t !== '\n' ){
    //       console.log(`|${t}|`);
    //   }
    // }

    const paragraphs = file.split("\n");
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
              await db.insertIntoStrings(textId, p, sn, token, word, "word");
            }

            if (puncts.length === 1) {
              await db.insertIntoStrings(textId, p, sn, puncts[0], puncts[0], word ? "ip" : "ip+");
            } else {
              const compound = puncts.join("");
              if (compound === "!.." || compound === "?..") {
                await db.insertIntoStrings(textId, p, sn, compound, compound, "ip");
              } else {
                // print only puncts, drop word if int end, remain if in the beginning
                // console.error("■", p, sn, puncts, token);
                const regex = new RegExp(/^[А-Яа-яA-Za-z*-]+$/);

                for (let item of puncts) {
                  if (item.match(regex)) {
                    // if word
                    await db.insertIntoStrings(textId, p, sn, token, item, "word");
                  } else {
                    await db.insertIntoStrings(textId, p, sn, item, item, "ip");
                  }
                }
              }
            }
          } else {
            await db.insertIntoStrings(textId, p, sn, token, token, "word");
          }
        }
        sn++;
      }
    }

    if (!dryRun) {
      await db.setTextLoaded(textId)
    }

  }

  // await pool.end();
  console.log("\nDone!");
})();
