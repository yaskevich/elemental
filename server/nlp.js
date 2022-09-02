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
  async importText(isWeb, textId, content, language) {
    const tokensCount = content.length;
    await db.deleteFromStrings(textId);
    /* eslint-disable no-restricted-syntax */
    for (const [i, item] of content.entries()) {
      // { p: 45, s: 150, form: 'receive', repr: 'receive', meta: 'word' }
      // console.log(item);
      /* eslint-disable no-await-in-loop */
      await db.insertIntoStrings(textId, language, item.p, item.s, item.form, item.repr, item.meta);
      if (!isWeb) {
        process.stdout.write(`${i}/${tokensCount}\r`);
      }
    }
    // await pool.end();
    return db.setTextLoaded(textId);
  },
};
