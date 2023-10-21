import { Router } from "express";
import { readdir, stat } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { getUser, login, logout, register } from "./api/auth.js";
import { connect, id as getId } from "@ulibs/db";
import jwt from "jsonwebtoken";
import {
  createPage,
  getPageCss,
  getPages,
  removePage,
  updatePage,
} from "./api/pages.js";
import {
  createTable,
  getTables,
  removeTable,
  updateTable,
} from "./api/content.js";
import { getData, getDataHistory, insertData, recoverData, removeData, updateData } from "./api/data.js";
import { getFiles, removeFile, updateFile } from "./api/assets.js";
import multer from "multer";
import path from "path";
import {
  createComponent,
  getComponents,
  removeComponent,
  updateComponent,
} from "./api/components.js";
import { getSettings, setSettings } from "./api/settings.js";

function getDb(siteId, user) {
  const getModel = connect({
    filename: "./data/" + siteId + "/db.json",
  }).getModel;

  const getHistoryModel = connect({
    filename: "./data/" + siteId + "/db_history.json",
  }).getModel;

  return (table) => {
    const db = getModel(table);
    const historyDb = getHistoryModel(table);

    async function insert(data) {
      const res = await db.insert(data);
      await historyDb.insert({
        data: {id: res[0], ...data},
        type: "insert",
        created_at: new Date().valueOf(),
        created_by: user?.id ?? null,
      });

      return res;
    }

    async function update(id, data) {
      const res = await db.update(id, data);
      await historyDb.insert({
        data: await db.get({ where: { id } }),
        changed: data,
        type: "update",
        created_at: new Date().valueOf(),
        created_by: user?.id ?? null,
      });

      return res;
    }

    async function remove(id, data) {
      const res = await db.remove(id);

      await historyDb.insert({
        type: "remove",
        created_at: new Date().valueOf(),
        created_by: user?.id ?? null,
      });

      return res;
    }

    async function recover(history_id) {
      const data = await historyDb.get({ where: { id: history_id } });

      const id = data.data.id;
      const body = data.data;
      await db.update(id, body);

      await historyDb.insert({
        type: "recover",
        history_id,
        created_at: new Date().valueOf(),
        created_by: user?.id ?? null,
      });

      return body;
    }

    return {
      insert,
      update,
      remove,
      history: historyDb.query,
      recover,
      query: db.query,
      get: db.get,
    };
  };
}

async function auth(req, res, next) {
  try {
    const authorization = req.headers.authorization ?? "";
    const token = authorization.split(" ")[1];
    if (!token) throw new Error("401: jwt token not provided");
    const user = jwt.verify(token, process.env.SECRET_KEY ?? "ubuilder");

    if (!user) {
      throw new Error("401: invalid jwt token");
    }

    req.user = user.user;
  } catch (err) {
    console.log(err.name, err.message);

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
  const db = req.db;

  const user = req.user ?? null;

  try {
    return await cb({ body, params, headers, query, db, user });
  } catch (err) {
    console.log(err.name, err.message);
    if (err.message.includes(":")) {
      const [status, ...message] = err.message.split(":").map((x) => x.trim());
      console.log("message: ", message);
      return {
        status,
        field: message.length === 2 ? message[0] : undefined,
        message: message.length === 2 ? message[1] : message[0],
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
    const {
      status,
      message,
      field,
      headers = {},
      data,
    } = await getHandler(req, cb);

    // res.writeHead(200, undefined, headers)
    res.send({ status, message, field, data });
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

export { routes };

routes.use("/:siteId", (req, res, next) => {
  if (!existsSync(`./data/${req.params.siteId}`)) {
    mkdirSync(`./data/${req.params.siteId}/files`, { recursive: true });
  }

  req.db = getDb(req.params.siteId);

  next();
});
// auth
routes.post("/:siteId/auth/login", handle(login));
routes.post("/:siteId/auth/logout", auth, handle(logout));
routes.post("/:siteId/auth/register", handle(register));
routes.post("/:siteId/auth/getUser", auth, handle(getUser));

// content
routes.post("/:siteId/content/createTable", auth, handle(createTable));
routes.post("/:siteId/content/getTables", auth, handle(getTables));
routes.post("/:siteId/content/updateTable", auth, handle(updateTable));
routes.post("/:siteId/content/removeTable", auth, handle(removeTable));

// data
routes.post("/:siteId/data/insertData", auth, handle(insertData));
routes.post("/:siteId/data/getData", auth, handle(getData));
routes.post("/:siteId/data/getDataHistory", auth, handle(getDataHistory));
routes.post("/:siteId/data/recoverData", auth, handle(recoverData));
routes.post("/:siteId/data/updateData", auth, handle(updateData));
routes.post("/:siteId/data/removeData", auth, handle(removeData));

// pages
routes.post("/:siteId/pages/createPage", auth, handle(createPage));
routes.post("/:siteId/pages/updatePage", auth, handle(updatePage));
routes.post("/:siteId/pages/removePage", auth, handle(removePage));
routes.post("/:siteId/pages/getPages", auth, handle(getPages));
routes.post("/:siteId/pages/getPageCss", auth, handle(getPageCss));

// components
routes.post(
  "/:siteId/components/createComponent",
  auth,
  handle(createComponent)
);
routes.post(
  "/:siteId/components/updateComponent",
  auth,
  handle(updateComponent)
);
routes.post(
  "/:siteId/components/removeComponent",
  auth,
  handle(removeComponent)
);
routes.post("/:siteId/components/getComponents", auth, handle(getComponents));

// settings
routes.post("/:siteId/settings/setSettings", auth, handle(setSettings));
routes.post("/:siteId/settings/getSettings", auth, handle(getSettings));

// assets
routes.post("/:siteId/assets/updateFile", auth, handle(updateFile));
routes.post("/:siteId/assets/removeFile", auth, handle(removeFile));
routes.post("/:siteId/assets/getFiles", auth, handle(getFiles));

routes.post(
  "/:siteId/assets/uploadFile",
  auth,
  multer({
    storage: multer.diskStorage({
      destination: (req, file, cb) => {
        return cb(null, "./data/" + req.params.siteId + "/files");
      },
      filename: (req, file, cb) => {
        return cb(null, getId());
      },
    }),
  }).single("file"),
  async (req, res) => {
    const id = req.file.path.split("/").pop();

    const data = {
      id,
      name: req.file.originalname,
      type: req.file.mimetype.split("/")[0],
      alt: "",
    };
    await req.db("u-assets").insert(data);

    // TODO: "implement File upload"

    res.send({
      status: 200,
      message: "File uploaded syccessfully!",
      data,
    });
  }
);

// Download
routes.get("/:siteId/files/:fileId", (req, res) => {
  // send file

  res.sendFile(req.params.fileId, {
    root: path.resolve("./data/" + req.params.siteId + "/files/"),
  });
});
