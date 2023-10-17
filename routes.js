import { Router } from "express";
import { readdir, stat } from "fs/promises";
import { existsSync, mkdirSync } from "fs";
import { getUser, login, logout, register } from "./api/auth.js";
import { connect, id } from "@ulibs/db";
import jwt from "jsonwebtoken";
import { createPage, getPages, removePage, updatePage } from "./api/pages.js";
import {
  createTable,
  getTables,
  removeTable,
  updateTable,
} from "./api/content.js";
import { getData, insertData, removeData, updateData } from "./api/data.js";
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
  console.log(req)
  const body = req.body;

  const params = req.params;
  const headers = req.headers;
  const query = req.query;
  const db = req.db;

  console.log({params})

  const user = req.user ?? null;

  try {
    return await cb({ body, params, headers, query, db, user });
  } catch (err) {
    console.log(err.name, err.message);
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
    const { status, message, headers = {}, data } = await getHandler(req, cb);

    // res.writeHead(200, undefined, headers)
    res.send({ status, message, data });
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

console.log("export routes", routes);
export { routes };

routes.use("/:siteId", (req, res, next) => {
  if (!existsSync(`./data/${req.params.siteId}`)) {
    mkdirSync(`./data/${req.params.siteId}/files`, { recursive: true });
  }

  req.db = connect({
    filename: "./data/" + req.params.siteId + "/db.json",
  }).getModel;

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
routes.post("/:siteId/data/updateData", auth, handle(updateData));
routes.post("/:siteId/data/removeData", auth, handle(removeData));

// pages
routes.post("/:siteId/pages/createPage", auth, handle(createPage));
routes.post("/:siteId/pages/updatePage", auth, handle(updatePage));
routes.post("/:siteId/pages/removePage", auth, handle(removePage));
routes.post("/:siteId/pages/getPages", auth, handle(getPages));

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
        return cb(null, id());
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
