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


 // const selectResult = await pool.query(`${selectables[table]} WHERE id = ${id}`);

 export default {
   async getCorpusAsConll() {
     const sql = `select strings.id as sid, strings.p, strings.form as v, strings.s, strings.token_id as tid, strings.repr, tokens.token as utoken, strings.unit_id as uid, pos as cl, feats, lemma from strings left  join tokens on strings.token_id = tokens.id  left  join units on strings.unit_id = units.id`;
     return await pool.query(sql);
   }
 }
