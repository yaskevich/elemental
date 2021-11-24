'use strict';

import dotenv from 'dotenv';
const configLoaded = dotenv.config();

// if it is not run under PM2 and dotenv config is not provided
if (!process.env.NODE_ENV && configLoaded.error) {
  console.error(configLoaded.error.toString());
  process.exit(1);
}

// import bcrypt from 'bcrypt';
// const saltRounds = 8;
//
// import passGen from 'generate-password';
// const passOptions = { length: 18, numbers: true, uppercase: false, excludeSimilarCharacters: true, strict: true , symbols: false };

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();



export default {
  async getCorpusAsConll() {
    const sql = `select strings.id as sid, strings.p, strings.form as v, strings.s, strings.token_id as tid, strings.repr, tokens.token as utoken, strings.unit_id as uid, pos as cl from strings left  join tokens on strings.token_id = tokens.id  left  join units on strings.unit_id = units.id order by sid`;
    let conll = [];
    try {
      const result = await pool.query(sql);
      conll = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return conll;
  },
  async getStrings() {
    const sql = `select strings.id as sid, strings.p, strings.form as v, strings.s, strings.token_id as tid, strings.repr, tokens.token as utoken, strings.unit_id as uid, pos as cl from strings left  join tokens on strings.token_id = tokens.id  left  join units on strings.unit_id = units.id order by sid`;
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getUntagged() {
    const sql = `SELECT * from  tokens where meta is null or meta = ''`;
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async processToken(tokenId, wordClass, mode, unitId, sentenceId) {
    // // sqlitedb.run("UPDATE units SET pos = ? WHERE id = ?", [cls, id], function(err, row){
    // sqlitedb.all("SELECT id, pos from units where token_id = ?",[id], (err, units) => {
        // console.log("units", units);
        // let unit_db_id = uid;
    //     sqlitedb.run("UPDATE tokens SET meta = ? WHERE id = ?", [cls, id], function(err, row){
    //         if (err){
    //             console.err(err);
    //             res.status(500);
    //         }
    //         else {
    //             if (mode) {
    //                 let newuid = 0;
    //                 for (let i = 0; i<units.length; i++){
    //                     if(units[i]["pos"]==cls){
    //                         newuid = units[i]["id"]
    //                     }
    //                 }
    //
    //                 if(newuid) {
    //                     console.log("DB:",newuid);
    //                 }
    //
    //                 let sql = newuid ? "SELECT * from units where pos = ? AND token_id = ?":  "INSERT INTO units (pos, token_id) VALUES (?, ?)";
    //                 console.log(sql);
    //                 sqlitedb.run(sql, [cls, id], function(err, row){
    //                     if (!newuid) {
    //                         newuid  = this.lastID;
    //                         console.log("last ID", this.lastID);
    //                     }
    //                     console.log("string", sid, newuid);
    //                     if (sid){
    //                         sqlitedb.run("UPDATE strings SET unit_id = ? WHERE id = ?", [newuid, sid], function(err, row){
    //                             res.json({"id": newuid, "pos": cls, "sid": sid});
    //                         });
    //                     } else {
    //                         res.status(500);
    //                         res.end();
    //                     }
    //                 });
    //             }
    //             else {
    //                 let sql = uid? 'UPDATE units SET pos = ? where id = ?' : "INSERT INTO units (pos, token_id) VALUES (?, ?)";
    //                 sqlitedb.run(sql, [cls, uid], function(err, row){
    //                     // console.log(sql);
    //                     if (!uid) {
    //                         uid  = this.lastID;
    //                         console.log("last ID", this.lastID);
    //                     }
    //                     // console.log("set", uid, id);
    //                     sqlitedb.run("UPDATE strings SET unit_id = ? WHERE token_id = ?", [uid, id], function(err, row){
    //                         // sqlitedb.get("SELECT COUNT(*) as res from tokens where meta is null or meta = ''", (err, row) => {
    //                         sqlitedb.all("SELECT token from tokens where meta is null or meta = ''", (err, row) => {
    //                         // process the row here
    //                         console.log(row);
    //                         // const tagged = Math.round(100 - +row["res"]/(11084/100), 1);
    //                             // console.log(`${tagged} % [${row["res"]}]`);
    //                         });
    //                         // res.status(202);
    //                         res.json({"id": uid, "pos": cls});
    //                     });
    //                 });
    //             }
    //                               // if (uid) {
    //                               // if (units.length < 2) {
    //                                   // if (units.length){
    //                                       // unit_db_id  = units[0]["id"];
    //                                   // } else {
    //                                   // }
    //                                   // if (mode) {
    //                                       // console.log("SERVER: single mode!");
    //                                   // } else {
    //                                   // console.log("set", unit_db_id);
    //                                   // sqlitedb.run("UPDATE strings SET unit_id = ? WHERE token_id = ?", [unit_db_id, id], function(err, row){
    //                                   // });
    //                                   // }
    //                               // } else {
    //                                   // console.log("two variants! not processed!")
    //                               // }
    //         }
    //                             // res.end();
    //     });
    // });

    return {tokenId, wordClass, mode, unitId, sentenceId};
  },
  async getTexts() {
    const sql = `SELECT * from texts`;
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getIssues() {
    const sql = `SELECT * from issues ORDER by id DESC`;
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setIssue(issue_id, color, en, ru) {
    const values = [en, ru];
    let sql = "";
    if (issue_id) {
      const id =  Number(issue_id);
      values.push(id);
      sql = 'UPDATE issues SET color = $1, en = $2, ru = $3  WHERE id = $4';
    } else {
      sql = `INSERT INTO issues (color, en, ru) VALUES ($1, $2)`;
    }

    sql += " RETURNING id";
    console.log(sql);

    let data = [];
    try {
      const result = await pool.query(sql, values);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getTags() {
    const sql = `SELECT * from tags ORDER by id DESC`;
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setTag(tag_id, en, ru) {
    const values = [en, ru];
    let sql = "";
    if (tag_id) {
      const id =  Number(tag_id);
      values.push(id);
      sql = 'UPDATE tags SET en = $1, ru = $2 WHERE id = $3';
    } else {
      sql = `INSERT INTO tags (en, ru) VALUES ($1, $2)`;
    }

    sql += " RETURNING id";
    console.log(sql);

    let data = [];
    try {
      const result = await pool.query(sql, values);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getComments(id) {
    const values = [id];
    let sql = 'SELECT * from comments WHERE text_id = $1 ORDER BY id DESC';
    // if (id) {
    //    sql += ' WHERE id = $1';
    //    values.push(id);
    // } else {
    //   sql += ' ORDER BY id DESC';
    // }

    let data = [];
    try {
      const result = await pool.query(sql, values);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getComment(id) {
    const values = [id];
    let sql = 'SELECT * from comments WHERE id = $1';
    // if (id) {
    //    sql += ' WHERE id = $1';
    //    values.push(id);
    // } else {
    //   sql += ' ORDER BY id DESC';
    // }

    let data = [];
    try {
      const result = await pool.query(sql, values);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setComment(params) {
    let {id, text_id, title, published, content_json,  content_html, content_text, brief_json, brief_html, brief_text, trans, num_id } = params;
    text_id = Number(text_id);
    const values = [text_id, title, published, content_json,  content_html, content_text, brief_json, brief_html, brief_text, trans, num_id];

    let sql = "";
    if (id) {
      id =  Number(id);
      values.push(id);
      sql = `UPDATE comments SET text_id = $1, title = $2, published= $3, content_json = $4, content_html = $5, content_text = $6,
      brief_json = $7, brief_html = $8, brief_text = $9, trans = $10, num_id = $11
      WHERE id = $12`;
    } else {
      sql = `INSERT INTO comments (text_id, title, published, content_json, content_html, content_text, brief_json, brief_html, brief_text, trans) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11);`;
    }

    let data = [];
    try {
      const result = await pool.query(sql, values);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
};
