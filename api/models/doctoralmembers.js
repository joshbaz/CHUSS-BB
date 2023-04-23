const mongoose = require('mongoose')

const doctoralmemberSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        jobtitle: String,
        name: String,
        email: String,
        phoneNumber: String,
        postalAddress: String,
        countryOfResidence: String,
        placeOfWork: String,
        studentsNo: Number,
        typeOfExaminer: {
            type: String,
            default: 'doctoral committee members',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('doctoralmembers', doctoralmemberSchema)
