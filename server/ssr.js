import fs from 'fs';
import path from 'path';
import zip from 'zip-local';
import db from './db.js';

const compileHTML = (params) => `
<!DOCTYPE html>
<html>

<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta charset="utf-8">
  <meta name="keywords" content="annotation, comments">
  <meta name="description" content="${params.site}">
  <title>${params.site}</title>
  <!--
    <link rel="stylesheet" href="mini.css" media="screen">
    <link rel="stylesheet" href="izi.css" media="screen">
    <script type="text/javascript" src="jquery.js"></script>
    <script type="text/javascript" src="izi.js"></script>
   -->
  <meta name="generator" content="FlowerCAT">
  <script type="application/ld+json">{
    "@context": "http://schema.org",
    "@type": "WebSite",
    "name": "${params.title}",
    "url": "${params.url}",
    "description": "${params.site}"
    }</script>
  <meta property="og:title" content="${params.site}">
  <meta property="og:type" content="website">
  <link rel="canonical" href="${params.url}">
  <style>
    ${params.css}
  </style>
  <script type="text/javascript">
    ${params.js}
    $(function () {   // Handler for .ready() called.
      $(".modals").iziModal({"group": "comments", "loop": true});
      $(".choices").iziModal({ "overlayColor": "rgba(0, 0, 0, 0.6)", "padding": 10});
      $(document).on('click', '.btn', function (event) {
        event.preventDefault();
        // console.log("click!", $(this).data("id"));
        $('#ms' + $(this).data("id")).iziModal('open');
      });
      $(document).on('click', '.mult', function (event) {
        event.preventDefault();
        // console.log("click multi!", $(this).data("id"));
        $('#ch' + $(this).data("id")).iziModal('open');
      });
      if("${params.clickable}"){
        $(document).on('click', '.block', function (event) {
          event.preventDefault();
          // console.log("switch!", $(this).data("id"));
          $(".${params.clickable}"+$(this).data("id")).toggleClass("hidden");
          $(".${params.modal}"+$(this).data("id")).toggleClass("hidden");
        });
      }
    });
  </script>
</head>

<body>
  <div class="container centered" >

    <div class="row">
      <h2>${params.site}</h2>
    </div>

    ${params.body}

    <footer>
      <p>${params.credits}</p>
    </footer>
  </div>
    ${params.modals}
    
    ${params.choices}
</body>

</html>
`;

const renderFigure = (figObj) => {
  const caption = figObj?.content?.[0]?.text ? `<figcaption>${figObj?.content?.[0]?.text}</figcaption>` : '';
  return `<figure><img src="${figObj.attrs.src}" />${caption}</figure>`;
};

const renderToken = (form, cid, tip, multi) => (tip ? `<span class="tooltip token mark ${multi ? 'mult' : 'btn'}" aria-label="${tip}" data-id="${cid}">${form}</span>` : `<span class="token">${form}</span>`);

