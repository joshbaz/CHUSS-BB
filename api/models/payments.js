const mongoose = require('mongoose')
const paymentSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        payCode: {
            type: String,
            required: true,
            default: 'N/A',
        },
        payStatus: {
            type: String,
            required: true,
            default: 'pending',
        },
        proposedFee: {
            type: Number,
            required: true,
        },
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'students',
            required: true,
        },
        examiner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'examiners',
           
        },
        opponent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'opponents',
           
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projects',
            required: true,
        },
        report: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'examinerReports',
           
        },
        opponentReport: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'opponentReports',
           
        },
        reciept: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projectFiles',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('payments', paymentSchema)
