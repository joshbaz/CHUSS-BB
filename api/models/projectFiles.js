const mongoose = require('mongoose')

const projectFileSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        fileId: String,
        fileName: String,
        fileExtension: String,
        fileType: String,
        fileSize: String,
        fileData: String,
        originalName: String,
        description: String,
    },
    { timestamps: true }
)

module.exports = mongoose.model('projectFiles', projectFileSchema)
