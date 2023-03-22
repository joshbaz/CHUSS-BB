const mongoose = require('mongoose')

const departmentSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    deptName: {
        type: String,
        required: true,
    },
    deptHead: {
        type: String,
    },
    email: String,
    otherEmail: String,
    officeNumber: String,
    mobileNumber: String,
    creationDate: Date,
})

module.exports = mongoose.model('departments', departmentSchema)
