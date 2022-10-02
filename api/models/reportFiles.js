const mongoose = require('mongoose')

const reportFileSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    fileId: String,
    fileName: String,
    fileExtension: String,
    fileType: String,
    fileSize: String,
    fileData: String,
    originalName: String,
    description: String,
})
module.exports = mongoose.model('reportFiles', reportFileSchema)
