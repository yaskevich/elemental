"use strict";
/* eslint-disable no-await-in-loop */

import fs from "fs";
import path from "path";

import dotenv from "dotenv";
dotenv.config();

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();

import { fileURLToPath } from "url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));

const lang = "ru";
const textId = 2;

// entry point
(async () => {
  const args = process.argv.slice(2);
  console.log(args[0]);

  const insert = async (pnum, snum, form, repr, type) => {
    const token = repr.toLowerCase();
    let tokenId = 0;
    const values = [token, lang];
    let result = {};

    result = await pool.query("SELECT id from tokens where token = $1 and lang = $2", values);

    if (!result?.rows?.length) {
      result = await pool.query(`INSERT INTO tokens (token, lang, meta) VALUES($1, $2, $3) RETURNING id`, [token, lang, type]);
    }

    tokenId = result.rows[0]?.["id"];

    try {
      result = await pool.query(`INSERT INTO strings (text_id, p, s, form, repr, token_id) VALUES($1, $2, $3, $4, $5, $6) RETURNING id`, [textId, pnum, snum, form, repr, tokenId]);

      console.log(result);
    } catch (error) {
      console.error(error);
    }
    // process.exit();
    // console.log(pnum, snum, { form: form, repr: repr, type: type });
  };

  if (args[0] && fs.existsSync(args[0])) {
    const file = fs.readFileSync(args[0], "utf8");
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
        console.log("•", sentences[s]);
        const sent = sentences[s].split(" ");
        for (let token of sent.filter(x => x)) {
          const withPuncts = token.split(/([^А-Яа-яA-Za-z\*\-])/);
          if (withPuncts.length > 1) {
            const word = withPuncts.shift();
            const puncts = withPuncts.filter(x => x);
            if (word) {
              await insert(p, sn, token, word, "word");
            }

            if (puncts.length === 1) {
              await insert(p, sn, puncts[0], puncts[0], word ? "pt" : "pt+");
            } else {
              const compound = puncts.join("");
              if (compound === "!.." || compound === "?..") {
                await insert(p, sn, compound, compound, "pt");
              } else {
                // print only puncts, drop word if int end, remain if in the beginning
                // console.error("■", p, sn, puncts, token);
                const regex = new RegExp(/^[А-Яа-яA-Za-z*-]+$/);

                for (let item of puncts) {
                  if (item.match(regex)) {
                    // if word
                    await insert(p, sn, token, item, "word");
                  } else {
                    await insert(p, sn, item, item, "pt");
                  }
                }
              }
            }
          } else {
            await insert(p, sn, token, token, "word");
          }
        }
        sn++;
      }
    }
  }

  // await pool.end();
})();
