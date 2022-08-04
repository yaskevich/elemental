import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import fileUpload from 'express-fileupload';
import fs from 'fs';
import { execSync } from 'child_process';
import { gzipSync } from 'zlib';
import history from 'connect-history-api-fallback';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import path from 'path';
import { fileURLToPath } from 'url';
import nlp from './nlp.js';
import db from './db.js';
import ssr from './ssr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
const __locales = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales.json'), 'utf8'));
// https://github.com/TiagoDanin/Locale-Codes/blob/master/documentation.md
const backupDir = path.join(__dirname, 'backup');
const publicDir = path.join(__dirname, 'public');
const siteDir = path.join(__dirname, 'sites');
const imgDir = path.join(__dirname, 'images');
fs.mkdirSync(backupDir, { recursive: true });
fs.mkdirSync(imgDir, { recursive: true });
fs.mkdirSync(siteDir, { recursive: true });

const app = express();
const zipName = 'site.zip';
const port = process.env.PORT || 8080;
const appName = __package?.name || String(port);
const imageFileLimit = Number(process.env.IMGLIMIT) || 1024 * 1024; // 1 MB
const JWTStrategy = passportJWT.Strategy;
const ExtractJWT = passportJWT.ExtractJwt;

const createToken = (user) => jwt.sign({
  iss: appName,
  sub: user.id,
  iat: new Date().getTime(),
  exp: new Date().setDate(new Date().getDate() + 1),
}, process.env.JWT_SECRET);

const strategy = new JWTStrategy(
  {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey: process.env.JWT_SECRET,
  },
  (jwtPayload, done) => db.getUserDataByID(jwtPayload.sub)
    .then((user) => done(null, user))
    .catch((err) => done(err)),
);

passport.use(strategy);
const auth = passport.authenticate('jwt', { session: false });
app.use('/api/files', express.static(siteDir));
app.use('/api/images', express.static(imgDir));

app.use(fileUpload({ limits: { fileSize: imageFileLimit }, abortOnLimit: true, defParamCharset: 'utf8' }));
app.use(compression());
app.set('trust proxy', 1);
app.use(passport.initialize());
app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static(path.join(__dirname, 'node_modules', 'spectre.css', 'dist')));
app.use(express.static(path.join(__dirname, 'node_modules', 'izimodal', 'css')));
app.use(express.static(path.join(__dirname, 'node_modules', 'izimodal', 'js')));
app.use(express.static(path.join(__dirname, 'node_modules', 'jquery', 'dist')));
app.use(express.static(path.join(__dirname, 'node_modules', 'webui-popover', 'dist')));
app.use(express.static(path.join(__dirname, 'node_modules', 'file-saver', 'dist')));
app.use(express.static(path.join(__dirname, 'node_modules', '@simonwep', 'selection-js', 'lib')));
app.use(express.static(path.join(__dirname, 'node_modules', 'bulma', 'css')));
app.use(history());
app.use(express.static(publicDir));

app.get('/', (req, res) => {
  res.sendFile(path.join(publicDir, 'index.html'));
});

app.post('/api/user/login', async (req, res) => {
  const userData = await db.getUserData(req.body.email, req.body.password);
  if (userData && Object.keys(userData).length && !userData?.error) {
    console.log(req.body.email, '<SUCCESS>');
    const token = createToken(userData);
    userData.token = token;
    userData.server = __package.version;
    userData.commit = process.env.COMMIT;
    res.json(userData);
  } else {
    console.log(`login attempt as [${req.body.email}]•[${req.body.password}]►${userData.error}◄`);
    res.json(userData);
  }
});

app.get('/api/user/logout', auth, async () => {
  console.log('logging out');
  // You can add 'issue time' to token and maintain 'last logout time'
  // for each user on the server.
  // When you check token validity, also check 'issue time' be after 'last logout time'.
  // res.redirect('/login');
});

app.get('/api/user/info', auth, async (req, res) => {
  const text = await db.getUserText(req.user.id);
  res.json({
    ...req.user, text, server: __package.version, commit: process.env.COMMIT,
  });
});

app.post('/api/user/reg', async (req, res) => {
  const userdata = req.body;
  userdata.privs = 5; // default privileges
  const result = await db.createUser(userdata, false);
  res.json(result);
});

app.post('/api/user/add', auth, async (req, res) => {
  const result = await db.createUser(req.body, true);
  res.json(result);
});

app.post('/api/user/activate', auth, async (req, res) => {
  const result = await db.changeActivationStatus(req.body?.id, req.user, Boolean(req.body?.status));
  res.json(result);
});

app.post('/api/user/elevate', auth, async (req, res) => {
  const result = await db.elevateUser(req.body?.id, req.user);
  res.json(result);
});

app.post('/api/user/update', auth, async (req, res) => {
  res.json(await db.updateUser(req.user, req.body));
});

