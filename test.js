import { login, logout, register } from "./routes/auth.js";
import {connect} from '@ulibs/db'

const db = connect({filename: './test.json'}).getModel

logout({db})


// const result = await register({db, body: {
//     username: "hadi",
//     name: "hadigak",
//     email: "hadi@gmail.com",
//     password: "abc"
// }})

// console.log("registered: ", result)

console.log(
await login({db, body:{
    username: "hadi",
    password: "abc"
}})
)
