import { Router } from "express";
import { login, logout, register } from "./routes/auth.js";
import { connect } from "@ulibs/db";
import jwt from "jsonwebtoken";

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

export const routes = Router();

function test(params) {
    console.log(params)
    return {
        status: 200,
        message: 'Successfully',
        data: params
    }
}

routes.get("/auth/login", handle(login));
routes.get("/auth/logout", handle(logout));
routes.get("/auth/register", handle(register));
routes.get('/test', auth, handle(test))
