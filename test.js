import { getUser, login, logout, register } from "./api/auth.js";
import {connect} from '@ulibs/db'
import { createPage, getPages, removePage, updatePage } from "./api/pages.js";

const db = connect({filename: './test.json'}).getModel

logout({db})


// const result = await register({db, body: {
//     username: "hadi",
//     name: "hadigak",
//     email: "hadi@gmail.com",
//     password: "abc"
// }})

// console.log("registered: ", result)

// console.log(
// await login({db, body:{
//     username: "hadi",
//     password: "abc"
// }})
// )

// console.log(
//     await createPage({db, body: {
//         title: 'abc',
//         slug: '/test'
//     }})
// )

// KTBUXHmH
// console.log(
//     await updatePage({db, body: {
//         id: 'KTBUXHmH',
//         data: {

//         load: [
//             {
//                 name: 'Blogs',
//                 table: 'blogs',
//                 multiple: true,
//                 filters: []
//             }
//         ]
//     }

//     }})
// )

console.log(
    await getPages({db, body: {
        
    }})
)




const loginResult = await login({db, body: {username: 'hadi', password: 'abc'}});

const token = loginResult.data.token;

const user = await getUser({db, body: {}, user: loginResult.data.user})

console.log(user.data)

// console.log(
//     await removePage({db, body: {
//         id: 'KTBUXHmH'
//     }})
// )