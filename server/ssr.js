import fs from 'fs';
import path from 'path';
import zip from 'zip-local';
import mustache from 'mustache';
import db from './db.js';

export default {
  async render(currentDir, id, siteDir, filename) {
    const textId = Number(id);
    if (!textId) {
      return { error: 'no ID' };
    }

    try {
      const pubDir = path.join(siteDir, String(textId));
      const zipPath = path.join(pubDir, filename);
      const templatePath = path.join(currentDir, 'reader.html');
      const template = fs.readFileSync(templatePath, 'utf8');

      fs.rmSync(pubDir, { recursive: true, force: true });
      fs.mkdirSync(pubDir, { recursive: true });

      // console.log("request to publish", textId, pubDir);

      const [textInfo, tokens, comments, sources] = await Promise.all([db.getTexts(textId), db.getText(textId), db.getFullComments(textId), db.getSource()]);
      const sourcesDict = Object.assign({}, ...(sources.map((x) => ({ [x.id]: x }))));
      const commentsDict = Object.assign({}, ...(comments.map((x) => ({ [x.id]: x }))));
      // console.log(commentsDict);
      // console.log(sourcesDict);

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

      const output = mustache.render(template, {
        ...textInfo.shift(),
        body,
        comments,
        process() {
          switch (this.type) {
            case 'text':
              if (this?.marks) {
                const cl = this.marks.map((x) => x?.attrs?.class)?.[0];
                return cl && cl !== 'error' ? `<span class="${cl}">${this.text}</span>` : '';
              }
              return this.text;
            case 'citation':
              return `<span class="citation" title="${sourcesDict[this.attrs.id].bibtex.title}">(${sourcesDict[this.attrs.id].bibtex.id})</span>`;
            default:
              //   console.log('error', this.type);
              return '';
          }
        }
      });

      fs.writeFileSync(path.join(pubDir, 'index.html'), output);
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
  },
};
