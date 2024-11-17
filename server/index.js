import nlp from './nlp.js';
import db from './db.js';
import { auth, login } from './auth.js';
import host from './host.js';

const app = host.setup();

// app.get('/', (req, res) => {
//   res.sendFile(host.getIndexPath());
// });

app.post('/api/user/login', async (req, res) => {
  const params = [req, host.appName, host.appInfo];
  res.json(await login(...params));
});

app.post('*', auth, (req, res, next) => {
  // console.log('POST', req.url, req.user.privs);
  if (req?.user?.privs < 6) {
    next();
  } else {
    res.sendStatus(403);
  }
});

app.get('/api/user/logout', auth, async () => {
  console.log('logging out');
});

app.get('/api/user/info', auth, async (req, res) => {
  const text = await db.getUserText(req.user.id);
  const classes = await db.getClasses();
  res.json({
    ...req.user, text, classes, ...host.appInfo
  });
});

app.post('/api/user/reg', async (req, res) => {
  res.json(await db.createUser(null, req.body, false));
});

app.post('/api/user/add', auth, async (req, res) => {
  res.json(await db.createUser(req.user, req.body, true));
});

app.post('/api/user/activate', auth, async (req, res) => {
  const params = [req.user, req.body?.id, Boolean(req.body?.status)];
  res.json(await db.changeActivationStatus(...params));
});

app.post('/api/user/elevate', auth, async (req, res) => {
  res.json(await db.elevateUser(req.user, req.body?.id, req.body.privs));
});

app.post('/api/user/update', auth, async (req, res) => {
  res.json(await db.updateUser(req.user, req.body));
});

app.post('/api/user/reset', auth, async (req, res) => {
  res.json(await db.resetPassword(req.user, req.body?.id));
});

app.post('/api/user/text', auth, async (req, res) => {
  res.json(await db.selectText(req.user, req.body.id));
});

app.post('/api/text', auth, async (req, res) => {
  res.json(await db.setTextProps(req.user, req.body));
});

app.post('/api/scheme', auth, async (req, res) => {
  res.json(await db.setScheme(req.user, req.body));
});

app.post('/api/tokens', auth, async (req, res) => {
  const params = [
    req.user, req.body.id, req.body.cls,
    req.body.mode, req.body.uid, req.body.sid
  ];
  res.json(await db.processToken(...params));
});

app.get('/api/data', auth, async (req, res) => {
  res.json(await db.getUntagged());
});

app.get('/api/strings', auth, async (req, res) => {
  res.json(await db.getStrings());
});

app.get('/api/fullcomments/:id', auth, async (req, res) => {
  res.json(await db.getFullComments(req.params.id));
});

app.get('/api/comments/:id', auth, async (req, res) => {
  res.json(await db.getComments(req.params.id));
});

app.get('/api/comment/:id', auth, async (req, res) => {
  res.json(await db.getComment(req.params.id));
});

app.post('/api/comment', auth, async (req, res) => {
  res.json(await db.setComment(req.user, req.body));
});

app.post('/api/tag', auth, async (req, res) => {
  res.json(await db.setTag(req.user, req.body.id, req.body.title));
});

app.post('/api/issue', auth, async (req, res) => {
  const params = [req.user, req.body.id, req.body.color, req.body.title];
  res.json(await db.setIssue(...params));
});

app.get('/api/grammar', auth, async (req, res) => {
  res.json(await db.getGrammar());
});

app.get('/api/texts', auth, async (req, res) => {
  res.json(await db.getTexts(req.query.id));
});

app.get('/api/text', auth, async (req, res) => {
  const withGrammar = req.query.grammar === 'true';
  res.json(await db.getText(req.query.id, withGrammar));
});

app.get('/api/titles', auth, async (req, res) => {
  res.json(await db.getCommentsTitles(req.query.id, req.query.chunk));
});

app.post('/api/strings', auth, async (req, res) => {
  res.json(await db.setCommentForString(req.user, req.body));
});

app.post('/api/format', auth, async (req, res) => {
  res.json(await db.setFormatForString(req.user, req.body));
});

app.post('/api/tokencomments', auth, async (req, res) => {
  res.json(await db.setCommentsForToken(req.user, req.body));
});

app.post('/api/commentstrings', auth, async (req, res) => {
  res.json(await db.removeCommentFromString(req.user, req.body));
});

app.get('/api/commentstrings', auth, async (req, res) => {
  res.json(await db.getBoundStringsForComment(req.query));
});

app.get('/api/stringsrange', auth, async (req, res) => {
  res.json(await db.getStringsRange(req.query));
});

app.get('/api/classes', auth, async (req, res) => {
  res.json(await db.getClasses());
});

app.post('/api/classes', auth, async (req, res) => {
  res.json(await db.setClass(req.user, req.body));
});

app.get('/api/textcomments', auth, async (req, res) => {
  res.json(await db.getTextComments(req.query.id));
});

app.get('/api/issues', auth, async (req, res) => {
  res.json(await db.getIssues());
});

app.get('/api/users', auth, async (req, res) => {
  res.json(await db.getUsers(req.query?.id));
});

