'use strict';
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

const sconj  = ['што', 'калі', 'бо', 'то', 'хоць', 'дык', 'покі', 'каб', 'пакуль', 'або', 'таксама', 'нібы', 'затое', 'абы', 'нібыта', 'шчоб', 'быццам'];

const cconj = ['а', 'і', 'але', 'ды', 'ні', 'дый', 'ці', 'прычым', 'аднак'];


export default {
  convertToConll(corpus){
    // console.log(corpus[0]);
    // res.send('random.text');
    let result = '# newdoc\n';
    let sent_id = 0;
    let stack = [];
    for (var i = 0; i <= corpus.length; i++) {
      if (i === corpus.length || corpus[i]["s"] != sent_id) {
        // console.log("--", sent_id,  corpus[i]["s"]);
        // console.log(stack);

        // # sent_id = telegraf-2011032001-3-1-be
        const tokens  = stack.filter(x => x.cl != 'ip').map(x => x.v);
        result +=  "# sent_id = " + "kolas-uph-"+ sent_id+"-be\n";
        result += "# text = "+tokens.join(' ') + "\n";
        result += "# genre = fiction\n";

        for (var ii = 0; ii < stack.length; ii++) {
          let xpos  = stack[ii]["cl"];
          let tag = xpos2upos[xpos]
              if (tag == "CONJ"){
                if (sconj.includes(xpos)) {
                  tag = "SCONJ";
                }
                if (cconj.includes(xpos)) {
                  tag = "CCONJ";
                }
            }

          result += (ii+1) + "\t"  + stack[ii]["repr"] + "\t"+ stack[ii]["utoken"]  + "\t"+tag+"\t"+ xpos.toUpperCase()  + "\n";
        }

        if (i !== corpus.length){
          sent_id = corpus[i]["s"];
          stack = [];
        }
      }
      stack.push(corpus[i])
    }
    return result;
  },
}
