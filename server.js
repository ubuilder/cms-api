import express from "express"
import cors from "cors"
import { routes } from "./routes.js"

const app = express()

app.use(express.json())

app.use(cors())
const {PORT = 3000} = process.env 



app.use('/api/:siteId/', routes)

app.get('/', (req, res) => {
    res.send('server is up!')

})

app.listen(PORT,()=>{
    console.log("start on http://localhost:"+PORT)
})




