import express from "express"
import cors from "cors"
import { routes } from "./routes.js"
import multer from "multer"

const app = express()

app.use(express.json())

app.use(cors())
const {PORT = 3000} = process.env 



app.use('/api/', routes)

app.get('/', (req, res) => {
    res.send('server is up!')

})

app.listen(PORT,()=>{
    console.log("server startes on http://localhost:"+PORT)
})




