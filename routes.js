import { Router } from "express";
import {readdir, stat} from 'fs/promises'
import { getUser, login, logout, register } from "./api/auth.js";
import { connect } from "@ulibs/db";
import jwt from "jsonwebtoken";
import { createPage, getPages, removePage, updatePage } from "./api/pages.js";

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

  const db = connect({ filename: "./data.json" }).getModel;

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

function test(params) {
    console.log(params)
    return {
        status: 200,
        message: 'Successfully',
        data: params
    }
}


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
routes.post("/auth/login", handle(login));
routes.post("/auth/logout", auth, handle(logout));
routes.post("/auth/register", handle(register));
routes.post("/auth/getUser", auth, handle(getUser));

// content
// routes.get("/content/createTable", handle(createTable))
// routes.get("/content/getTables", handle(getTables))
// routes.get("/content/updateTable", handle(updateTable))
// routes.get("/content/removeTable", handle(removeTable))

// // data
// routes.get("/data/insertData", handle(insertData))
// routes.get("/data/editData", handle(editData))
// routes.get("/data/updateData", handle(updateData))
// routes.get("/data/removeData", handle(removeData))

// pages
routes.post("/pages/createPage", auth, handle(createPage))
routes.post("/pages/updatePage", auth, handle(updatePage))
routes.post("/pages/removePage", auth, handle(removePage))
routes.post("/pages/getPages", handle(getPages))

