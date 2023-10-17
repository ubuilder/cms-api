import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export async function login({ body: { password, username }, db }) {
    console.log('db', await db('u-users').query({}), {password, username})
  const user = await db("u-users").get({ where: { username } });
  
  if (!user) {
    throw new Error("404: user not found");
  }

  const result = bcrypt.compareSync(password, user.password);

  if (!result) {
    throw new Error("401: Invalid password");
  }

  let token = jwt.sign(
    {
      user: {
        id: user.id,
        name: user.name,
        email: user.email,
        username: user.username,
      },
    },
    process.env.SECRET_KEY ?? "ubuilder"
  );

  return {
    status: 200,
    message: "Logged in successfully!",
    data: {
      user,
      token,
    },
  };
}

export function logout({ db }) {
  console.log("logout");

  return {
    status: 200,
    message: "logged out successfully!",
  };
}

export async function register({ db, body }) {
  console.log('register', body)
  const user = {
    username: body.username,
    name: body.name,
    email: body.email,
    password: bcrypt.hashSync(body.password, 10),
  };

  const ids = await db("u-users").insert(user);
  user.id = ids[0];

  return {
    data: user,
    status: 200,
    message: "user created successfully",
  };
}

export async function getUser({ db, body, user }) {
  return {
    status: 200,
    message: "success",
    data: user,
  };
}
