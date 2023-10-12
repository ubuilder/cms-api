import { Router } from "express";
import {readdir, stat} from 'fs/promises'
import { getUser, login, logout, register } from "./api/auth.js";
import { connect } from "@ulibs/db";
import jwt from "jsonwebtoken";
import { createPage, getPages, removePage, updatePage } from "./api/pages.js";
import { createTable, getTables, removeTable, updateTable } from "./api/content.js";
import { getData, insertData, removeData, updateData } from "./api/data.js";
import { getFile, removeFile, updateFile, uploadFile } from "./api/assets.js";

async function auth(req, res, next) {
  try {
    const authorization = req.headers.authorization ?? "";
    const token = authorization.split(" ")[1];
    if(!token) throw new Error('401: jwt token not provided')
    const user = jwt.verify(token, process.env.SECRET_KEY ?? "ubuilder");


    if (!user) {
      throw new Error("401: invalid jwt token");
    }

    req.user = user.user;
  } catch (err) {
    console.log(err.name, err.message)
    
    if (err.message.includes(":")) {
      const [status, message] = err.message.split(":").map((x) => x.trim());
      return res.send({
        status,
        message,
      });
    } else {
        return res.send({
        status: 400,
        message: err.message,
      });
    }
  }

  return next();
}

async function getHandler(req, cb) {
  const body = req.body;
  const params = req.params;
  const headers = req.headers;
  const query = req.query;

  const user = req.user ?? null;

  const db = connect({ filename: `./data/${params.siteId}/db.json` }).getModel;

  try {
    return await cb({ body, params, headers, query, db, user });
  } catch (err) {
    console.log(err.name, err.message)
    if (err.message.includes(":")) {
      const [status, message] = err.message.split(":").map((x) => x.trim());
      return {
        status,
        message,
      };
    } else {
      return {
        status: 400,
        message: err.message,
      };
    }
  }
}

function handle(cb) {
  return async (req, res) => {
    const { status, headers = {}, ...body } = await getHandler(req, cb);

    // res.writeHead(200, undefined, headers)
    res.send(body);
  };
}

const routes = Router();

// async function addFolderRoutes(folder = './api') {
//   const files = await readdir(folder)
//   for(let file of files) {
//     const stats = await stat(folder + '/' + file)
//     if(stats.mode === 16877) {
//       addFolderRoutes(folder + '/' + file)
//     } else {
//       const module = await import(folder +'/' + file)
//       Object.keys(module).forEach(fn => {
//         const route = folder.substring(1) + '/' + file.replace('.js', '') + '/' + fn
//         console.log('add route: ', route)
//         routes.get(route, handle(module[fn]))
//       })
//     }
//   }
// }

// await addFolderRoutes('./api')

console.log('export routes', routes)
export {routes}
// auth
routes.post("/:siteId/auth/login", handle(login));
routes.post("/:siteId/auth/logout", auth, handle(logout));
routes.post("/:siteId/auth/register", handle(register));
routes.post("/:siteId/auth/getUser", auth, handle(getUser));

// content
routes.post("/:siteId/content/createTable", auth, handle(createTable))
routes.post("/:siteId/content/getTables", auth, handle(getTables))
routes.post("/:siteId/content/updateTable", auth, handle(updateTable))
routes.post("/:siteId/content/removeTable", auth, handle(removeTable))

// data
routes.post("/:siteId/data/insertData", auth, handle(insertData))
routes.post("/:siteId/data/getData", auth, handle(getData))
routes.post("/:siteId/data/updateData", auth, handle(updateData))
routes.post("/:siteId/data/removeData", auth, handle(removeData))

// pages
routes.post("/:siteId/pages/createPage", auth, handle(createPage))
routes.post("/:siteId/pages/updatePage", auth, handle(updatePage))
routes.post("/:siteId/pages/removePage", auth, handle(removePage))
routes.post("/:siteId/pages/getPages", auth, handle(getPages))

// assets
routes.post('/:siteId/assets/updateFile', auth, handle(updateFile))
routes.post('/:siteId/assets/removeFile', auth, handle(removeFile))
routes.post('/:siteId/assets/getFile', auth, handle(getFile))

routes.post('/:siteId/assets/uploadFile', auth, (req, res) => {
  const siteId = params.siteId

    if(!existsSync('./data/' + siteId + 'assets')) {
        mkdirSync('./data/' + siteId + 'assets', {recursive: true})
    }
    // TODO: "implement File upload"

    res.send({
      message: 'File uploaded syccessfully!',
      data: {
        // ...
      }
    })
})

// Download
routes.get('/:siteId/files/:fileId', (req, res) => {
  // send file

  res.send('file content')
})
