const mongoose = require('mongoose')

const projectSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        topic: {
            type: String,
        },
        activeStatus: {
            type: String,
        },
        submissionStatus: {
            type: String,
            default: 'normal',
        },

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
        supervisor: [
            {
                supervisorId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'supervisors',
                },
            },
        ],
        registration: [
            {
                registrationId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'registrations',
                },
            },
        ],
        doctoralmembers: [
            {
                doctoralmemberId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'doctoralmembers',
                },
            },
        ],

        examiners: [
            {
                submissionType: {
                    type: String,
                    default: 'normal',
                },
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
                submissionType: {
                    type: String,
                    default: 'normal',
                },
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

        opponentReports: [
            {
                reportId: {
                    type: mongoose.Schema.Types.ObjectId,
                    ref: 'opponentReports',
                },
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
