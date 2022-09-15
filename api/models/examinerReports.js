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
        score: Number,
        remarks: String,
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

module.exports = mongoose.model('examinerReports', examinerReportSchema)
