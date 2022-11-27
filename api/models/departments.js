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
    officeNumber: String,
    creationDate: String,
})

module.exports = mongoose.model('departments', departmentSchema)
