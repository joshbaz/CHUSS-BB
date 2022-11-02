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
            required: true,
        },
        opponent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'opponents',
            required: true,
        },
        project: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projects',
            required: true,
        },
        report: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'examinerReports',
            required: true,
        },
        opponentReport: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'opponentReports',
            required: true,
        },
        reciept: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projectFiles',
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('payments', paymentSchema)
