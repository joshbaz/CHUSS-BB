const mongoose = require('mongoose')

const opponentReportSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projects',
        },
        opponent: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'opponents',
        },
        score: { type: Number, required: true },
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'payments',
        },
        remarks: String,
        ungraded: { type: Boolean },
        reportStatus: String,
        marked: { type: Boolean, default: false },
        reportFiles: [
            {
                files: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'reportFiles',
                },
            },
        ],
    },
    {
        timestamp: true,
    }
)

module.exports = mongoose.model('opponentReports', opponentReportSchema)
