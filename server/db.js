import dotenv from 'dotenv';
import bcrypt from 'bcrypt';
import passGen from 'generate-password';
import pg from 'pg';

const configLoaded = dotenv.config();

// if it is not run under PM2 and dotenv config is not provided
if (!process.env.NODE_ENV && configLoaded.error) {
  console.error(configLoaded.error.toString());
  process.exit(1);
}

const saltRounds = 8;
const passOptions = {
  length: 18,
  numbers: true,
  uppercase: false,
  excludeSimilarCharacters: true,
  strict: true,
  symbols: false,
};

const { Pool } = pg;
const pool = new Pool();

const databaseQuery = `SELECT table_name FROM information_schema.columns
 WHERE table_schema = 'public' group by table_name`;

const databaseScheme = {
  texts: `
    id SERIAL PRIMARY KEY,
    author TEXT,
    title TEXT,
    meta TEXT,
    site TEXT,
    credits TEXT,
    url TEXT,
    scheme JSON,
    lang TEXT NOT NULL,
    published TIMESTAMP WITH TIME ZONE,
    zipsize INTEGER,
    loaded BOOLEAN DEFAULT false NOT NULL,
    comments BOOLEAN DEFAULT false NOT NULL`,

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
    requested timestamp with time zone,
    text_id integer,
    CONSTRAINT fk_users_texts FOREIGN KEY(text_id) REFERENCES texts(id)`,

  tokens: `
    id SERIAL PRIMARY KEY,
    token text NOT NULL,
    meta text,
    lang text,
    UNIQUE (token, lang)`,

  units: `
    id SERIAL PRIMARY KEY,
    token_id integer,
    pos text,
    CONSTRAINT fk_units_tokens FOREIGN KEY(token_id) REFERENCES tokens(id)`,

  comments: `
    id SERIAL PRIMARY KEY,
    text_id integer,
    title text NOT NULL,
    published boolean DEFAULT false,
    priority real,
    tags integer[] DEFAULT '{}',
    issues integer[] DEFAULT '{}',
    entry json,
    CONSTRAINT fk_comments_texts FOREIGN KEY(text_id) REFERENCES texts(id)`,

  strings: `
    id SERIAL PRIMARY KEY,
    text_id integer,
    p integer,
    s integer,
    line integer,
    form text,
    repr text,
    fmt text[] DEFAULT '{}',
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

  images: `
    id TEXT NOT NULL UNIQUE,
    filesize integer NOT NULL,
    user_id integer NOT NULL,
    text_id integer NOT NULL,
    created timestamp with time zone DEFAULT CURRENT_TIMESTAMP,
    title text NOT NULL DEFAULT 'unnamed ' || to_char(CURRENT_TIMESTAMP, 'yyyy-mm-dd HH:mm'),
    CONSTRAINT fk_images_texts FOREIGN KEY(text_id) REFERENCES texts(id),
    CONSTRAINT fk_images_users FOREIGN KEY(user_id) REFERENCES users(id)`,

  sources: `
    id SERIAL PRIMARY KEY,
    lang text NOT NULL,
    citekey text NOT NULL UNIQUE,
    bibtex jsonb NOT NULL,
    text_id integer NOT NULL`,

  settings: `
    registration_open boolean default true`,

  classes: `
    id SERIAL PRIMARY KEY,
    name TEXT NOT NULL UNIQUE,
    css JSON`,
};

let tablesResult;
try {
  tablesResult = await pool.query(databaseQuery);
} catch (error) {
  console.error(error);
  pool.end();
  process.exit(1);
}

const tables = tablesResult.rows.map((x) => x.table_name);
// console.log(tables);

const prepareTable = async (args) => {
  const tableName = args[0];
  if (!tables.includes(tableName)) {
    console.log(`init table '${tableName}'`);
    try {
      // const createResult = await pool.query(`CREATE TABLE IF NOT EXISTS ${key} (${value})`);
      await pool.query(`CREATE TABLE IF NOT EXISTS ${tableName} (${args[1]})`);
      // const ownerResult = await pool.query(`ALTER TABLE ${tableName} OWNER TO ${process.env.PGUSER}`);
      // console.log('owner', ownerResult);
      await pool.query(`ALTER TABLE ${tableName} OWNER TO ${process.env.PGUSER}`);

      if (tableName === 'settings') {
        await pool.query('INSERT INTO settings DEFAULT VALUES');
      }
      if (tableName === 'classes') {
        await pool.query('INSERT INTO classes (name, css) VALUES($1, $2)', ['error', '{"color": "#ff0000", "background-color": "#ffff00"}']);
      }
    } catch (createError) {
      console.error(createError);
      console.error(`Issue with table '${tableName}'!`);
      process.exit();
      throw createError;
    }
    // process.exit();
    // console.log("create", createResult);
  }
};

