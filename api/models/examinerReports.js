const mongoose = require('mongoose')

const examinerReportSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projects',
        },
        examiner: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'examiners',
        },
        score: { type: Number, required: true },
        payment: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'payments',
        },
        remarks: {
            type: String,
            default: '',
        },
        ungraded: { type: String, default: 'false' },
        reportStatus: String,
        marked: { type: Boolean, default: false },
        creationDate: {
            type: String,
        },
        submissionDate: {
            type: String,
        },
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

module.exports = mongoose.model('examinerReports', examinerReportSchema)
