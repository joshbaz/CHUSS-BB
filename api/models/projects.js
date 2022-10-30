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
                completed: {
                    type: Boolean,
                    default: false,
                },
                active: {
                    type: Boolean,
                    default: false,
                },
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

        opponents: [
            {
                opponentId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'opponents',
                },
                projectAppointmentLetter: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'projectFiles',
                },
                generalAppointmentLetter: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'projectFiles',
                },
                prefferedPayment: String,
            },
        ],

        vivaFiles: [
            {
                fileId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'projectFiles',
                },
            },
        ],

        DateOfDefense: {
            type: Date,
        },
        FinalSubmissionFiles: [
            {
                fileId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'projectFiles',
                },
            },
        ],
        FinalSubmissionDate: {
            type: String,
        },
        GraduationDate: {
            type: String,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('projects', projectSchema)
