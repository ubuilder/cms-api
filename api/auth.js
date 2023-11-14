import jwt from "jsonwebtoken";
import bcrypt from "bcrypt";

export async function login({ body: { password, username }, db }) {
  const user = await db("u-users").get({ where: { username } });
  
  if (!user) {
    throw new Error("404:username: user not found");
  }

  const result = bcrypt.compareSync(password, user.password);

  if (!result) {
    throw new Error("401:password: Invalid password");
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
  if(!body.username) {
    throw new Error('400:username: this field is required!')
  }
  if(!body.password) {
    throw new Error('400:password: this field is required!')
  }
  if(!body.name) {
    throw new Error('400:name: this field is required!')
  }
  
  
  
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
  if(user.id === 'demo') return {
    success: 200, message: 'success', data: user
  }
  const result = await db('u-users').get({where: {id: user.id}})

  if(result) {
    delete result['password']
  }
  
  return {
    status: 200,
    message: "success",
    data: result,
  };
}

export async function hasUser({db, body}) {
  const users = await db('u-users').query().then(res => res.data)
  
  return {
    status: 200,
    message: 'success',
    data: users.length > 0
  }
}

export async function updateProfile({body, db, user}) {
  

  await db('u-users').update(user.id, {
    ...user, 
    ...body
  }) 

  return {
    status: 200,
    message: 'User updated sucessfully',
    data: true
  }
}