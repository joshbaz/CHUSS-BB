const mongoose = require('mongoose')

const projectSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        topic: {
            type: String,
            required: true,
        },
        supervisors: [
            {
                name: String,
            },
        ],
        projectStatus: [
            {
                status: String,
                notes: String,
                current: Boolean,
                createdAt: Date,
                updatedAt: Date,
            },
        ],
        files: [
            {
                fileId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'projectFiles',
                },
            },
        ],
        student: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'students',
        },
        proposedFee: Number,
        examiners: [
            {
                examinerId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'examiners',
                },
                projectAppointmentLetter: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'projectFiles',
                },
                preferredPayment: String,
            },
        ],

        examinerReports: [
            {
                reportId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'examinerReports',
                },
            },
        ],
    },
    { timestamps: true }
)

module.exports = mongoose.model('projects', projectSchema)
