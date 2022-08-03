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
  <link rel="stylesheet" href="mini.css" media="screen">
  <link rel="stylesheet" href="site.css" media="screen">
  <!-- <link rel="stylesheet" href="https://unpkg.com/@picocss/pico@latest/css/pico.min.css"> -->
  <script type="text/javascript" src="jquery.js"></script>
  <script type="text/javascript" src="izi.js"></script>
  <link rel="stylesheet" href="izi.css" media="screen">
  <meta name="generator" content="FlowerCAT">
  <script type="application/ld+json">{
    "@context": "http://schema.org",
    "@type": "Organization",
    "name": "",
    "url": "https://example.com/index.html"
    }</script>
  <meta property="og:title" content="${params.site}">
  <meta property="og:type" content="website">
  <link rel="canonical" href="https://example.com/index.html">
  <style>
  </style>
  <script type="text/javascript">
    $(function () {   // Handler for .ready() called.
      $(".modals").iziModal();
      $(document).on('click', '.btn', function (event) {
        event.preventDefault();
        console.log("click!", $(this).data("id"));
        $('#ms' + $(this).data("id")).iziModal('open');
      });
    });
  </script>
</head>

<body>
  <div class="container responsive-margin">

    <div class="row">
      <h2>${params.site}</h2>
    </div>

    ${params.body}

    <footer>
      <p>${params.credits}</p>
    </footer>
  </div>
    ${params.modals}
</body>

</html>
`;

const build = async (currentDir, id, siteDir, filename) => {
  const textId = Number(id);
  if (!textId) {
    return { error: 'no ID' };
  }

  try {
    const pubDir = path.join(siteDir, String(textId));
    const zipPath = path.join(pubDir, filename);
    const cssPath = path.join(currentDir, 'site.css');

    fs.rmSync(pubDir, { recursive: true, force: true });
    fs.mkdirSync(pubDir, { recursive: true });

    // console.log("request to publish", textId, pubDir);

    const [textInfo, tokens, comments, sources] = await Promise.all([db.getTexts(textId), db.getText(textId), db.getFullComments(textId), db.getSource()]);
    const sourcesDict = Object.assign({}, ...(sources.map((x) => ({ [x.id]: x }))));
    const commentsDict = Object.assign({}, ...(comments.map((x) => ({ [x.id]: x }))));
    // console.log(commentsDict);
    // console.log(sourcesDict);

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
          case 'image':
          // console.log(obj.attrs.src);
            return `<img src="${obj.attrs.src}" />`;
          case 'pclassed':
            return obj.attrs.class === 'caption' ? `<figcaption>${rendermap(obj)}</figcaption>` : '';
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
data-iziModal-subtitle="${cmt?.entry?.trans ? cmt.entry.trans : '🙁'}"
data-iziModal-icon="icon-home" data-iziModal-fullscreen="true" style="padding: 5px;">
<div style="padding: 10px;">  ${cmt?.entry?.brief?.content.map(render).join('')}</div>
</div>`;

    let body = '';
    let paragraph = '';
    let p = 0;

    // generating tooltips - start
    tokens.forEach((token) => {
      if (token.p !== p) {
        body += `<div class="row">${paragraph}</div>\n\n`;
        paragraph = '';
        p = token.p;
      }
      if (token.meta !== 'ip') {
        const commentId = token.comments?.[0];
        const trans = commentsDict[commentId]?.entry?.trans || '';
        // && commentsDict[commentId].published
        const tooltipInfo = trans ? ['tooltip', `aria-label="${trans}"`] : ['', ''];

        paragraph += (commentId ? `<span class="${tooltipInfo[0]} token mark btn" ${tooltipInfo[1]} data-id="${commentId}">${token.form}</span>` : `<span class="token">${token.form}</span>`);
      }
    });
    // generating tooltips - end

    body += `<div class="row"> ${paragraph} </div>\n\n`;

    const modals = comments.map(compileModal);
    const output = compileHTML({ ...textInfo.shift(), body, modals });

    fs.writeFileSync(path.join(pubDir, 'index.html'), output);
    fs.copyFileSync(cssPath, path.join(pubDir, 'site.css'));
    fs.copyFileSync(path.join(currentDir, 'node_modules', 'mini.css', 'dist', 'mini-default.min.css'), path.join(pubDir, 'mini.css'));
    fs.copyFileSync(path.join(currentDir, 'node_modules', 'jquery', 'dist', 'jquery.min.js'), path.join(pubDir, 'jquery.js'));
    fs.copyFileSync(path.join(currentDir, 'node_modules', 'izimodal', 'js', 'iziModal.min.js'), path.join(pubDir, 'izi.js'));
    fs.copyFileSync(path.join(currentDir, 'node_modules', 'izimodal', 'css', 'iziModal.min.css'), path.join(pubDir, 'izi.css'));

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
