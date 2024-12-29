const multer = require("multer")
const path = require("path")

const storage = multer.diskStorage({
    destination: (req, file, cb) => {
        cb(null, path.join("./uploads/imgs"))
    },
    filename: (req,file,cb) => {
        const randomName = Math.floor(Math.random() * 1E9) + Date.now() + file.originalname
        cb(null, randomName) 
    }
})

module.exports = multer({storage})