/* jshint esversion: 6*/
/* jslint node: true */
// jshint ignore: start
'use strict';

import path from 'path';
import express from 'express';
import dotenv from 'dotenv';
import sqlite3 from 'sqlite3';
import bodyParser from 'body-parser';
import nlp from './nlp.js';
import db from './db.js';
import { fileURLToPath } from 'url';
const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
dotenv.config();

(async () => {
const sqlitedb = new sqlite3.Database(process.env.SQLITE);
const app = express();
const port = process.env.PORT || 8080;

app.use(bodyParser.json()); // support json encoded bodies
app.use(bodyParser.urlencoded({ extended: true })); // support encoded bodies

app.use(express.static(__dirname + '/node_modules/spectre.css/dist'));
app.use(express.static(__dirname + '/node_modules/izimodal/css'));
app.use(express.static(__dirname + '/node_modules/izimodal/js'));
app.use(express.static(__dirname + '/node_modules/jquery/dist'));
app.use(express.static(__dirname + '/node_modules/webui-popover/dist'));
app.use(express.static(__dirname + '/node_modules/file-saver/dist'));
app.use(express.static(__dirname + '/node_modules/@simonwep/selection-js/lib'));
app.use(express.static(__dirname + '/node_modules/bulma/css'));
app.use(express.static('public'));

app.get('/',function(req,res){
     res.sendFile(path.join(__dirname, 'public', 'index.html'));
});

app.get('/api/texts', async (req, res, next) => {
  try {
    // tokens.meta as cl
	sqlitedb.all("select strings.id as sid, strings.p, strings.form as v, strings.s, strings.token_id as tid, strings.repr, tokens.token as utoken, strings.unit_id as uid, pos as cl, feats, lemma from strings left  join tokens on strings.token_id = tokens.id  left  join units on strings.unit_id = units.id", function(err, corpus) {
        // console.log(corpus[0]);
		res.send(corpus);
	});

  } catch (err) {
    next(err);
  }
});

app.get('/conll', function (req, res) {
	try {
		sqlitedb.all("select strings.id as sid, strings.p, strings.form as v, strings.s, strings.token_id as tid, strings.repr, tokens.token as utoken, strings.unit_id as uid, pos as cl, feats, lemma from strings left  join tokens on strings.token_id = tokens.id  left  join units on strings.unit_id = units.id", function(err, corpus) {
			const conll = nlp.convertToConll(corpus);
			res.send(conll);
	});
	} catch (err) {
	next(err);
	}
});

app.post('/api/tokens', function(req, res){
	var id = req.body.id;
    var cls = req.body.cls;
    var mode = +req.body.mode;
    var uid = +req.body.uid;
    var sid = +req.body.sid;
	console.log(`Strings ID ${sid} Token ID ${id}, class ${cls}, single-mode ${mode}, unit ${uid}`);
    // sqlitedb.run("UPDATE units SET pos = ? WHERE id = ?", [cls, id], function(err, row){

    sqlitedb.all("SELECT id, pos from units where token_id = ?",[id], (err, units) => {
        // console.log("units", units);
        // let unit_db_id = uid;
        sqlitedb.run("UPDATE tokens SET meta = ? WHERE id = ?", [cls, id], function(err, row){
            if (err){
                console.err(err);
                res.status(500);
            }
            else {
                if (mode) {
                    let newuid = 0;
                    for (let i = 0; i<units.length; i++){
                        if(units[i]["pos"]==cls){
                            newuid = units[i]["id"]
                        }
                    }

                    if(newuid) {
                        console.log("DB:",newuid);
                    }

                    let sql = newuid ? "SELECT * from units where pos = ? AND token_id = ?":  "INSERT INTO units (pos, token_id) VALUES (?, ?)";
                    console.log(sql);
                    sqlitedb.run(sql, [cls, id], function(err, row){
                        if (!newuid) {
                            newuid  = this.lastID;
                            console.log("last ID", this.lastID);
                        }
                        console.log("string", sid, newuid);
                        if (sid){
                            sqlitedb.run("UPDATE strings SET unit_id = ? WHERE id = ?", [newuid, sid], function(err, row){
                                res.json({"id": newuid, "pos": cls, "sid": sid});
                            });
                        } else {
                            res.status(500);
                            res.end();
                        }
                    });
                }
                else {
                    let sql = uid? 'UPDATE units SET pos = ? where id = ?' : "INSERT INTO units (pos, token_id) VALUES (?, ?)";
                    sqlitedb.run(sql, [cls, uid], function(err, row){
                        // console.log(sql);
                        if (!uid) {
                            uid  = this.lastID;
                            console.log("last ID", this.lastID);
                        }
                        // console.log("set", uid, id);
                        sqlitedb.run("UPDATE strings SET unit_id = ? WHERE token_id = ?", [uid, id], function(err, row){
                            // sqlitedb.get("SELECT COUNT(*) as res from tokens where meta is null or meta = ''", (err, row) => {
                            sqlitedb.all("SELECT token from tokens where meta is null or meta = ''", (err, row) => {
                            // process the row here
                            console.log(row);
                            // const tagged = Math.round(100 - +row["res"]/(11084/100), 1);
                                // console.log(`${tagged} % [${row["res"]}]`);
                            });
                            // res.status(202);
                            res.json({"id": uid, "pos": cls});
                        });
                    });
                }
                // if (uid) {
                // if (units.length < 2) {
                    // if (units.length){
                        // unit_db_id  = units[0]["id"];
                    // } else {
                    // }
                    // if (mode) {
                        // console.log("SERVER: single mode!");
                    // } else {
                    // console.log("set", unit_db_id);
                    // sqlitedb.run("UPDATE strings SET unit_id = ? WHERE token_id = ?", [unit_db_id, id], function(err, row){
                    // });
                    // }
                // } else {
                    // console.log("two variants! not processed!")
                // }
            }
            // res.end();
        });
    });
});

app.get('/api/data', function(req, res){
	var id = req.body.id;
    var props = req.body.props;
    sqlitedb.all("SELECT * from  tokens where meta is null or meta = ''", (err, data) => {
        res.json(data)
    });
});

  app.get('/api/test', function(req, res){
    res.json({"message": "ok"});
  });

  app.listen(port);
  console.log("Running at Port "+ port);

})();
