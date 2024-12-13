import fs from 'fs';
import path from 'path';
import { zipSync, strToU8 } from 'fflate';
import db from './db.js';

const zipName = 'site.zip';
const imagesSubdir = 'res';
const indexFile = 'index.html';

const compileHTML = (params) => `
<!DOCTYPE html>
<html>

<head>
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <meta charset="utf-8">
  <meta name="keywords" content="annotation, comments">
  <meta name="description" content="${params.site}">
  <title>${params.site || params.title}</title>
  <!--
    <link rel="stylesheet" href="mini.css" media="screen">
    <link rel="stylesheet" href="izi.css" media="screen">
    <script type="text/javascript" src="jquery.js"></script>
    <script type="text/javascript" src="izi.js"></script>
   -->
  <meta name="generator" content="Elemental">
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
    .mark {
      background: ${params.colormark};
    }
    .highlighted {
      background-color: ${params.colorselect};
    }
    ${params.css}
  </style>
  <script type="text/javascript">
    ${params.js}
    $(function () {   // Handler for .ready() called.
      $(".modals").iziModal({
        "group": "comments",
        "loop": true,
        "headerColor": '#729db6',
        onOpening: function(){
        },
        onOpened: function(e){
          $('.highlighted').removeClass('highlighted');
          var id = e.id.slice(2);
          var el = $('span.mark[data-id="'+id+'"]');
          console.log('closed', id, !!el.length);

          if (!el.length){
            el = $('span.mark[data-id*="-'+ id + '-"');
            console.log('alt', id, el.length);
          }

          if (el.length){
            el.addClass("highlighted");
            el[0].scrollIntoView({
              behavior: 'smooth',
              block: 'center',
            });
          }
        }
      });
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
      <div class="${params.siteclass}">${params.site}</div>
    </div>

    ${params.body}

    <footer>
      <p class="${params.creditsclass}">${params.credits}</p>
    </footer>
  </div>
${params.modals}
${params.choices}
</body>

</html>
`;

const renderFigure = (figObj) => {
  const caption = figObj?.content?.[0]?.text ? `<figcaption>${figObj?.content?.[0]?.text}</figcaption>` : '';
  return `<figure><img src="${imagesSubdir}/${path.basename(figObj.attrs.src)}" />${caption}</figure>`;
};

const escape = (str) => str.replaceAll("'", '&apos;').replaceAll('"', '&quot;');

