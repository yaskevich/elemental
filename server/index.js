/* jshint esversion: 6*/
/* jslint node: true */
// jshint ignore: start
'use strict';

import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import fs from 'fs';
import { exec } from 'child_process';
import compress from 'gzipme';
import zip from "zip-local";
import mustache from 'mustache';
import history from 'connect-history-api-fallback';
import jwt from 'jsonwebtoken';
import passport from 'passport';
import passportJWT from 'passport-jwt';
import path from 'path';
import nlp from './nlp.js';
import db from './db.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __package = JSON.parse(fs.readFileSync('./package.json', 'utf8'));
const backupDir = path.join(__dirname, 'backup');
const publicDir =  path.join(__dirname, 'public');
fs.mkdirSync(backupDir, { recursive: true });

(async () => {
  const app = express();
  const port = process.env.PORT || 8080;
  const JWTStrategy   = passportJWT.Strategy;
  const ExtractJWT = passportJWT.ExtractJwt;

  const createToken = user =>
    jwt.sign({
      iss: 'elemental',
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1)
    }, process.env.JWT_SECRET);

  const strategy  = new JWTStrategy(
  {
    jwtFromRequest: ExtractJWT.fromAuthHeaderAsBearerToken(),
    secretOrKey   : process.env.JWT_SECRET
  },
  (jwtPayload, done) =>
    db.getUserDataByID(jwtPayload.sub)
      .then(user => done(null, user))
      .catch(err => done(err))
  );

  passport.use(strategy);
  const auth = passport.authenticate('jwt', {session: false});

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

  app.post('/api/user/login', async(req, res) => {
    const userData = await db.getUserData(req.body['email'], req.body['password']);
    if (userData && Object.keys(userData).length && !userData?.['error']) {
      console.log(req.body['email'], '<SUCCESS>');
      const token = createToken(userData);
      userData['token'] = token;
      userData['server'] = __package.version;
      userData['commit'] = process.env.COMMIT;
      res.json(userData);
    } else {
      console.log(`login attempt as [${req.body['email']}]•[${req.body['password']}]►${userData.error}◄`);
      res.json(userData);
    }
  });

  app.get('/api/user/logout', auth, async () => {
    console.log('logging out');
    // You can add 'issue time' to token and maintain 'last logout time' for each user on the server.
    // When you check token validity, also check 'issue time' be after 'last logout time'.
    // res.redirect('/login');
  });

  app.get('/api/user/info', auth, async(req,res) => {
    // const settings = await db.getData("settings", 1);
    // const stats = await db.getStats();
    // res.json(Object.assign(req.user, {"settings": settings?.[0], "stats": stats, "commit": process.env.COMMIT, "server": __package.version, }));
    const text = await db.getUserText(req.user.id);
    res.json({...req.user, text, "server": __package.version, "commit": process.env.COMMIT, });
   });

  app.post('/api/user/reg', async(req,res) => {
    const userdata = req.body;
    userdata.privs = 5; // default privileges
    const result = await db.createUser(userdata, false);
    res.json(result);
  });

  app.post('/api/user/add', auth, async(req,res) => {
    const result = await db.createUser(req.body, true);
    res.json(result);
  });

  app.post('/api/user/text', auth, async(req,res) => {
    const result = await db.selectText(req.user.id, req.body.id);
    res.json(result);
  });

  app.post('/api/text', auth, async(req,res) => {
    const result = await db.setText(req.body);
    res.json(result);
  });

  app.post('/api/tokens', async(req, res) => {
    const tid = req.body.id;
    const cls = req.body.cls;
    const mode = Number(req.body.mode);
    const uid = Number(req.body.uid);
    const sid = Number(req.body.sid);
    console.log(`Strings ID ${sid} Token ID ${tid}, class ${cls}, single-mode ${mode}, unit ${uid}`);
    const data = await db.processToken(tid, cls, mode, uid, sid);
    res.json(data);
  });

  app.get('/api/data', async(req, res) => {
    const strings = await db.getUntagged();
    res.json(strings);
  });

  app.get('/api/strings', async (req, res) => {
    const strings = await db.getStrings();
    res.json(strings);
  });

  app.get('/api/comments/:id', async (req, res) => {
    // console.log("comment id", req.params['id']);
    const comments = await db.getComments(req.params['id']);
    res.json(comments);
  });

  app.get('/api/comment/:id', async (req, res) => {
    // console.log("comment id", req.params['id']);
    const comments = await db.getComment(req.params['id']);
    res.json(comments);
  });

  app.post('/api/comment', auth, async (req, res) => {
    // console.log("comment id", req.params['id']);
    // const comments = await db.getComments(req.params['id']);
    // console.log(req.body);
    const result = await db.setComment(req.body, req.user);
    res.json(result);
  });

  app.post('/api/tag', async (req, res) => {
    const result = await db.setTag(req.body.id, req.body.en, req.body.ru);
    res.json(result);
  });

  app.post('/api/issue', async (req, res) => {
    const result = await db.setIssue(req.body.id, req.body.color, req.body.en, req.body.ru);
    res.json(result);
  });

  app.get('/api/grammar', async (req, res) => {
    const categories = await db.getGrammar();
    res.json(categories);
  });

  app.get('/api/texts', async (req, res) => {
    const textId = Number(req.query.id);
    // console.log("texts", textId);
    const textInfo = await db.getTexts(textId);
    res.json(textInfo);
  });

  app.get('/api/text', async (req, res) => {
    const textId = Number(req.query.id) || 1;
    const strings = await db.getText(textId, req.query.grammar === 'true');
    res.json(strings);
  });

  app.get('/api/titles', async (req, res) => {
    const textId = Number(req.query.id) || 1;
    const chunk = String(req.query.chunk);
    const titles = await db.getCommentsTitles(textId, chunk);
    res.json(titles);
  });

  app.post('/api/strings', async (req, res) => {
    res.json(await db.setCommentForString(req.body));
  });

  app.post('/api/tokencomments', async (req, res) => {
    res.json(await db.setCommentsForToken(req.body));
  });

  app.get('/api/commentstrings', async (req, res) => {
    res.json(await db.getBoundStringsForComment(req.query));
  });

  app.get('/api/textcomments', async (req, res) => {
    const textId = Number(req.query.id) || 1;
    res.json(await db.getTextComments(textId));
  });

  app.get('/api/issues', async (req, res) => {
    const tags = await db.getIssues();
    res.json(tags);
  });

  app.get('/api/users', async (req, res) => {
    const users = await db.getUsers();
    res.json(users);
  });

  app.get('/api/tags', async (req, res) => {
    const tags = await db.getTags();
    res.json(tags);
  });

  app.get('/api/conll', async(req, res) => {
    const corpus = await db.getCorpusAsConll();
    const conll = nlp.convertToConll(corpus);
    res.send(conll);
  });

  app.get('/api/test', (req, res) => {
    res.json({"message": "ok"});
  });

  app.get('/api/priority', async(req, res) => {
    const result = await db.getNextPriority();
    res.json(result);
  });

  app.delete('/api/:table/:id', auth, async(req,res) => {
    // console.log('DELETE params', req.params, 'query', req.query);
    let result = {};
    if (['comments'].includes(req.params['table'])){
      result = await db.deleteById(req.params['table'], req.params['id'], req.user);
    }
    res.json(result);
  });

  app.get('/api/backup', auth, async(req, res) => {
    const today = new Date();
    const backupFile = `${today.getFullYear()}-${today.getMonth()}-${today.getDate()}.tar`;
    const filename = path.join(backupDir, backupFile);

    const cmd = `pg_dump -U ${process.env.PGUSER} -h ${process.env.PGHOST} -p ${process.env.PGPORT || 5432} -f ${filename} -F t -d ${process.env.PGDATABASE}`;

    let message  = '';

    exec(cmd, async(error, stdout, stderr) => {
        if (error) {
            console.log(`error: ${error.message}`);
            message = error;
        }
        if (stderr) {
            console.log(`stderr: ${stderr}`);
            message = stderr;
        }
        await compress(filename);
        fs.unlinkSync(filename);
        // console.log(`stdout: ${stdout}`);
    });
    // https://www.npmjs.com/package/filesize
    res.json({"file": backupFile + '.gz', "error": message});
  });

  app.get('/api/backups', async(req, res) => {
    const fls = fs.readdirSync( backupDir );
    res.json(fls);
  });

  app.get('/api/backupfile', async(req, res) => {
    const filePath = path.join(backupDir, req.query.id);
    // console.log(filePath);
    if (fs.existsSync(filePath)) {
      res.download(filePath, (err) => {
        if (err) {
          res.status(400).end();
        }
      });
    } else {
      res.status(400).end();
    }
  });

  app.post('/api/publish', async(req, res) => {
    const textId = Number(req.body.id) || 1;
    let result = {};
    try {
      const pubDir = path.join(publicDir, String(textId));
      const zipPath = path.join(pubDir, 'site.zip');

      fs.rmSync(pubDir, { recursive: true, force: true });
      fs.mkdirSync(pubDir, { recursive: true });

      // console.log("request to publish", textId, pubDir);

      const content = await db.getText(textId);
      const template = fs.readFileSync(path.join(__dirname, 'reader.html'), 'utf8');

      const output = mustache.render(template, { title: "Hello!", text: content });

      fs.writeFileSync(path.join(pubDir, 'index.html'), output);
      fs.copyFileSync(path.join(__dirname, 'node_modules', 'mini.css' , 'dist', 'mini-default.min.css'), path.join(pubDir, 'mini.css'));

      zip.sync.zip(pubDir).compress().save(zipPath);
      const stats = fs.statSync(zipPath);
      result = { bytes: stats.size, path: pubDir };
    } catch (genError) {
      console.error(genError);
      console.error(`HTML generation error! Text ${textId}`);
    }
    res.json(result);
  });

  app.listen(port);
  console.log("Running at Port "+ port);

})();
