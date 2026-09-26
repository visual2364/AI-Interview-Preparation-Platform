const multer = require("multer")
const path = require("path")


const upload = multer({
    storage: multer.memoryStorage(),
    limits: {
        fileSize: 3 * 1024 * 1024 // 3MB
    },
    fileFilter: (req, file, callback) => {
        if (file.mimetype !== "application/pdf" || path.extname(file.originalname).toLowerCase() !== ".pdf") {
            const error = new Error("Resume must be a PDF file.")
            error.status = 400
            return callback(error)
        }

        return callback(null, true)
    },
})


module.exports = upload