app.post('/api/user/text', auth, async (req, res) => {
  const result = await db.selectText(req.user.id, req.body.id);
  res.json(result);
});

app.post('/api/text', auth, async (req, res) => {
  const result = await db.setText(req.body);
  res.json(result);
});

app.post('/api/tokens', auth, async (req, res) => {
  const tid = req.body.id;
  const { cls } = req.body;
  const mode = Number(req.body.mode);
  const uid = Number(req.body.uid);
  const sid = Number(req.body.sid);
  console.log(`Strings ID ${sid} Token ID ${tid}, class ${cls}, single-mode ${mode}, unit ${uid}`);
  const data = await db.processToken(tid, cls, mode, uid, sid);
  res.json(data);
});

app.get('/api/data', auth, async (req, res) => {
  const strings = await db.getUntagged();
  res.json(strings);
});

app.get('/api/strings', auth, async (req, res) => {
  const strings = await db.getStrings();
  res.json(strings);
});

app.get('/api/comments/:id', auth, async (req, res) => {
  // console.log("comment id", req.params['id']);
  const comments = await db.getComments(req.params.id);
  res.json(comments);
});

app.get('/api/comment/:id', auth, async (req, res) => {
  // console.log("comment id", req.params['id']);
  const comments = await db.getComment(req.params.id);
  res.json(comments);
});

app.post('/api/comment', auth, async (req, res) => {
  // console.log("comment id", req.params['id']);
  // const comments = await db.getComments(req.params['id']);
  // console.log(req.body);
  const result = await db.setComment(req.body, req.user);
  res.json(result);
});

app.post('/api/tag', auth, async (req, res) => {
  const result = await db.setTag(req.body.id, req.body.en, req.body.ru);
  res.json(result);
});

app.post('/api/issue', auth, async (req, res) => {
  const result = await db.setIssue(req.body.id, req.body.color, req.body.en, req.body.ru);
  res.json(result);
});

app.get('/api/grammar', auth, async (req, res) => {
  const categories = await db.getGrammar();
  res.json(categories);
});

app.get('/api/texts', auth, async (req, res) => {
  const textId = Number(req.query.id);
  // console.log('texts', textId);
  const textInfo = await db.getTexts(textId);
  // console.log(textInfo);
  if (textId && !fs.existsSync(path.join(textInfo?.[0].dir, zipName))) {
    delete textInfo?.[0].zipsize;
  }
  res.json(textInfo);
});

app.get('/api/text', auth, async (req, res) => {
  const textId = Number(req.query.id) || 1;
  const strings = await db.getText(textId, req.query.grammar === 'true');
  res.json(strings);
});

app.get('/api/titles', auth, async (req, res) => {
  const textId = Number(req.query.id) || 1;
  const chunk = String(req.query.chunk);
  const titles = await db.getCommentsTitles(textId, chunk);
  res.json(titles);
});

app.post('/api/strings', auth, async (req, res) => {
  res.json(await db.setCommentForString(req.body));
});

app.post('/api/tokencomments', auth, async (req, res) => {
  res.json(await db.setCommentsForToken(req.body));
});

app.post('/api/commentstrings', auth, async (req, res) => {
  res.json(await db.removeCommentFromString(req.body));
});

app.get('/api/commentstrings', auth, async (req, res) => {
  res.json(await db.getBoundStringsForComment(req.query));
});

app.get('/api/textcomments', auth, async (req, res) => {
  const textId = Number(req.query.id) || 1;
  res.json(await db.getTextComments(textId));
});

app.get('/api/issues', auth, async (req, res) => {
  const tags = await db.getIssues();
  res.json(tags);
});

app.get('/api/users', auth, async (req, res) => {
  const users = await db.getUsers(req.query?.id);
  res.json(users);
});

app.get('/api/tags', auth, async (req, res) => {
  const tags = await db.getTags();
  res.json(tags);
});

app.get('/api/conll', auth, async (req, res) => {
  const corpus = await db.getCorpusAsConll();
  const conll = nlp.convertToConll(corpus);
  res.send(conll);
});

app.get('/api/test', (req, res) => {
  res.json({ message: 'ok' });
});

app.get('/api/priority', auth, async (req, res) => {
  const result = await db.getNextPriority();
  res.json(result);
});

app.post('/api/publish', auth, async (req, res) => {
  res.json(await ssr.build(__dirname, req.body.id, siteDir, zipName));
});

app.delete('/api/:table/:id', auth, async (req, res) => {
  // console.log('DELETE params', req.params, 'query', req.query);
  let result = {};
  if (['comments'].includes(req.params.table)) {
    result = await db.deleteById(req.user, req.params.table, req.params.id);
  } else if (req.params.table === 'sources') {
    result = await db.checkCommentsForSource(req.params.id);
    if (!result?.length) {
      result = await db.deleteById(req.user, 'sources', req.params.id);
    }
  }

  res.json(result);
});

