'use strict';

import dotenv from 'dotenv';
const configLoaded = dotenv.config();

// if it is not run under PM2 and dotenv config is not provided
if (!process.env.NODE_ENV && configLoaded.error) {
  console.error(configLoaded.error.toString());
  process.exit(1);
}

import bcrypt from 'bcrypt';
const saltRounds = 8;

import passGen from 'generate-password';
const passOptions = { length: 18, numbers: true, uppercase: false, excludeSimilarCharacters: true, strict: true , symbols: false };

import pg from 'pg';
const { Pool } = pg;
const pool = new Pool();

const databaseQuery = `SELECT table_name FROM information_schema.columns
 WHERE table_schema = 'public' group by table_name`;

const databaseScheme = {
  texts: `
    id SERIAL PRIMARY KEY,
    author text,
    title text,
    meta text,
    loaded boolean DEFAULT false NOT NULL,
    grammar boolean DEFAULT false NOT NULL,
    comments boolean DEFAULT false NOT NULL`,

  tags: `
    id SERIAL PRIMARY KEY,
    en TEXT,
    ru TEXT`,

  issues: `
    id SERIAL PRIMARY KEY,
    color TEXT NOT NULL DEFAULT '#000000',
    en TEXT,
    ru TEXT`,

  users: `
    id SERIAL PRIMARY KEY,
    username TEXT NOT NULL,
    firstname TEXT NOT NULL,
    lastname TEXT NOT NULL,
    email text NOT NULL,
    sex integer NOT NULL,
    privs integer NOT NULL,
    prefs json,
    _passhash TEXT NOT NULL,
    activated BOOLEAN NOT NULL DEFAULT FALSE,
    text_id integer,
    CONSTRAINT fk_users_texts FOREIGN KEY(text_id) REFERENCES texts(id)`,

  tokens: `
    id SERIAL PRIMARY KEY,
    token text NOT NULL,
    meta text,
    lang text`,

  units: `
    id SERIAL PRIMARY KEY,
    token_id integer,
    pos text,
    CONSTRAINT fk_units_tokens FOREIGN KEY(token_id) REFERENCES tokens(id)`,

  comments:  `
    id SERIAL PRIMARY KEY,
    text_id integer,
    title text NOT NULL,
    long_json json,
    long_html text,
    long_text text,
    published boolean DEFAULT false,
    brief_json json,
    brief_html text,
    brief_text text,
    trans text DEFAULT '',
    priority real,
    tags integer[] DEFAULT '{}',
    issues integer[] DEFAULT '{}',
    CONSTRAINT fk_comments_texts FOREIGN KEY(text_id) REFERENCES texts(id)`,

  strings: `
    id SERIAL PRIMARY KEY,
    text_id integer,
    p integer,
    s integer,
    form text,
    repr text,
    token_id integer,
    unit_id integer,
    comments integer[] DEFAULT '{}',
    CONSTRAINT fk_strings_texts FOREIGN KEY(text_id) REFERENCES texts(id),
    CONSTRAINT fk_strings_tokens FOREIGN KEY(token_id) REFERENCES tokens(id),
    CONSTRAINT fk_strings_units FOREIGN KEY(unit_id) REFERENCES units(id)`,

  logs: `
    id SERIAL PRIMARY KEY,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    user_id integer NOT NULL,
    data0 json,
    data1 json,
    table_name text NOT NULL,
    record_id integer NOT NULL,
    CONSTRAINT fk_logs_users FOREIGN KEY(user_id) REFERENCES users(id)`,
};


let tablesResult = await pool.query(databaseQuery);
const tables = tablesResult.rows.map(x => x.table_name);
// console.log(tables);

if(tables.length !== Object.keys(databaseScheme).length) {
  console.log("initializing database: started");
  try {
    await pool.query('BEGIN')
    try {
      for (let [key, value] of Object.entries(databaseScheme)) {
        if (!tables.includes(key)){
          console.log(`init table '${key}'`);
          try {
          const createResult = await pool.query(`CREATE TABLE IF NOT EXISTS ${key} (${value})`);
        } catch (createError) {
          console.error(createError);
          console.error(`Issue with table '${key}'!`)
          throw createError;
        }
          // console.log("create", createResult);
          const ownerResult = await pool.query(`ALTER TABLE ${key} OWNER TO ${process.env.PGUSER}`);
          // console.log("owner", ownerResult);
        }
      }
      await pool.query('COMMIT');
      tablesResult = await pool.query(databaseQuery);
      console.log("initializing database: done");
   } catch (error) {
     console.log("Rolling back...");
     await pool.query('ROLLBACK');
   }
 } catch(error) {
    console.log("initializing database: error\n", error);
 }
}

