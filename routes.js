import { Router } from "express";
import { existsSync, mkdirSync, writeFileSync } from "fs";
import { getUser, hasUser, login, logout, register, updateProfile } from "./api/auth.js";

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
import { getDb } from "./lib/db.js";
import { getForms, submitForm } from "./api/form.js";


async function auth(req, res, next) {
  if(req.user) return next(); // softAuth


  try {
    const authorization = req.headers.authorization ?? "";
    const token = authorization.split(" ")[1];

    if(req.params.siteId === 'demo') {
      req.user = {
        id: "demo",
        name: "Demo",
        email: "demo@gmail.com",
        username: "123",
        password: ""
      }
      return next()
    }
    
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

// add user to req, and if not authenticated, do nothing
async function softAuth(req, res, next) {
  try {
    const authorization = req.headers.authorization ?? "";
    const token = authorization.split(" ")[1];
    if (token) {
      const user = jwt.verify(token, process.env.SECRET_KEY ?? "ubuilder");

      if (user) {
        req.user = user.user;
      }
    } 

  } catch (err) {
    console.log(err.name, err.message);
  }

  return next();
}

async function getHandler(req, cb) {
  const body = req.body;

  const params = req.params;
  const headers = req.headers;
  const query = req.query;
  const db = req.db;

  params.siteId = params.siteId.replace(':', '_')
  
  const user = req.user ?? null;

  try {
    return await cb({ body, params, headers, query, db, user });
  } catch (err) {
    console.log(err.name, err.message);
    console.log(err)
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

    res.send({ status, message, field, data });
  };
}

const routes = Router();


export { routes };

routes.use("/:siteId", softAuth, (req, res, next) => {
  req.siteId = req.params.siteId.replace(':', '_')
  if (!existsSync(`./data/${req.siteId}`)) {
    mkdirSync(`./data/${req.siteId}/files`, { recursive: true });
    mkdirSync(`./data/${req.siteId}/components`, { recursive: true });
    writeFileSync(`./data/${req.siteId}/db.json`, '{}')

  }

  req.db = getDb(req.siteId, req.user);

  next();
});
// auth
routes.post("/:siteId/auth/login", handle(login));
routes.post("/:siteId/auth/logout", auth, handle(logout));
routes.post("/:siteId/auth/register", handle(register));
routes.post("/:siteId/auth/getUser", auth, handle(getUser));
routes.post("/:siteId/auth/hasUser", handle(hasUser));
routes.post("/:siteId/auth/updateProfile", handle(updateProfile));



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

// forms
routes.post('/:siteId/form/submitForm', handle(submitForm));
routes.post('/:siteId/form/getForms', handle(getForms));

// pages
routes.post("/:siteId/pages/createPage", auth, handle(createPage));
routes.post("/:siteId/pages/updatePage", auth, handle(updatePage));
routes.post("/:siteId/pages/removePage", auth, handle(removePage));
routes.post("/:siteId/pages/getPages", handle(getPages));
routes.post("/:siteId/pages/getPageCss", handle(getPageCss));

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
routes.post("/:siteId/components/getComponents", handle(getComponents));

// settings
routes.post("/:siteId/settings/setSettings", auth, handle(setSettings));
routes.post("/:siteId/settings/getSettings", handle(getSettings));

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
        return cb(null, "./data/" + req.siteId + "/files");
      },
      filename: (req, file, cb) => {
        return cb(null, getId());
      },
    }),
  }).single("file"),
  async (req, res) => {
    const id = (req.file.path.split("/").pop()).split('\\').pop();

    const data = {
      id,
      name: req.file.originalname,
      type: req.file.mimetype.split("/")[0],
      alt: "",
    };
    await req.db("u-assets").insert(data);

    res.send({
      status: 200,
      message: "File uploaded syccessfully!",
      data,
    });
  }
);

// Download
routes.get("/:siteId/files/:fileId", (req, res) => {

  res.sendFile(req.params.fileId, {
    root: path.resolve("./data/" + req.siteId + "/files/"),
  });
});
