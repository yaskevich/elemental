import { load } from 'cheerio';
import db from './db.js';

const xpos2upos = {
  vb: 'VERB',
  vi: 'VERB',
  vg: 'VERB',
  nn: 'NOUN',
  np: 'PROPN',
  nb: 'X', // non Belarusian
  nw: 'X', // non-word
  part: 'PART',
  nm: 'NUM',
  aj: 'ADJ',
  va: 'VERB', // "дзеепрыметнік"
  av: 'ADV',
  pn: 'PRON',
  pp: 'ADP',
  cj: 'CONJ',
  intj: 'INTJ',
  det: 'DET',
  aux: 'AUX',
  prad: 'ADV', // "займ. прысл"
  mod: 'ADV', // "мадыфікатар"
  ip: 'PUNCT',
};

const sconj = ['што', 'калі', 'бо', 'то', 'хоць', 'дык', 'покі', 'каб', 'пакуль', 'або', 'таксама', 'нібы', 'затое', 'абы', 'нібыта', 'шчоб', 'быццам'];

const cconj = ['а', 'і', 'але', 'ды', 'ні', 'дый', 'ці', 'прычым', 'аднак'];

export default {
  async importText(isWeb, textId, langCode, text, dryRun) {
    let [paragraphsNumber, sentencesNumber, tokensNumber] = [0, 0, 0];
    let textInfo = {};

    const insertToken = async (pnum, snum, form, repr, type) => {
      if (dryRun) {
        if (!isWeb) {
          console.log(pnum, snum, form, repr, type);
        }
      } else {
        await db.insertIntoStrings(textId, langCode, pnum, snum, form, repr, type);
      }
      tokensNumber++;
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
      paragraphs = text.split('\n');
      paragraphsNumber = paragraphs.length;
      // console.log(paragraphsNumber);
    } catch (error) {
      console.error(error);
    }

    for (let p = 0; p < paragraphsNumber; p++) {
      // console.log(paragraphs[p], "==");
      // const sentences = paragraphs[p].split(/([.…!?,:;«»]+)/);
      const sentences = paragraphs[p].split(/(?<=[.…!?»])\s+(?=[«–А-ЯЎІЁ])/);
      const sentencesLength = sentences.length;
      // console.log(sentences);
      for (let s = 0; s < sentencesLength; s++) {
        // enable print to debug
        // console.log("•", sentences[s]);
        if (!isWeb) {
          process.stdout.write(`${sentencesNumber}\r`);
        }
        const sent = sentences[s].split(' ');
        for (const token of sent.filter((x) => x)) {
          const withPuncts = token.split(/([^А-Яа-яA-Za-z0-9\*\-])/);
          if (withPuncts.length > 1) {
            const word = withPuncts.shift();
            const puncts = withPuncts.filter((x) => x);
            if (word) {
              await insertToken(p, sentencesNumber, token, word, 'word');
            }

            if (puncts.length === 1) {
              await insertToken(p, sentencesNumber, puncts[0], puncts[0], word ? 'ip' : 'ip+');
            } else {
              const compound = puncts.join('');
              if (compound === '!..' || compound === '?..') {
                await insertToken(p, sentencesNumber, compound, compound, 'ip');
              } else {
                // print only puncts, drop word if int end, remain if in the beginning
                // console.error("■", p, sentencesNumber, puncts, token);
                const regex = new RegExp(/^[А-Яа-яA-Za-z*-]+$/);

                for (const item of puncts) {
                  if (item.match(regex)) {
                    // if word
                    await insertToken(p, sentencesNumber, token, item, 'word');
                  } else {
                    await insertToken(p, sentencesNumber, item, item, 'ip');
                  }
                }
              }
            }
          } else {
            await insertToken(p, sentencesNumber, token, token, 'word');
          }
        }
        sentencesNumber++;
      }
    }

    if (!dryRun) {
      textInfo = await db.setTextLoaded(textId);
    } else {
      textInfo = await db.getTexts(textId);
    }

    // await pool.end();
    return {
      ...textInfo?.[0],
      stats: {
        tokens: tokensNumber,
        sentences: sentencesNumber,
        paragraphs: paragraphsNumber
      }
    };
  },
  convertToConll(corpus) {
    // console.log(corpus[0]);
    // res.send('random.text');
    const corpusCodeId = 'kolas-uph';
    let result = '# newdoc\n';
    let sentenceId = 0;
    let stack = [];
    for (let i = 0; i <= corpus.length; i++) {
      if (i === corpus.length || corpus[i].s !== sentenceId) {
        // console.log("--", sent_id,  corpus[i]["s"]);
        // console.log(stack);

        // # sent_id = telegraf-2011032001-3-1-be
        const tokens = stack.filter((x) => x.cl !== 'ip').map((x) => x.v);
        result += `# sent_id = ${corpusCodeId}-${sentenceId}-be\n`;
        result += `# text = ${tokens.join(' ')}\n`;
        result += '# genre = fiction\n';

        for (let ii = 0; ii < stack.length; ii++) {
          const xpos = stack[ii].cl;
          let tag = xpos2upos[xpos];
          if (tag === 'CONJ') {
            if (sconj.includes(xpos)) {
              tag = 'SCONJ';
            }
            if (cconj.includes(xpos)) {
              tag = 'CCONJ';
            }
          }

          result += `${ii + 1}\t${stack[ii].repr}\t${stack[ii].utoken}\t${tag}\t${xpos.toUpperCase()}\n`;
        }

        if (i !== corpus.length) {
          sentenceId = corpus[i].s;
          stack = [];
        }
      }
      stack.push(corpus[i]);
    }
    return result;
  },
  processTEI(content, format) {
    const $ = load(content, { normalizeWhitespace: true, xmlMode: true });
    const title = $('TEI teiHeader fileDesc titleStmt title[type="work"]').text();
    const author = $('TEI teiHeader fileDesc titleStmt author persName').text();

    console.log(title, author);
    let numbering = 0;
    $('TEI text body > div1').each((i, elem) => {
      // console.log(i, elem.name);
      $(elem).children().each((i2, lvl2) => {
        if (lvl2.name === 'sp') {
          const attr = $(lvl2).attr('who');
          // console.log(i2, lvl2.name);
          const speaker = $(lvl2).find('>speaker');
          console.log(attr, speaker.text());
          $(lvl2).children().each((i3, lvl3) => {
            // console.log(lvl3.name);
            if (lvl3.name === 'l') {
              const num = $(lvl3).attr('n');
              if (num) {
                numbering = num;
              } else {
                numbering++;
              }

              console.log(`${numbering}: ${$(lvl3).text()}`);
            }
          });
        }
      });
    });
    return format;
  },
};
