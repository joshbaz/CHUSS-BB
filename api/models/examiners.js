const mongoose = require('mongoose')

const examinerSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        jobtitle: String,
        name: String,
        email: String,
        phoneNumber: String,
        postalAddress: String,
        countryOfResidence: String,
        placeOfWork: String,
        otherTitles: String,
        typeOfExaminer: String,
        preferredPayment: String,
        paymentInfo: [
            {
                preferredPayment: String,
                mobileOperator: String,
                mobileSubscriberName: String,
                mobileNumber: String,
                bank: String,
                AccountName: String,
                AccountNumber: String,
                swift_bicCode: String,
                bankCode: String,
                branchCode: String,
                bankAddress: String,
                bankCity: String,
            },
        ],
        generalAppointmentLetters: [
            {
                fileId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'projectFiles',
                },
            },
        ],
    },
    { timestamps: true }
)

module.exports = mongoose.model('examiners', examinerSchema)