const build = async (currentDir, id, siteDir, filename) => {
  const textId = Number(id);
  if (!textId) {
    return { error: 'no ID' };
  }

  try {
    const pubDir = path.join(siteDir, String(textId));
    const zipPath = path.join(pubDir, filename);
    const cssPath = path.join(currentDir, 'site.css');
    const cssContent = fs.readFileSync(cssPath).toString() + fs.readFileSync(path.join(currentDir, 'node_modules', 'izimodal', 'css', 'iziModal.min.css')).toString();
    const jsContent = fs.readFileSync(path.join(currentDir, 'node_modules', 'jquery', 'dist', 'jquery.min.js')).toString() + fs.readFileSync(path.join(currentDir, 'node_modules', 'izimodal', 'js', 'iziModal.min.js')).toString();

    fs.rmSync(pubDir, { recursive: true, force: true });
    fs.mkdirSync(pubDir, { recursive: true });

    // console.log("request to publish", textId, pubDir);

    const [textsInfo, tokens, comments, sources] = await Promise.all([db.getTexts(textId), db.getText(textId), db.getFullComments(textId, true), db.getSource()]);
    const sourcesDict = Object.assign({}, ...(sources.map((x) => ({ [x.id]: x }))));
    const commentsDict = Object.assign({}, ...(comments.map((x) => ({ [x.id]: x }))));

    const textInfo = textsInfo.shift();
    // console.log('text', textInfo?.scheme);

    const tooltipElement = textInfo?.scheme.find((x) => x.type === 'line')?.id;
    if (!textInfo?.scheme) {
      const error = 'Scheme issue!';
      console.error(error);
      return { error };
    }

    const [modalElement, articleElement] = textInfo.scheme.filter((x) => x.type === 'rich');
    // if (!modalElement || !articleElement) {
    //   const error = 'Rich text type issue!';
    //   console.error(error);
    //   return { error };
    // }
    // rerurn error when crucial elements are not present

    const render = (obj) => {
      const rendermap = (d) => (d?.content ? d.content.map((c) => render(c)).join('') : '');

      if (obj?.type) {
        switch (obj.type) {
          case 'text':
            if (obj?.marks) {
              const cl = obj.marks.map((x) => x?.attrs?.class)?.[0];
              return cl && cl !== 'error' ? `<span class="${cl}">${obj.text}</span>` : '';
            }
            return obj.text;
          case 'figure':
            return renderFigure(obj);
          // case 'image':
          // // console.log(obj.attrs.src);
          //   return `<img src="${obj.attrs.src}" />`;
          // case 'pclassed':
          //   return obj.attrs.class === 'caption' ? `<figcaption>${rendermap(obj)}</figcaption>` : '';
          case 'citation':
            return `<span class="citation" title="${sourcesDict[obj.attrs.id].bibtex.title}">(${sourcesDict[obj.attrs.id].bibtex.id})</span>`;
          case 'paragraph':
            return `<p>${rendermap(obj)}</p>`;
          case 'blockquote':
            return `<div class="blockquote">${rendermap(obj)}</div>`;
          default:
            console.log('error', obj);
            return '';
        }
      }
      return '';
    };

    const compileModal = (cmt) => `
<div id="ms${cmt.id}" class="modals" data-iziModal-title="${cmt.title}"
${cmt?.entry?.[tooltipElement] ? `data-iziModal-subtitle="${cmt.entry[tooltipElement]}"` : ''} >
<div class="content">
<button type="button" data-id="${cmt.id}" class="block ${cmt?.entry?.[articleElement.id]?.content?.[0]?.content ? '' : 'hidden'} ${modalElement.id}${cmt.id}">➜ ${articleElement.title}</button>
<button type="button" data-id="${cmt.id}" class="hidden block ${articleElement.id}${cmt.id} ">➜ ${modalElement.title}</button>
<div class="${modalElement.id}${cmt.id}">${cmt?.entry?.[modalElement.id]?.content.map(render).join('')}</div>
<div class="${articleElement.id}${cmt.id} hidden">${cmt?.entry?.[articleElement.id]?.content.map(render).join('')}</div>
</div>
</div>
`;

    let body = '';
    let paragraph = '';
    let paragraphNumber = 0;
    const choiceModals = {};

    // generating tooltips - start
    tokens.forEach((token) => {
      if (token.p !== paragraphNumber) {
        body += `<div class="row">${paragraph}</div>\n\n`;
        paragraph = '';
        paragraphNumber = token.p;
      }
      if (token.meta !== 'ip') {
        const tips = token.comments.map((x) => [x, commentsDict[x]?.entry?.[tooltipElement]?.trim()]).filter((x) => Boolean(x[1]));

        if (tips?.length) {
          if (tips.length === 1) {
            // commentsDict[commentId]
            paragraph += renderToken(token.form, tips[0][0], tips[0][1]);
          } else {
            // console.log(token.comments, token.id);
            const choiceId = token.comments.join('-');
            const tipString = tips.map((x, i) => `${i + 1}. ${x[1]}`).join(' ');
            if (!choiceModals?.[choiceId]) {
              const buttons = token.comments.map((x) => `<div><button class="btn" data-id="${commentsDict[x].id}" data-izimodal-close="">${commentsDict[x].title}</button></div>`).join('');
              choiceModals[choiceId] = `<div id="ch${choiceId}" class="choices"> ${buttons}</div>`;
            }
            paragraph += renderToken(token.form, choiceId, tipString, true);
          }
        } else {
          paragraph += renderToken(token.form, null, null, token.comments.length - 1);
        }
      }
    });
    // generating tooltips - end

    body += `<div class="row">${paragraph}</div>\n\n`;

    const modals = comments.map(compileModal).join('');
    const choices = Object.values(choiceModals).join('\n');
    const output = compileHTML({
      ...textInfo, js: jsContent, css: cssContent, body, modals, choices, modal: modalElement.id, ...(articleElement?.id && { clickable: articleElement.id })
    });

    fs.writeFileSync(path.join(pubDir, 'index.html'), output);

    const now = Date.now();
    zip.sync.zip(pubDir).compress().save(zipPath);
    const stats = fs.statSync(zipPath);

    await db.updatePubInfo(textId, pubDir, stats.size, now);
    return { bytes: stats.size, dir: pubDir, published: now };
  } catch (genError) {
    console.error(`HTML generation error for text ${textId}`, genError);
    return { error: genError.message };
  }
};

export default {
  build,
};
