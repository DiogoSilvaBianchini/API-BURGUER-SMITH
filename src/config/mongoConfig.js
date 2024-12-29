const mongoose = require("mongoose")

const mongoConnection = () => {
    const {DB_MONGO_NAME, DB_MONGO_PASSWORD, DB_MONGO_PORT, DB_MONGO_USER_NAME, NODE_ENV, DB_HOST} = process.env

    const host = NODE_ENV == "development" ? "0.0.0.0" : DB_HOST

    const urlConnect = NODE_ENV == "development" ?
    `mongodb://${DB_MONGO_USER_NAME}:${DB_MONGO_PASSWORD}@${host}:${DB_MONGO_PORT}/${DB_MONGO_NAME}?authSource=admin`:
    `mongodb+srv://${DB_MONGO_USER_NAME}:${DB_MONGO_PASSWORD}@cluster0.j2ukr.mongodb.net/?retryWrites=true&w=majority&appName=Cluster0`
    
    const mongoConfig = {
        serverSelectionTimeoutMS: 20000, 
        socketTimeoutMS: 20000,
    }

    mongoose.connect(urlConnect, mongoConfig)


    mongoose.connection.on("error", (error) => {
        console.log(error)
    })
    mongoose.connection.once("open", () => console.log("Banco de dados connectado"))

}


module.exports = mongoConnection