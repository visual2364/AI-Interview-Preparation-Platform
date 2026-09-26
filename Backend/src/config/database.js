const mongoose = require("mongoose")



async function connectToDB() {
    if (!process.env.MONGO_URI) {
        throw new Error("MONGO_URI must be configured before connecting to MongoDB.")
    }

    try {
        await mongoose.connect(process.env.MONGO_URI)

        console.log("Connected to Database")
    }
    catch (err) {
        throw new Error("Could not connect to MongoDB.", { cause: err })
    }
}

module.exports = connectToDB