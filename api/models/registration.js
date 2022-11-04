const mongoose = require('mongoose')

const registrationSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    registrationtype: {
        type: String,
        required: true,
    },
    date: String,
    semester: String,
    academicYear: String,
    registrationfile: {
        fileId: String,
        fileName: String,
        fileExtension: String,
        fileType: String,
        fileSize: String,
        fileData: String,
        originalName: String,
        description: String,
    },
})

module.exports = mongoose.model('registrations', registrationSchema)