const build = async (currentDir, id, siteDir, imagesDir) => {
  const textId = Number(id);
  if (!textId) {
    return { error: 'no ID' };
  }

  try {
    const pubDir = path.join(siteDir, String(textId));
    const imgDir = path.join(imagesDir, String(textId));
    const zipPath = path.join(pubDir, zipName);
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
    // ${}

    const isGlued = (tkn) => {
      if (tkn?.meta === 'ip') {
        return ['«', '('].includes(tkn?.repr) ? 'left' : 'right';
      }
      return '';
    };

    const renderToken = (nl, num, cid, tip, multi) => {
      const mode = multi ? 'mult' : 'btn';
      const nextToken = tokens?.[num + 1];
      const prevToken = tokens?.[num - 1];
      const curToken = tokens?.[num];

      const { repr } = curToken;
      const typePlus = isGlued(nextToken);
      const typeMinus = isGlued(prevToken);
      let classes = isGlued(curToken);
      let prefix = '';
      let postfix = '';

      if (typePlus === 'right') {
        if (typeMinus !== 'left') {
          classes = curToken.meta === 'ip' ? '' : 'left';
        } else {
          classes = curToken.meta === 'ip' ? '' : 'middle';
        }
      }

      if (!classes) {
        if (typeMinus === 'left') {
          classes = 'right';
        } else {
          classes = curToken.meta === 'ip' ? '' : 'token';
        }
      }

      if (classes === 'left') {
        prefix = '<span class="solid">';
      } else if (classes === 'right') {
        postfix = '</span>';
      }

      if (nl) {
        classes += ' newline ';
      }

      classes += ` ${curToken.fmt.join(' ')}`;
      const start = `<span class="${classes}`;
      const middle = tip ? ` tooltip mark ${mode}" aria-label="${tip}" data-id="${cid}` : '';
      const result = classes === 'right' && !tip ? repr : `${`${start + middle}">${repr}`}</span>`;
      return `${prefix}${result}${postfix}`;
    };

    const tooltipElement = textInfo?.scheme?.find((x) => x.type === 'line')?.id;
    // if (!textInfo?.scheme) {
    //   const error = 'Scheme issue!';
    //   console.error(error);
    //   return { error };
    // }

    const [modalElement, articleElement] = textInfo?.scheme ? textInfo.scheme.filter((x) => x.type === 'rich') : [];

    const render = (obj) => {
      const rendermap = (d) => (d?.content ? d.content.map((c) => render(c)).join('') : '');

      if (obj?.type) {
        switch (obj.type) {
          case 'text':
            if (obj?.marks) {
              const classes = obj.marks.map((x) => x?.attrs?.class || x?.type);
              return classes.length && !classes.includes('error') ? `<span class="${classes.join(' ')}">${escape(obj?.text)}</span>` : '';
            }
            return escape(obj.text);
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
<div class="${modalElement.id}${cmt.id}">${cmt?.entry?.[modalElement?.id]?.content?.map(render).join('') || ''}</div>
${articleElement?.id ? `
<div class="${articleElement.id}${cmt.id} hidden">${cmt?.entry?.[articleElement.id]?.content.map(render).join('')}</div>
<button type="button" data-id="${cmt.id}" class="block ${cmt?.entry?.[articleElement.id]?.content?.[0]?.content ? '' : 'hidden'} ${modalElement.id}${cmt.id}">➜ ${articleElement.title}</button>
<button type="button" data-id="${cmt.id}" class="hidden block ${articleElement.id}${cmt.id} ">➜ ${modalElement.title}</button>` : ''}
</div></div>
`;

    let body = '';
    let paragraph = '';
    let paragraphNumber = 0;
    const choiceModals = {};

    // generating tooltips - start
    tokens.forEach((token, index) => {
      const isNewline = token.p !== paragraphNumber;
      if (isNewline) {
        body += `<div class="row">${paragraph}</div>\n\n`;
        paragraph = '';
        paragraphNumber = token.p;
      }
      // if (token.meta !== 'ip') {
      const publishedComments = token.comments.sort((a, b) => a - b).filter((x) => commentsDict?.[x]);
      const tips = publishedComments.map((x) => [x, commentsDict[x]?.entry?.[tooltipElement]?.trim()]).filter((x) => Boolean(x[1]));

      let choiceId = publishedComments.join('-');
      choiceId = choiceId ? `-${choiceId}-` : '';

      if (publishedComments?.length > 1 && !choiceModals?.[choiceId]) {
        const buttons = publishedComments.map((x) => `<div><button class="btn" data-id="${commentsDict[x].id}" data-izimodal-close="">${commentsDict[x].title}</button></div>`).join('');
        choiceModals[choiceId] = `<div id="ch${choiceId}" class="choices"> ${buttons}</div>`;
      }

      if (tips?.length) {
        if (tips.length === 1) {
          // commentsDict[commentId]
          paragraph += renderToken(isNewline, index, tips[0][0], tips[0][1]);
        } else {
          // console.log(token.comments, token.id);
          const tipString = tips.map((x, i) => `${i + 1}. ${x[1]}`).join(' ');
          paragraph += renderToken(isNewline, index, choiceId, tipString, true);
        }
      } else {
        paragraph += renderToken(isNewline, index, null, null, publishedComments.length > 1);
      }
      // }
    });
    // generating tooltips - end

    body += `<div class="row">${paragraph}</div>\n\n`;

    const output = compileHTML({
      ...textInfo,
      js: jsContent,
      css: cssContent,
      body,
      choices: Object.values(choiceModals).join('\n'),
      modal: modalElement?.id,
      modals: modalElement?.id ? comments.map(compileModal).join('') : '',
      ...(articleElement?.id && { clickable: articleElement.id })
    });

    fs.writeFileSync(path.join(pubDir, indexFile), output);

    fs.symlinkSync(imgDir, path.join(pubDir, imagesSubdir), 'dir');
    const now = Date.now();
    // zip.sync.zip(pubDir).compress().save(zipPath);

    const imagesList = fs.existsSync(imgDir) ? Object.assign({}, ...fs.readdirSync(imgDir).map((x) => ({
      [x]: [fs.readFileSync(path.join(imgDir, x)), { level: 0 }]
    }))) : [];

    const zipped = zipSync({ [imagesSubdir]: { ...imagesList }, [indexFile]: [strToU8(output), { level: 9 }] });

    fs.writeFileSync(zipPath, zipped);

    const stats = fs.statSync(zipPath);
    // const size = output.length; // stats.size
    const { size } = stats;

    await db.updatePubInfo(textId, size, now);
    return { bytes: size, dir: pubDir, published: now };
  } catch (genError) {
    console.error(`HTML generation error for text ${textId}`, genError);
    return { error: genError.message };
  }
};

export default {
  build,
};
