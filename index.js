const { config } = require("dotenv")
const mongoConnection = require("./src/config/mongoConfig")
const express = require("express")
const router = require("./src/routes")
const {sequelize} = require("./src/database/postgress/models")

const PORT = process.env.PORT
const app = express()

config()

app.use("/imgs", express.static("./uploads/imgs"))

sequelize.sync({alter: true}).then(() => {
    mongoConnection(app)
    router(app)
}).catch(err => {
    console.log(err)
    app.use((req,res,next) => {
        return res.status(500).json({
            msg: "Servidor em manutenção, tente novamente mais tarde", 
            results: false, 
            status: 500
        })
    })
}) 


app.listen(PORT, () => console.log(`http://localhost:${PORT}`))
