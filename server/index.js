/* jshint esversion: 6*/
/* jslint node: true */
// jshint ignore: start
'use strict';

import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import bodyParser from 'body-parser';
import nlp from './nlp.js';
import db from './db.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

(async () => {
  const app = express();
  const port = process.env.PORT || 8080;

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
  app.use(express.static('public'));

  app.get('/', (req, res) => {
    res.sendFile(path.join(__dirname, 'public', 'index.html'));
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

  app.get('/api/comments/:id*?', async (req, res) => {
    // console.log("comment id", req.params['id']);
    const comments = await db.getComments(req.params['id']);
    res.json(comments);
  });

  app.get('/api/texts', async (req, res) => {
    const strings = await db.getTexts();
    res.json(strings);
  });

  app.get('/api/conll', async(req, res) => {
    const corpus = await db.getCorpusAsConll();
    const conll = nlp.convertToConll(corpus);
    res.send(conll);
  });

  app.get('/api/test', (req, res) => {
    res.json({"message": "ok"});
  });

  app.listen(port);
  console.log("Running at Port "+ port);

})();
