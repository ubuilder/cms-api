import { connect } from "@ulibs/db";

const {getModel} = connect({
    filename: './mytst.json'
})


const users = getModel('users')


const res = await users.insert({name: 'Hadi'})
const res2 = await users.query()

console.log('res: ', res)
console.log('res2: ', res2)
