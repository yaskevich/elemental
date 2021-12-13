/* jshint esversion: 6*/
/* jslint node: true */
// jshint ignore: start
'use strict';

import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import fs from 'fs';
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
  app.use(express.static('public'));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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
    res.json({...req.user, "server": __package.version, "commit": process.env.COMMIT, });
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

  app.post('/api/comment', async (req, res) => {
    // console.log("comment id", req.params['id']);
    // const comments = await db.getComments(req.params['id']);
    // console.log(req.body);
    const result = await db.setComment(req.body);
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

  app.get('/api/texts', async (req, res) => {
    const textInfo = await db.getTexts();
    res.json(textInfo);
  });

  app.get('/api/text', async (req, res) => {
    const text_id = Number(req.query.id) || 1;
    const strings = await db.getText(text_id);
    res.json(strings);
  });

  app.get('/api/titles', async (req, res) => {
    const text_id = Number(req.query.id) || 1;
    const chunk = String(req.query.chunk);
    const titles = await db.getCommentsTitles(text_id, chunk);
    res.json(titles);
  });

  app.get('/api/issues', async (req, res) => {
    const tags = await db.getIssues();
    res.json(tags);
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

  app.listen(port);
  console.log("Running at Port "+ port);

})();
