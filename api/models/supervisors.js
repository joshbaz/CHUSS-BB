const mongoose = require('mongoose')

const supervisorsSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        jobtitle: String,
        name: String,
        email: String,
        phoneNumber: String,
        postalAddress: String,
        countryOfResidence: String,
        placeOfWork: String,
        typeOfExaminer: {
            type: String,
            default: 'Supervisor',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('supervisors', supervisorsSchema)