app.get('/api/tags', auth, async (req, res) => {
  res.json(await db.getTags());
});

app.get('/api/conll', auth, async (req, res) => {
  const corpus = await db.getCorpusAsConll();
  const conll = nlp.convertToConll(corpus);
  res.send(conll);
});

app.get('/api/priority', auth, async (req, res) => {
  res.json(await db.getNextPriority(req.query.id));
});

app.post('/api/source', auth, async (req, res) => {
  res.json(await db.setSource(req.user, req.body));
});

app.get('/api/source', auth, async (req, res) => {
  res.json(await db.getSource(req.query.id));
});

app.get('/api/logs', auth, async (req, res) => {
  res.json(await db.getLogs(req.query));
});

app.get('/api/change', auth, async (req, res) => {
  res.json(await db.getChange(req.query));
});

app.get('/api/history', auth, async (req, res) => {
  const params = ['comments', req.query.id, req.query.limit];
  res.json(await db.getItemHistory(...params));
});

app.get('/api/index', auth, async (req, res) => {
  res.json(await db.getCommentsIndex(req.query.id, req.query.name));
});

app.get('/api/stats', auth, async (req, res) => {
  res.json(await db.getStats(req.query.id));
});

app.get('/api/registration', async (req, res) => {
  const { registration_open: status } = db.getSettingsState();
  res.json({ status });
});

app.post('/api/publish', auth, async (req, res) => {
  res.json(await host.buildSite(req.body.id));
});

app.delete('/api/:table/:id', auth, async (req, res) => {
  // console.log('DELETE params', req.params, 'query', req.query);
  if (req?.user?.privs < 6) {
    return res.sendStatus(403);
  }
  let result = {};
  if (['comments'].includes(req.params.table)) {
    result = await db.deleteById(req.user, req.params.table, req.params.id);
  } else if (req.params.table === 'sources') {
    result = await db.checkCommentsForSource(req.params.id);
    if (!result?.length) {
      result = await db.deleteById(req.user, 'sources', req.params.id);
    }
  } else if (req.params.table === 'classes') {
    result = await db.deleteClass(req.user, req.params.id);
  } else if (req.params.table === 'issues') {
    result = await db.deleteIssue(req.user, req.params.id);
  } else if (req.params.table === 'tags') {
    result = await db.deleteTag(req.user, req.params.id);
  }
  return res.json(result);
});

app.post('/api/backup', auth, async (req, res) => {
  res.json(host.performBackup(req.user));
});

app.get('/api/backup', auth, async (req, res) => {
  res.json(host.listBackups());
});

app.get('/api/backupfile', auth, async (req, res) => {
  const filePath = host.getBackupFilePath(req.query.id);
  if (req?.user?.privs < 6 && filePath) {
    res.download(filePath, (err) => {
      if (err) {
        console.log(err);
        res.status(400).end();
      }
    });
  } else {
    console.log('Backup file does not exist!');
    res.status(400).end();
  }
});

app.post('/api/upload/:id', auth, async (req, res) => {
  const params = await host.saveImage(req.user, req.files, req.params.id);
  res.status(params[0]).send(params[1]);
});

app.get('/api/img/:id', auth, async (req, res) => {
  const id = Number(req.params.id) || 1;
  const result = await db.getImages(id);
  const files = result.map((x) => ({
    ...x, status: 'finished', name: x.id, url: `/api/images/${id}/${x.id}`,
  }));
  res.json(files);
});

app.get('/api/check/:type', auth, async (req, res) => {
  let result = [];
  if (req.params.type === 'img') {
    const url = `/api/images/${req.query.text}/${req.query.id}`;
    result = await db.checkCommentsForImage(url);
  }
  res.json(result);
});

app.post('/api/rename', auth, async (req, res) => {
  res.json(await db.renameImage(req.user, req.body.file.id, req.body.file.title));
});

app.post('/api/unload', auth, async (req, res) => {
  res.json(await host.deleteImage(req.user, req.body.id, req.body?.file));
});

app.get('/api/languages', auth, async (req, res) => {
  res.json(nlp.getLanguages(host.langList, req.query.id));
});

app.post('/api/load', auth, async (req, res) => {
  console.log(Object.entries(req.body).map((x) => `${x[0]}: ${x[0] === 'content' ? `${x[1].length} tokens` : x[1]}`).join(' • '));
  const params = [req.user, req.body.id, req.body.content, req.body.lang, true];
  res.json(await nlp.importText(...params));
});

app.get('/api/settings', auth, async (req, res) => {
  res.json(db.getSettingsState());
});

app.post('/api/settings', auth, async (req, res) => {
  // const currentSettings = await db.getSettings();
  // const newSettings = req.body;
  // if (currentSettings?.imgsizelimit !== newSettings.imgsizelimit || currentSettings?.txtsizelimit !== newSettings.txtsizelimit) {
  //   console.log('limit change -> restart');
  // }
  res.json(await db.updateSettings(req.user, req.body));
});

app.listen(host.port);
console.log(`Running at Port ${host.port}`);
