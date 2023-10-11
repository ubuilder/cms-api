import { getUser, login, logout, register } from "./api/auth.js";
import { connect } from "@ulibs/db";
import { createPage, getPages, removePage, updatePage } from "./api/pages.js";
import { createTable, getTables, removeTable } from "./api/content.js";
import { getData, insertData, removeData, updateData } from "./api/data.js";

const db = connect({ filename: "./test.json" }).getModel;

// logout({db})
const {
  data: { user },
} = await login({ db, body: { username: "hadi", password: "abc" } });

const { data: post } = await insertData({
  db,
  user,
  body: {
    table: "posts",
    data: {
      title: "First post",
    },
  },
});

// wluQSQbC
// const {data: author} = await insertData({
//     db,
//     user,
//     body: {
//         table: 'users',
//         data: {
//             name: 'Hadi Ahmadi',
//             posts: ['wluQSQbC']
//         }
//     }
// })

// await 

// await updateData({
//   db,
//   user,
//   body: {
//     table: "posts",
//     id: "wluQSQbC",
//     data: {
//     //   title: 'Update title',
//       author_id: null,
//     },
//   },
// });

removeTable({
    db,
    body: {
        id: 'PJRJpdLF'
    }
})
// const data = await getData({
//     db,
//     body: {
//         table: 'posts',
//         where: {id: 30}
//     }
// })

// console.log(data)

// await removeData({
//     user, 
//     db, 
//     body: {
//         table: 'posts',
//         id: 'wluQSQbC'
//     }
// })
// const {data: res} = await createTable({db, body: {
//     name: 'users',
//     icon: 'users',
//     fields: [{
//         name: 'name',
//         type: 'plain_text',
//         required: false,
//     }, {
//         name: 'posts',
//         type: 'relation',
//         multiple: true,
//         required: true
//     }]
// }})

// const {data: res2} = await createTable({db, body: {
//     name: 'posts',
//     icon: 'books',
//     fields: [{
//         name: 'title',
//         type: 'plain_text',
//         required: false,
//     }, {
//         name: 'author',
//         type: 'relation',
//         multiple: false,
//         required: true
//     }]
// }})
// console.log(res)

// const {data: tables} = await getTables({db, body: {

// }})

// console.log(tables)

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

// console.log(
//     await getPages({db, body: {

//     }})
// )

// const loginResult = await login({db, body: {username: 'hadi', password: 'abc'}});

// const token = loginResult.data.token;

// const user = await getUser({db, body: {}, user: loginResult.data.user})

// console.log(user.data)

// console.log(
//     await removePage({db, body: {
//         id: 'KTBUXHmH'
//     }})
// )
