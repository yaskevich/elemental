import fs from 'fs';
import path from 'path';
import bodyParser from 'body-parser';
import compression from 'compression';
import express from 'express';
import fileUpload from 'express-fileupload';
import history from 'connect-history-api-fallback';
import { execSync } from 'child_process';
import { gzipSync } from 'zlib';
import { fileURLToPath } from 'url';
import db from './db.js';
import ssr from './ssr.js';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const __locales = JSON.parse(fs.readFileSync(path.join(__dirname, 'locales.json'), 'utf8'));
const __package = JSON.parse(fs.readFileSync(path.join(__dirname, 'package.json'), 'utf8'));
// https://github.com/TiagoDanin/Locale-Codes/blob/master/documentation.md

const port = process.env.PORT || 8080;
const appInfo = {
  commit: process.env.COMMIT,
  unix: process.env.COMMITUNIX,
  server: __package.version,
};

const dirs = { // mapping the directories to the routes accessible without authorisation and to their absolute paths
  sites: { route: '/api/files', path: null },
  images: { route: '/api/images', path: null },
  public: { route: '/', path: null },
  backups: { route: null, path: null },
};

const setup = () => {
  const mb = 1024 * 1024;

  const app = express();

  const options = db.getSettingsState();
  app.use(fileUpload({ limits: { fileSize: (options.imgsizelimit || 1) * mb }, abortOnLimit: true, defParamCharset: 'utf8' })); // 1 MB
  app.use(compression());
  app.set('trust proxy', 1);
  app.use(bodyParser.json({ limit: (options.txtsizelimit || 10) * mb })); // 10 MB
  app.use(bodyParser.urlencoded({ extended: true }));

  Object.keys(dirs).forEach((x) => {
    const fullPath = path.join(__dirname, x);
    fs.mkdirSync(fullPath, { recursive: true });
    const url = dirs[x].route;
    if (url) {
      app.use(url, express.static(fullPath));
    }
    dirs[x].path = fullPath;
  });

  app.use(history());

  return app;
};

const getIndexPath = () => path.join(dirs.public.path, 'index.html');
const buildSite = async (id) => ssr.build(__dirname, id, dirs.sites.path, dirs.images.path);
const listBackups = () => fs.readdirSync(dirs.backups.path);
const getBackupFilePath = (id) => {
  const filePath = path.join(dirs.backups.path, id);
  return fs.existsSync(filePath) ? filePath : '';
};

async function deleteImage(user, id, file) {
  const textId = String(Number(id) || 1);
  let result = {};

  if (file) {
    const filePath = path.join(dirs.images.path, textId, file);
    const url = `/api/images/${textId}/${file}`;
    // console.log("file", file, url);
    const comments = await db.checkCommentsForImage(url);

    if (comments.length) {
      // console.log("check", comments);
      result = { error: 'comments', comments };
    } else {
      try {
        // fs.unlinkSync(filePath);
        const check = await db.deleteById(user, 'images', file, { text_id: textId });
        if (check?.[0]?.id === file) {
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
  return result;
}

async function saveImage(user, filesData, id) {
  let status = 200;
  let fileName = '';

  if (Object.keys(filesData).length) {
    // console.log(Object.keys(req.files.file));
    const img = filesData.file;
    const ext = img.mimetype.split('/').pop();
    const fileTitle = path.parse(img.name).name;
    const fileSize = img.size;
    const textId = id || 1;
    // console.log("img:", img.md5, title, ext);
    const currentDir = path.join(dirs.images.path, textId);
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
      const result = await db.addImage(fileName, fileSize, textId, user.id, fileTitle);
      // console.log(result);
      if (result?.id !== fileName) {
        status = 406;
      }
    }
  } else {
    console.log('No files were uploaded');
    status = 400;
  }
  return [status, fileName];
}

function performBackup(user) {
  // https://www.npmjs.com/package/filesize
  const today = new Date();
  const backupFile = `${today.toISOString().split('T')[0]}.tar`;
  const filename = path.join(dirs.backups.path, backupFile);
  const cmd = `pg_dump -U ${process.env.PGUSER} -h ${process.env.PGHOST || '127.0.0.1'} -p ${
    process.env.PGPORT || 5432
  } -f ${filename} -F t -d ${process.env.PGDATABASE}`;
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
  console.log(`backup by user ${user.id}`);
  return { file: `${backupFile}.gz`, error: message };
}

export default {
  setup,
  langList: __locales,
  appName: __package.name,
  appInfo,
  port,
  buildSite,
  listBackups,
  getBackupFilePath,
  getIndexPath,
  deleteImage,
  saveImage,
  performBackup,
};