const cleanCommentObject = (obj) => {
    const { long_html, brief_html, long_text, brief_text, id, ...rest } = obj;
    return rest;
};

export default {
  async getUserDataByID(id){
    const res = await pool.query("SELECT * from users WHERE id = $1 AND activated = TRUE", [id]);
    return res?.rows[0];
  },
  async getUserData(email, pwd){
    if (!email) { return {"error": "email"}; }
    else if (!pwd) { return {"error": "password"}; }

    // console.log("email/pwd", email, pwd);
    const res = await pool.query(`SELECT * FROM users WHERE email = $1`, [email]);
    if (res.rows.length){
      const data = res.rows[0];
      // console.log("userdata", data);
      // console.log("pass/hash", pwd, data._passhash);
      if (data.activated) {
        const result = await bcrypt.compare(pwd, data._passhash);
        Reflect.deleteProperty(data, '_passhash');
        // console.log("pass/hash result", result);
        return result ? data : {"error": "password"};
      } else {
        return {"error": "user status"};
      }
    } else {
       return {"error": "email"};
    }

    return {"error": "unknown"};
  },
  async createUser(data, isActivated = false){
    console.log("create user", data);
    const usersData = await pool.query(`SELECT * FROM users`);
    if(usersData.rows.length) {
      if (usersData.rows.filter(x=> x.email == data.email).length) {
          return {"error": "email not unique"};
      }
    } else {
      // if users table is empty it means it is first run and we have to create admin user
      // make later regular set up UI
      data.privs = 1;
      isActivated = true;
      console.log("create admin");
    }
    const pwd  = passGen.generate(passOptions);
    console.log("make hash");
    const hash = await bcrypt.hash(pwd, saltRounds);
    console.log("ready");
    // console.log(pwd, hash);
    const result = await pool.query(`INSERT INTO users (username, firstname, lastname, email, sex, privs, _passhash, activated) VALUES($1, $2, $3, $4, $5, $6, $7, $8) RETURNING id`, [data.username, data.firstname, data.lastname, data.email, data.sex, data.privs, hash, isActivated]);
    if (result.rows.length === 1) {
      return { "message": pwd };
    }
    return {"error": "user"};
  },
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
  async getTexts(id) {
    let sql = `SELECT * from texts`;
    const text_id = Number(id);
    if (text_id && text_id > 0) {
      sql += ' WHERE id = ' + text_id;
    }
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getUserText(id) {
    let data = {};
    if (id) {
      let sql = `select * from texts where id = (select text_id from users where id = $1)`;
      try {
        const result = await pool.query(sql, [id]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getText(id, withGrammar = false) {
    // console.log("with grammar", withGrammar);
    const sqlWithGrammar = `select strings.id as id, strings.p, strings.s, strings.form, strings.repr, tokens.id as tid, tokens.meta, units.id as uid, units.pos, strings.comments from strings left join tokens on strings.token_id = tokens.id left join units on strings.unit_id = units.id where text_id = $1 ORDER BY strings.id`;
    const sql = `select strings.id as id, strings.p, strings.s, strings.form, strings.repr, tokens.id as tid, tokens.meta, strings.comments from strings left join tokens on strings.token_id = tokens.id where text_id = $1 ORDER BY strings.id`;
    let data = [];
    try {
      const result = await pool.query(withGrammar? sqlWithGrammar : sql, [id]);
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
    const values = [color, en, ru];
    let sql = "";
    if (issue_id) {
      const id =  Number(issue_id);
      values.push(id);
      sql = 'UPDATE issues SET color = $1, en = $2, ru = $3  WHERE id = $4';
    } else {
      sql = `INSERT INTO issues (color, en, ru) VALUES ($1, $2, $3)`;
    }

    sql += " RETURNING id";
    // console.log(sql);

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
    // console.log(sql);

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
    // let sql = 'SELECT * from comments WHERE text_id = $1 ORDER BY id DESC';
    const sql = `SELECT id, priority, issues, title, published,
     CASE WHEN id IN (SELECT unnest(comments) AS coms FROM strings WHERE comments::text <> '{}' group by coms)
     THEN '1'::boolean else '0'::boolean END as bound
     FROM comments WHERE text_id = $1 ORDER by priority DESC, id DESC`;
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
  async setComment(params, userObject) {
    let {id, text_id, title, published, long_json,  long_html, long_text, brief_json, brief_html, brief_text, trans, priority, tags = [], issues = [] } = params;
    const tagsAsArray = `{${tags.length? tags.join(','): ''}}`;
    const issuesAsArray = `{${issues.length? issues.map(x => `{${x.join(',')}}`).join(','): ''}}`;
    // console.log("issues", issuesAsArray);
    text_id = Number(text_id);
    const values = [text_id, title, published, long_json,  long_html, long_text, brief_json, brief_html, brief_text, trans, priority, tagsAsArray, issuesAsArray];

    let sql = "";
    if (id) {
      id =  Number(id);
      values.push(id);

      sql = `UPDATE comments SET text_id = $1, title = $2, published= $3, long_json = $4, long_html = $5, long_text = $6,
      brief_json = $7, brief_html = $8, brief_text = $9, trans = $10, priority = $11,
      tags = $12, issues = $13
      WHERE id = $14`;
    } else {
      sql = `INSERT INTO comments (text_id, title, published, long_json, long_html, long_text, brief_json, brief_html, brief_text, trans, priority, tags, issues) VALUES ($1, $2, $3, $4, $5, $6, $7, $8, $9, $10, $11, $12, $13)`;
    }
    sql += " RETURNING id";

    let data = {};
    try {
      let previousCommentObject = {};
      if (id){
        const selection = await pool.query(`SELECT * FROM comments WHERE id = $1`, [id]);
        const commentObject = selection.rows[0];
        previousCommentObject = cleanCommentObject(commentObject);
      }

      // console.log("pre", JSON.stringify(previousCommentObject));
      const newCommentObject = cleanCommentObject(params);
      // console.log("now", JSON.stringify(newCommentObject));

      try {
         await pool.query('BEGIN');
         try {
           const result = await pool.query(sql, values);
           data = result?.rows?.[0];
           const resultId = data["id"];


           const logQuery = `INSERT INTO logs (user_id, table_name, record_id, data0, data1) VALUES($1, $2, $3, $4, $5) RETURNING id`;
           const table = 'comments';
           // enum types! - alter table logs
           const logResult  = await pool.query(logQuery, [userObject.id, table, resultId, previousCommentObject, newCommentObject]);
           // console.log(logQuery, logResult);
           // return resultId;
           await pool.query('COMMIT');

         } catch (error) {
           await pool.query('ROLLBACK');
           return {"error": error};
         }
       } catch(error){
          return {"error": error};
       }
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getNextPriority() {
    let sql = 'select floor(max(priority)) + 1 as priority from comments;';
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getCommentsTitles(textId, chunk) {
    const checkedChunk = chunk.replace(/[^0-9А-Яа-яЎІЁўіёA-Za-z*-]/g, '');
    // console.log(`${chunk}|${checkedChunk}|`);
    if (!checkedChunk) {
      return [];
    }
    // console.log(`|${checkedChunk}|`);
    const values = [textId, `%${checkedChunk}%`, `${checkedChunk}%`];
    let sql = "SELECT id, priority, title from comments where text_id = $1 and (title ilike $2 OR priority::text like $3) LIMIT 10";
    let data = [];
    try {
      const result = await pool.query(sql, values);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setCommentForString(params) {
    const comment_id = params?.id;
    const stringTokenIds = params.tokens;
    let data = {};
    if (comment_id && stringTokenIds?.length) {
      // console.log("comment", comment_id, "tokens", stringTokenIds);
      try {
        const sql1 = "UPDATE strings SET comments = array_remove(comments, $1) WHERE id = ANY($2::int[]) RETURNING id"; // to avoid duplicates
        await pool.query(sql1, [comment_id, stringTokenIds]);
        const sql2 = "UPDATE strings SET comments = array_append(comments, $1) WHERE id = ANY($2::int[]) RETURNING id";
        const result = await pool.query(sql2, [comment_id, stringTokenIds]);
        data = result?.rows;
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getTextComments(textId) {
    let sql = "SELECT id, title FROM comments WHERE id IN (SELECT unnest(comments) AS coms FROM strings WHERE comments::text <> '{}' GROUP BY coms) AND text_id = $1";
    let data = [];
    try {
      const result = await pool.query(sql, [textId]);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setCommentsForToken(params) {
    const token_id = params?.id;
    const commentIds = params?.comments.map(x => Number(x)).join(',');
    const commentIdsAsArray = `{${commentIds}}`;
    // console.log(commentIdsAsArray);
    let data = {};
    if (token_id) {
      // console.log("comment", comment_id, "tokens", stringTokenIds);
      try {
        const sql = "UPDATE strings SET comments = $2 WHERE id = $1 RETURNING id";
        const result = await pool.query(sql, [token_id, commentIdsAsArray]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getBoundStringsForComment(params) {
    const { id: textId, comment: commentId } = params;
    let sql = "SELECT strings.*, tokens.meta FROM strings LEFT JOIN tokens ON strings.token_id = tokens.id WHERE text_id = $1 AND $2 = ANY (comments::int[]) ORDER BY id";
    let data = [];
    try {
      const result = await pool.query(sql, [textId, commentId]);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getUsers() {
    const sql = 'SELECT id, username, firstname, lastname from users WHERE activated = True';
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async deleteById(table, id, user) {
    // console.log(`DELETE from ${table} with ${id} by ${user.username}`);
    let data = [];
    try {
      const result = await pool.query(`DELETE FROM ${table} WHERE id=${id} RETURNING id`);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getGrammar() {
    // stub till UI will be implemented
    return {
        ip: {
          color: 'lightgray',
        },
        vb: {
          color: '#32b643',
          font: '#FFFFFF',
        },
        aj: {
          color: '#e85600',
          font: '#FFFFFF',
        },
        pp: {
          color: '#85144b',
          font: '#FFFFFF',
        },
        av: {
          color: '#f801ff',
          font: '#FFFFFF',
        },
        nm: {
          color: 'lightblue',
          font: 'black',
        },
        nb: {
          color: '#b66935',
          font: 'black',
        },
        nn: {
          color: '#5f4bb5',
          font: '#FFFFFF',
        },
        np: {
          color: '#6948f6',
          font: 'orange',
        },
        va: {
          color: '#ffb700',
          font: '#FFFFFF',
        },
        pn: {
          color: 'navy',
          font: '#FFFFFF',
        },
        nw: {
          color: 'black',
          font: 'yellow',
        },
        vi: {
          color: '#afe31b',
          font: 'red',
        },
        vg: {
          color: '#0da6ca',
          font: 'lightyellow',
        },
        part: {
          color: 'pink',
          font: 'red',
        },
        det: {
          color: '#00ff00',
          font: 'navy',
        },
        aux: {
          color: 'silver',
          font: 'navy',
        },
        prad: {
          color: '#d61f1f',
          font: 'white',
        },
        dm: {
          color: 'cyan',
          font: 'gray',
        },
        mod: {
          color: 'cyan',
          font: 'red',
        },
        cj: {
          color: 'yellow',
          font: 'gray',
        },
        intj: {
          color: '#065535',
          font: 'white',
        },
      };
  },
  async selectText(user, text) {
    const userId = Number(user);
    const textId = Number(text);
    let data = {};
    if (userId && textId) {
      // console.log(`select text ${textId} for user ${userId}`);
      try {
        const sql = "UPDATE users SET text_id = $1 WHERE id = $2 RETURNING id";
        await pool.query(sql, [textId, userId]);
        const result = await pool.query("select * from texts where id = $1", [textId]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async setText(params) {
    let data = [];
    if (params.author && params.title) {
      const values = [params.author, params.title, params?.meta || '', params?.grammar || false, params?.comments || false,  params?.site || '', params?.credits || ''];
      let sql = "";

      if (params.id) {
        const id =  Number(params.id);
        values.push(id);
        sql = 'UPDATE texts SET author = $1, title = $2, meta = $3, grammar = $4, comments = $5, site = $6, credits = $7 WHERE id = $8';
      } else {
        sql = `INSERT INTO texts (author, title, meta, grammar, comments, site, credits) VALUES ($1, $2, $3, $4, $5, $6, $7)`;
      }

      sql += " RETURNING id";

      try {
        const result = await pool.query(sql, values);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error("Title and author fields are not set!")
    }
    return data;
  },
  async updatePubInfo(id, dir, zipsize, published) {
    let data = {};
    try {
      const sql = "UPDATE texts SET dir = $2, zipsize = $3, published = to_timestamp($4 / 1000.0) WHERE id = $1 RETURNING id";
      const result = await pool.query(sql, [id, dir, zipsize, published]);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getFullComments(id) {
    let data = [];
    const textId = Number(id);
    if (textId) {
        const sql = 'SELECT * FROM comments WHERE text_id = $1 ORDER by priority ASC, id ASC';
        try {
          const result = await pool.query(sql, [textId]);
          data = result?.rows;
        } catch (err) {
          console.error(err);
        }
    }
    return data;
  },
};
