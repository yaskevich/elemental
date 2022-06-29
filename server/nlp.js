/* eslint-disable no-await-in-loop */
/* eslint-disable max-params */

import db from './db.js';

const xpos2upos = {
  'vb': "VERB",
  'vi': "VERB",
  'vg': "VERB",
  'nn': "NOUN",
  'np': "PROPN",
  'nb': "X", // non Belarusian
  'nw': "X", // non-word
  'part': "PART",
  'nm': "NUM",
  'aj': "ADJ",
  'va': "VERB", // "дзеепрыметнік"
  'av': "ADV",
  'pn': "PRON",
  'pp': "ADP",
  'cj': "CONJ",
  'intj': "INTJ",
  'det': "DET",
  'aux': "AUX",
  'prad': "ADV", // "займ. прысл"
  'mod': "ADV", // "мадыфікатар"
  'ip': "PUNCT"
};

const sconj = ['што', 'калі', 'бо', 'то', 'хоць', 'дык', 'покі', 'каб', 'пакуль', 'або', 'таксама', 'нібы', 'затое', 'абы', 'нібыта', 'шчоб', 'быццам'];

const cconj = ['а', 'і', 'але', 'ды', 'ні', 'дый', 'ці', 'прычым', 'аднак'];


export default {
  async importText(isWeb, textId, langCode, text, dryRun) {

    const insertToken = async (pnum, snum, form, repr, type) => {
      if (dryRun) {
        console.log(pnum, snum, form, repr, type);
      } else {
        await db.insertIntoStrings(textId, langCode, pnum, snum, form, repr, type);
      }
    };

    if (!dryRun) {
      await db.deleteFromStrings(textId);
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
      paragraphs = text.split("\n");
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

    if (!dryRun) {
      await db.setTextLoaded(textId);
    }

    // await pool.end();

  },
  convertToConll(corpus) {
    // console.log(corpus[0]);
    // res.send('random.text');
    let result = '# newdoc\n';
    let sent_id = 0;
    let stack = [];
    for (var i = 0; i <= corpus.length; i++) {
      if (i === corpus.length || corpus[i]["s"] !== sent_id) {
        // console.log("--", sent_id,  corpus[i]["s"]);
        // console.log(stack);

        // # sent_id = telegraf-2011032001-3-1-be
        const tokens = stack.filter(x => x.cl !== 'ip').map(x => x.v);
        result += "# sent_id = " + "kolas-uph-" + sent_id + "-be\n";
        result += "# text = " + tokens.join(' ') + "\n";
        result += "# genre = fiction\n";

        for (var ii = 0; ii < stack.length; ii++) {
          let xpos = stack[ii]["cl"];
          let tag = xpos2upos[xpos];
          if (tag === "CONJ") {
            if (sconj.includes(xpos)) {
              tag = "SCONJ";
            }
            if (cconj.includes(xpos)) {
              tag = "CCONJ";
            }
          }

          result += (ii + 1) + "\t" + stack[ii]["repr"] + "\t" + stack[ii]["utoken"] + "\t" + tag + "\t" + xpos.toUpperCase() + "\n";
        }

        if (i !== corpus.length) {
          sent_id = corpus[i]["s"];
          stack = [];
        }
      }
      stack.push(corpus[i]);
    }
    return result;
  },
};