app.get('/api/backup', auth, async (req, res) => {
  // https://www.npmjs.com/package/filesize
  const today = new Date();
  const backupFile = `${today.toISOString().split('T')[0]}.tar`;
  const filename = path.join(backupDir, backupFile);
  const cmd = `pg_dump -U ${process.env.PGUSER} -h ${process.env.PGHOST} -p ${process.env.PGPORT || 5432} -f ${filename} -F t -d ${process.env.PGDATABASE}`;
  let message = '';

  try {
    // const result = execSync(cmd);
    // console.log("backup result", result.toString("utf8"));
    execSync(cmd);
    const buffer = fs.readFileSync(filename);
    const compressed = gzipSync(buffer);
    fs.writeFileSync(`${filename}.gz`, compressed);
    fs.unlinkSync(filename);
  } catch (error) {
    message = error.output[2].toString('utf8');
    // console.log(message);
  }

  res.json({ file: `${backupFile}.gz`, error: message });
});

app.get('/api/backups', auth, async (req, res) => {
  const fls = fs.readdirSync(backupDir);
  res.json(fls);
});

app.get('/api/backupfile', auth, async (req, res) => {
  const filePath = path.join(backupDir, req.query.id);
  if (fs.existsSync(filePath)) {
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
  let status = 200;
  let fileName = '';

  if (Object.keys(req.files).length) {
    // console.log(Object.keys(req.files.file));
    const img = req.files.file;
    const ext = img.mimetype.split('/').pop();
    const fileTitle = path.parse(img.name).name;
    const fileSize = img.size;
    const textId = req.params.id || 1;
    // console.log("img:", img.md5, title, ext);
    const currentDir = path.join(imgDir, textId);
    fs.mkdirSync(currentDir, { recursive: true });
    fileName = `${img.md5}.${ext}`;
    const filePath = path.join(currentDir, fileName);

    if (fs.existsSync(filePath)) {
      console.log('Uploaded file already exists');
      status = 409;
    } else {
      try {
        await img.mv(filePath);
      } catch (error) {
        console.log(error);
        status = 500;
      }
      const result = await db.addImage(fileName, fileSize, textId, req.user.id, fileTitle);
      // console.log(result);
      if (result?.id !== fileName) {
        status = 406;
      }
    }
  } else {
    console.log('No files were uploaded');
    status = 400;
  }

  res.status(status).send(fileName);
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
  let result = {};
  if (req.params.type === 'img') {
    const url = `/api/images/${req.query.text}/${req.query.id}`;
    result = await db.checkCommentsForImage(url);
  }
  res.json(result);
});

app.post('/api/unload', auth, async (req, res) => {
  const textId = String(Number(req.body.id) || 1);
  let result = {};

  if (req.body?.file) {
    const fileName = req.body.file;
    const filePath = path.join(imgDir, textId, fileName);
    const url = `/api/images/${textId}/${fileName}`;
    // console.log("file", file, url);
    const comments = await db.checkCommentsForImage(url);

    if (comments.length) {
      // console.log("check", comments);
      result = { error: 'comments', comments };
    } else {
      try {
        // fs.unlinkSync(filePath);
        const check = await db.deleteById(req.user, 'images', fileName, { text_id: textId });
        if (check?.[0]?.id === fileName) {
          fs.unlinkSync(filePath);
        } else {
          result = { error: 'db' };
        }
      } catch (error) {
        result = error;
        console.log(error);
      }
    }
  } else {
    result = { error: 'id' };
  }

  res.json(result);
});

app.get('/api/languages', auth, async (req, res) => {
  let matches = [];
  if (req.query.id) {
    const chunk = req.query.id.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
    const regex = new RegExp(chunk, 'i');
    matches = __locales.filter((x) => x.location && (regex.test(x.tag) || regex.test(x.name) || regex.test(x.location) || regex.test(x.local)));
  } else {
    matches = __locales.filter((x) => x.default && x.location);
  }
  res.json(matches);
});

app.post('/api/load', auth, async (req, res) => {
  Object.entries(req.body).map((x) => console.log(`${x[0]}`.padEnd(10), x[0] === 'text' ? `*${x[1].length}` : x[1]));
  let result = {};
  const textId = Number(req.body.id);
  if (textId) {
    const langId = req.body.lang;
    const content = req.body.text;
    const dryRun = req.body.dry;
    // console.log("start import");
    result = await nlp.importText(true, textId, langId, content, dryRun);
  }
  // console.log("complete import", result);
  res.json(result);
});

app.post('/api/source', auth, async (req, res) => {
  res.json(await db.setSource(req.body));
});

app.get('/api/source', auth, async (req, res) => {
  res.json(await db.getSource(req.query.id));
});

app.listen(port);
console.log(`Running at Port ${port}`);