const initDatabase = async () => {
  /* eslint-disable-next-line no-restricted-syntax */
  for (const timeout of Object.entries(databaseScheme)) {
    /* eslint-disable-next-line no-await-in-loop */
    await prepareTable(timeout);
  }
};

if (tables.length !== Object.keys(databaseScheme).length) {
  console.log('initializing database: started');
  try {
    await pool.query('BEGIN');
    try {
      await initDatabase();
      await pool.query('COMMIT');
      tablesResult = await pool.query(databaseQuery);
      console.log('initializing database: done');
    } catch (error) {
      console.log('Rolling back...');
      await pool.query('ROLLBACK');
    }
  } catch (error) {
    console.log('initializing database: error\n', error);
  }
}

const cleanCommentObject = (obj) => {
  const { id, ...rest } = obj;
  return rest;
};

export default {
  async getUserDataByID(id) {
    const sql = 'UPDATE users SET requested = NOW() WHERE id = $1'; // to log activity
    await pool.query(sql, [id]);
    const result = await pool.query('SELECT * from users WHERE id = $1 AND activated = TRUE', [id]);
    return result?.rows?.[0];
  },
  async getUserData(email, pwd) {
    if (!email) { return { error: 'email' }; }
    if (!pwd) { return { error: 'password' }; }

    // console.log("email/pwd", email, pwd);
    const res = await pool.query('SELECT * FROM users WHERE email = $1', [email]);
    if (res.rows.length) {
      const data = res.rows[0];
      // console.log("userdata", data);
      // console.log("pass/hash", pwd, data._passhash);
      if (data.activated) {
        const result = await bcrypt.compare(pwd, data._passhash);
        Reflect.deleteProperty(data, '_passhash');
        // console.log("pass/hash result", result);
        return result ? data : { error: 'password' };
      }
      return { error: 'user status' };
    }
    return { error: 'email' };
  },
  async createUser(formData, status = false) {
    console.log('create user', formData);
    const data = formData;
    let activated = status;
    const settings = await pool.query('SELECT * FROM settings');

    if (!settings.rows.shift()?.registration_open) {
      return { error: 'registration is closed' };
    }

    const usersData = await pool.query('SELECT * FROM users');
    if (usersData.rows.length) {
      if (usersData.rows.filter((x) => x.email === data.email).length) {
        return { error: 'email not unique' };
      }
      if (usersData.rows.filter((x) => x.username === data.username).length) {
        return { error: 'username not unique' };
      }
    } else {
      // if users table is empty it means it is first run and we have to create admin user
      // make later regular set up UI
      data.privs = 1;
      activated = true;
      // console.log('create admin');
    }
    const pwd = passGen.generate(passOptions);
    // console.log('make hash');
    const hash = await bcrypt.hash(pwd, saltRounds);
    // console.log('ready');
    // console.log(pwd, hash);
    const result = await pool.query('INSERT INTO users (requested, username, firstname, lastname, email, sex, privs, _passhash, activated) VALUES(NOW(), LOWER($1), INITCAP($2), INITCAP($3), LOWER($4), $5, $6, $7, $8) RETURNING id', [data.username, data.firstname, data.lastname, data.email, data.sex, data.privs, hash, activated]);
    if (result.rows.length === 1) {
      return { message: pwd, activated };
    }
    return { error: 'user' };
  },
  async updateUser(currentUser, props) {
    let data = {};
    const userId = Number(props?.id);
    if (userId && (currentUser.privs < 3 || currentUser.id === userId)) {
      const sql = 'UPDATE users SET username = LOWER($2), firstname = INITCAP($3), lastname = INITCAP($4), email = LOWER($5) WHERE id = $1 RETURNING id';
      const values = [userId, props.username, props.firstname, props.lastname, props.email];
      try {
        const usersData = await pool.query('SELECT * FROM users where id <> $1', [userId]);
        if (usersData.rows.filter((x) => x.email === props.email).length) {
          data = { error: 'email not unique' };
        } else if (usersData.rows.filter((x) => x.username === props.username).length) {
          console.log('username');
          data = { error: 'username not unique' };
        } else {
          const result = await pool.query(sql, values);
          data = result?.rows?.[0];
        }
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getCorpusAsConll() {
    const sql = 'select strings.id as sid, strings.p, strings.form as v, strings.s, strings.token_id as tid, strings.repr, tokens.token as utoken, strings.unit_id as uid, pos as cl from strings left  join tokens on strings.token_id = tokens.id  left  join units on strings.unit_id = units.id order by sid';
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
    const sql = 'select strings.id as sid, strings.p, strings.form as v, strings.s, strings.token_id as tid, strings.repr, tokens.token as utoken, strings.unit_id as uid, pos as cl from strings left  join tokens on strings.token_id = tokens.id  left  join units on strings.unit_id = units.id order by sid';
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
    const sql = 'SELECT * from tokens where meta is null or meta = \'\'';
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

    return {
      tokenId, wordClass, mode, unitId, sentenceId
    };
  },
  async getTexts(id) {
    let sql = 'SELECT * from texts ';
    const textId = Number(id);
    if (textId && textId > 0) {
      sql += ` WHERE id = ${textId}`;
    }
    let data = [];
    try {
      const result = await pool.query(`${sql} order by id`);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getUserText(id) {
    let data = {};
    if (id) {
      const sql = 'select * from texts where id = (select text_id from users where id = $1)';
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
    const sqlWithGrammar = 'select strings.id as id, strings.p, strings.s, strings.form, strings.repr, strings.fmt, tokens.id as tid, tokens.meta, units.id as uid, units.pos, strings.comments from strings left join tokens on strings.token_id = tokens.id left join units on strings.unit_id = units.id where text_id = $1 ORDER BY strings.id';
    const sql = 'select strings.id as id, strings.p, strings.s, strings.form, strings.repr, strings.fmt, tokens.id as tid, tokens.meta, strings.comments from strings left join tokens on strings.token_id = tokens.id where text_id = $1 ORDER BY strings.id';
    let data = [];
    try {
      const result = await pool.query(withGrammar ? sqlWithGrammar : sql, [id]);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getIssues() {
    const sql = 'SELECT * from issues ORDER by id DESC';
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setIssue(issueId, color, en, ru) {
    const values = [color, en, ru];
    let sql = '';
    if (issueId) {
      const id = Number(issueId);
      values.push(id);
      sql = 'UPDATE issues SET color = $1, en = $2, ru = $3  WHERE id = $4';
    } else {
      sql = 'INSERT INTO issues (color, en, ru) VALUES ($1, $2, $3)';
    }

    sql += ' RETURNING id';
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
    const sql = 'SELECT * from tags ORDER by id DESC';
    let data = [];
    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setTag(tagId, en, ru) {
    const values = [en, ru];
    let sql = '';
    if (tagId) {
      const id = Number(tagId);
      values.push(id);
      sql = 'UPDATE tags SET en = $1, ru = $2 WHERE id = $3';
    } else {
      sql = 'INSERT INTO tags (en, ru) VALUES ($1, $2)';
    }

    sql += ' RETURNING id';
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
    const sql = `SELECT id, priority, issues, tags, title, published,
     CASE WHEN id IN (SELECT unnest(comments) AS coms FROM strings WHERE comments::text <> '{}' group by coms)
     THEN True else False END as bound
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
    const sql = 'SELECT * from comments WHERE id = $1';
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
    const tagsAsArray = `{${params?.tags?.length ? params.tags.join(',') : ''}}`;
    const issuesAsArray = `{${params?.issues?.length ? params.issues.map((x) => `{${x.join(',')}}`).join(',') : ''}}`;
    // console.log("issues", issuesAsArray);
    const textId = Number(params.text_id);
    const values = [textId, params.title.trim(), params.published, params.entry, params.priority, tagsAsArray, issuesAsArray];

    let sql = '';

    if (params.id) {
      values.push(Number(params.id));
      sql = `UPDATE comments SET text_id = $1, title = $2, published= $3, entry = $4, priority = $5, tags = $6, issues = $7
      WHERE id = $8`;
    } else {
      sql = 'INSERT INTO comments (text_id, title, published, entry, priority, tags, issues) VALUES ($1, $2, $3, $4, $5, $6, $7)';
    }
    sql += ' RETURNING id';

    let data = {};
    try {
      let previousCommentObject = {};
      if (params.id) {
        const selection = await pool.query('SELECT * FROM comments WHERE id = $1', [Number(params.id)]);
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
          const resultId = data.id;
          const logQuery = 'INSERT INTO logs (user_id, table_name, record_id, data0, data1) VALUES($1, $2, $3, $4, $5) RETURNING id';
          const table = 'comments';
          // enum types! - alter table logs
          const logValues = [userObject.id, table, resultId, previousCommentObject, newCommentObject];
          const logResult = await pool.query(logQuery, logValues);
          data.change = logResult?.rows?.[0]?.id;
          await pool.query('COMMIT');
        } catch (error) {
          await pool.query('ROLLBACK');
          return { error };
        }
      } catch (error) {
        return { error };
      }
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getNextPriority(textId) {
    const sql = 'select floor(max(priority)) + 1 as priority from comments where text_id = $1';
    let data = [];
    try {
      const result = await pool.query(sql, [textId]);
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
    const sql = 'SELECT id, priority, title from comments where text_id = $1 and (title ilike $2 OR priority::text like $3) LIMIT 10';
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
    const commentId = params?.id;
    const stringTokenIds = params.tokens;
    let data = {};
    if (commentId && stringTokenIds?.length) {
      // console.log("comment", comment_id, "tokens", stringTokenIds);
      try {
        const sql1 = 'UPDATE strings SET comments = array_remove(comments, $1) WHERE id = ANY($2::int[]) RETURNING id'; // to avoid duplicates
        await pool.query(sql1, [commentId, stringTokenIds]);
        const sql2 = 'UPDATE strings SET comments = array_append(comments, $1) WHERE id = ANY($2::int[]) RETURNING id';
        const result = await pool.query(sql2, [commentId, stringTokenIds]);
        data = result?.rows;
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async removeCommentFromString(params) {
    const commentId = params?.id;
    const stringTokenIds = params?.tokens;
    let data = {};
    if (commentId && stringTokenIds?.length) {
      try {
        const sql = 'UPDATE strings SET comments = array_remove(comments, $1) WHERE id = ANY($2::int[]) RETURNING id';
        const result = await pool.query(sql, [commentId, stringTokenIds]);
        data = result?.rows;
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getStringsRange(params) {
    let data = [];
    if (params.tokens) {
      const range = params.tokens.map(Number);
      // console.log('range', range);
      if (range?.length) {
        try {
          const values = [range.shift()];
          let sql = 'SELECT strings.*, tokens.meta FROM strings LEFT JOIN tokens ON strings.token_id = tokens.id where strings.id ';
          if (range.length) {
            values.push(range.pop());
            sql += 'BETWEEN $1 AND $2';
          } else {
            sql += '=$1';
          }
          const result = await pool.query(sql, values);
          data = result?.rows;
        } catch (error) {
          console.error(error);
        }
      }
    }
    return data;
  },
  async getTextComments(textId) {
    const sql = "SELECT id, title FROM comments WHERE id IN (SELECT unnest(comments) AS coms FROM strings WHERE comments::text <> '{}' GROUP BY coms) AND text_id = $1";
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
    const tokenId = params?.id;
    const commentIds = params?.comments.map((x) => Number(x)).join(',');
    const commentIdsAsArray = `{${commentIds}}`;
    // console.log(commentIdsAsArray);
    let data = {};
    if (tokenId) {
      // console.log("comment", comment_id, "tokens", stringTokenIds);
      try {
        const sql = 'UPDATE strings SET comments = $2 WHERE id = $1 RETURNING id';
        const result = await pool.query(sql, [tokenId, commentIdsAsArray]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getBoundStringsForComment(params) {
    const { id: textId, comment: commentId } = params;
    const sql = 'SELECT strings.*, tokens.meta FROM strings LEFT JOIN tokens ON strings.token_id = tokens.id WHERE text_id = $1 AND $2 = ANY (comments::int[]) ORDER BY id';
    let data = [];
    try {
      const result = await pool.query(sql, [textId, commentId]);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async changeActivationStatus(userId, currentUser, status) {
    console.log('activation request:', userId, 'by', currentUser.id);
    let data = {};
    if (userId && currentUser.privs === 1) {
      try {
        const sql = 'UPDATE users SET activated = $2 WHERE id = $1 RETURNING id';
        const result = await pool.query(sql, [userId, status]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async elevateUser(userId, currentUser) {
    console.log('privileges elevation request:', userId, 'by', currentUser.id);
    let data = {};
    if (userId && currentUser.privs === 1) {
      try {
        const sql = 'UPDATE users SET privs = 1 WHERE id = $1 RETURNING id';
        const result = await pool.query(sql, [userId]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getUsers(id) {
    let sql = 'SELECT id, username, firstname, lastname, email, privs, activated, requested from users';
    let data = [];
    const values = [];

    if (id) {
      sql += ' WHERE id = $1';
      values.push(id);
    } else {
      sql += ' ORDER BY requested DESC';
    }

    try {
      const result = await pool.query(sql, values);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }

    return data;
  },
  async deleteById(currentUser, table, id, limits = {}) {
    console.log(`DELETE from ${table} with ${id} by ${currentUser.id} (${currentUser.username})`);
    // console.log(table, id, limits);
    let data = [];
    try {
      const sqlLimit = Object.entries(limits).map((x) => `AND ${x[0]} = ${x[1]}`).join(' ');
      const sql = `DELETE FROM ${table} WHERE id = $1 ${sqlLimit} RETURNING id`;
      // console.log(sql);
      const result = await pool.query(sql, [id]);
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
        const sql = 'UPDATE users SET text_id = $1 WHERE id = $2 RETURNING id';
        await pool.query(sql, [textId, userId]);
        const result = await pool.query('select * from texts where id = $1', [textId]);
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
      const values = [params.author, params.title, params?.meta || '', params?.comments || false, params?.site || '', params?.credits || '', params.lang, params?.url?.trim() || ''];
      let sql = '';

      if (params.id) {
        const id = Number(params.id);
        values.push(id);
        sql = 'UPDATE texts SET author = $1, title = $2, meta = $3, comments = $4, site = $5, credits = $6, lang = $7, url = $8 WHERE id = $9';
      } else {
        sql = 'INSERT INTO texts (author, title, meta, comments, site, credits, lang, url) VALUES ($1, $2, $3, $4, $5, $6, $7, $8)';
      }

      sql += ' RETURNING id';

      try {
        const result = await pool.query(sql, values);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    } else {
      console.error('Title and author fields are not set!');
    }
    return data;
  },
  async setScheme(params) {
    let data = {};
    if (params.id && params.scheme) {
      try {
        const sql = 'UPDATE texts SET scheme = $2 WHERE id = $1 RETURNING id';
        const result = await pool.query(sql, [params.id, JSON.stringify(params.scheme)]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async updatePubInfo(id, zipsize, published) {
    let data = {};
    try {
      const sql = 'UPDATE texts SET zipsize = $2, published = to_timestamp($3 / 1000.0) WHERE id = $1 RETURNING id';
      const result = await pool.query(sql, [id, zipsize, published]);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getFullComments(id, published = false) {
    let data = [];
    const textId = Number(id);
    if (textId) {
      const suffix = published ? ' AND published = TRUE ' : '';
      const sql = `SELECT * FROM comments WHERE text_id = $1 ${suffix} ORDER by priority ASC, id ASC`;
      try {
        const result = await pool.query(sql, [textId]);
        data = result?.rows;
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async checkCommentsForImage(url) {
    let data = [];
    if (url) {
      const sql = `SELECT id, priority, title FROM comments WHERE 
      jsonb_path_exists(entry::jsonb, '$.** ? (@.type == "figure" && @.attrs.src == "${url}")')`;
      try {
        const result = await pool.query(sql);
        data = result?.rows;
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async addImage(filename, filesize, textId, userId, title) {
    let sqlPart = '(id, filesize, text_id, user_id) VALUES ($1, $2, $3, $4)';
    const values = [filename, filesize, textId, userId];

    if (title) {
      values.push(title);
      sqlPart = '(id, filesize, text_id, user_id, title) VALUES ($1, $2, $3, $4, $5)';
    }

    let data = [];
    try {
      const sql = `INSERT INTO images ${sqlPart} RETURNING id`;
      const result = await pool.query(sql, values);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getImages(textId, fileName) {
    let data = [textId];
    const values = [textId];

    try {
      let sql = 'SELECT * FROM images WHERE text_id = $1 ';

      if (fileName) {
        sql += 'AND id = $2';
        values.push(fileName);
      } else {
        sql += 'ORDER BY created DESC';
      }

      const result = await pool.query(sql, values);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async deleteFromStrings(textId) {
    // console.log(`DELETE from ${table} with ${id} by ${user.username}`);
    let data = [];
    if (textId) {
      try {
        const result = await pool.query('DELETE from strings where text_id = $1', [textId]);
        // await pool.query("DELETE from tokens where lang = $1", [lang]);
        data = result?.rows;
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async insertBatchIntoStrings(textId, batch, langId, noStdout) {
    const t0 = performance.now();
    const tokensCount = batch.length;
    const client = await pool.connect();
    let isError = false;

    try {
      await client.query('BEGIN');
      /* eslint-disable no-await-in-loop */
      /* eslint-disable-next-line no-restricted-syntax */
      for (const [i, item] of batch.entries()) {
        // { p: 45, s: 150, form: 'receive', repr: 'receive', meta: 'word' }
        // console.log(item);
        const token = item.repr;

        await client.query('INSERT INTO tokens (token, lang, meta) VALUES($1, $2, $3) ON CONFLICT (token, lang) DO NOTHING', [token, langId, item.meta]);
        await client.query('INSERT INTO strings (text_id, p, s, form, repr) VALUES($1, $2, $3, $4, $5) ', [textId, item.p, item.s, item.form, token]);
        // console.log(result);

        if (!noStdout) {
          process.stdout.write(`${i}/${tokensCount}\r`);
        }
      }
      await client.query('UPDATE strings SET token_id = tokens.id FROM tokens WHERE tokens.lang = $1 AND tokens.token = strings.repr', [langId]);
      await client.query('COMMIT');
    } catch (error) {
      await client.query('ROLLBACK');
      isError = true;
      console.error(error);
    } finally {
      client.release();
    }
    if (isError) {
      return undefined;
    }

    const t1 = performance.now();
    const secs = ((t1 - t0) / 1000).toFixed(2);
    // console.log(`batch: ${secs}s`);
    return secs;
  },
  async setTextLoaded(textId) {
    let result = [{}];
    try {
      const queryOutput = await pool.query('UPDATE texts SET loaded = True WHERE id = $1 RETURNING *', [textId]);
      result = queryOutput?.rows;
    } catch (err) {
      console.error(err);
    }
    return result;
  },
  async setSource(params) {
    const values = [];
    // console.log(params);
    // return;
    let sql = '';
    let data = [];
    if (params?.id) {
      const id = Number(params.id);
      values.push(id);
      sql = 'UPDATE sources SET lang = $2, bibtex = $3, citekey = $4 WHERE id = $1';
    } else {
      // console.log(params.bib.length);
      sql = 'INSERT INTO sources (text_id, lang, bibtex, citekey) VALUES ($1, $2, $3, $4)';
      const textId = Number(params.text) || 1;
      values.push(textId);
    }
    sql += ' RETURNING id';

    try {
      const queue = [];
      for (let i = 0; i < params.bib.length; i++) {
        const bibjson = params.bib[i];
        const query = pool.query(sql, values.concat([params.lang, JSON.stringify(bibjson), bibjson.id]));
        queue.push(query);
      }
      data = (await Promise.all(queue)).map((x) => x?.rows?.[0]);
    } catch (err) {
      // console.error(JSON.stringify(err));
      data = { error: err?.detail || err?.routine };
    }
    return data;
  },
  async getSource(sourceId) {
    let sql = 'SELECT * from sources';
    const id = Number(sourceId);
    if (id) {
      sql += ` WHERE id = ${id}`;
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
  async checkCommentsForSource(id) {
    let data = [];
    if (id) {
      const sql = `SELECT id, priority, title FROM comments WHERE jsonb_path_exists(entry::jsonb, '$.** ? (@.type == "citation" && @.attrs.id == ${id})')`;

      try {
        const result = await pool.query(sql);
        data = result?.rows;
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getSettings() {
    let data = [];
    const sql = 'SELECT * FROM settings';

    try {
      const result = await pool.query(sql);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async getClasses() {
    let data = [];
    const sql = 'SELECT * FROM classes ORDER BY id';

    try {
      const result = await pool.query(sql);
      data = result?.rows;
    } catch (err) {
      console.error(err);
    }
    return data;
  },
  async setClass(params) {
    const values = [JSON.stringify(params.css, (k, v) => v ?? undefined)];
    // console.log(values);
    // console.log(params);
    let sql = '';
    let data = [];
    if (params?.id) {
      const id = Number(params.id);
      values.push(id);
      sql = 'UPDATE classes SET css = $1 WHERE id = $2';
    } else {
      values.push(params.name);
      sql = 'INSERT INTO classes (css, name) VALUES ($1, $2)';
    }
    sql += ' RETURNING id';
    // console.log(sql);
    try {
      const result = await pool.query(sql, values);
      data = result?.rows?.[0];
    } catch (err) {
      console.error(JSON.stringify(err));
      data = { error: err?.detail || err?.routine };
    }
    return data;
  },
  async deleteClass(className) {
    let data = [];
    if (className) {
      const sql = `SELECT id, priority, title FROM comments WHERE 
      jsonb_path_exists(entry::jsonb, '$.** ? (@.class == "${className}")')`;
      // console.log(sql);
      try {
        const result = await pool.query(sql);
        data = result?.rows?.length;
        if (data === 0) {
          await pool.query('DELETE FROM classes where name = $1', [className]);
        }
      } catch (err) {
        console.error(err);
      }
    }
    return data || 0;
  },
  async renameImage(imageId, imageTitle) {
    let data = [];
    if (imageId) {
      const sql = 'UPDATE images SET title = $2 WHERE id = $1 RETURNING id';
      try {
        const result = await pool.query(sql, [imageId, imageTitle]);
        data = result?.rows?.[0];
      } catch (err) {
        console.error(JSON.stringify(err));
        data = { error: err?.detail || err?.routine };
      }
    }
    return data;
  },
  async setFormatForString(params) {
    // console.log(params);
    const id = Number(params?.id);
    const fmtAsArray = `{${params?.fmt?.length ? params.fmt.join(',') : ''}}`;
    let data = {};
    if (id) {
      try {
        const sql = 'UPDATE strings SET fmt = $2 WHERE id = $1 RETURNING id';
        const result = await pool.query(sql, [id, fmtAsArray]);
        data = result?.rows?.shift();
      } catch (err) {
        console.error(err);
      }
    }
    return data;
  },
  async getLogs(params) {
    const offset = params?.offset || 0;
    const limit = params?.limit || 50;
    const id = Number(params.id) || 1;
    const commentId = Number(params.comment);
    // console.log('comment', commentId);
    const condition = commentId ? `logs.record_id = ${commentId} AND` : '';
    const sql = `SELECT 
      logs.*, (CASE WHEN logs.record_id = comments.id THEN True ELSE False END) AS present
      FROM logs LEFT JOIN comments ON logs.record_id = comments.id
      WHERE ${condition} (data0->>'text_id' = $3::text or data1->>'text_id' = $3::text)
      ORDER BY logs.created DESC, logs.id DESC OFFSET $1 LIMIT $2`;
    // console.log(sql);
    const res = await pool.query(sql, [offset, limit, id]);

    const count = await pool.query(`SELECT count(*) FROM logs WHERE ${condition} (data0->>'text_id' = $1::text or data1->>'text_id' = $1::text)`, [id]);
    return { data: res?.rows, count: Number(count?.rows?.[0]?.count || 0) };
  },
  async getChange(params) {
    const id = Number(params.id) || 1;
    const sql = 'SELECT * from logs WHERE id = $1';
    const res = await pool.query(sql, [id]);
    return res?.rows?.shift();
  },
  async getItemHistory(table, id, lim) {
    const limNumber = Number(lim);
    const limitation = limNumber ? ` LIMIT ${limNumber}` : '';
    let data = [];
    if (id) {
      // console.log(table, id);
      const res = await pool.query(`SELECT id, user_id, round(extract(epoch from created)) as ut, (CASE WHEN data0::text = '{}' THEN True ELSE False END) AS init FROM logs WHERE table_name = $1 AND record_id = $2 ORDER BY created DESC ${limitation}`, [table, id]);
      data = res?.rows;
    }
    return data;
  }
};
