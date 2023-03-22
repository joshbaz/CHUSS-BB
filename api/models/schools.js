const mongoose = require('mongoose')

const schoolSchema = mongoose.Schema({
    _id: mongoose.Schema.Types.ObjectId,
    schoolName: {
        type: String,
        required: true,
    },
    deanName: {
        type: String,
    },
    deanDesignation: {
        type: String,
    },
    email: String,
    otherEmail: String,
    officeNumber: String,
    mobileNumber: String,

    departments: [
        {
            departmentId: {
                type: mongoose.Schema.Types.ObjectId,
                ref: 'departments',
            },
        },
    ],
})

module.exports = mongoose.model('schools', schoolSchema)
