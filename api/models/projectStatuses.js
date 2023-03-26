const mongoose = require('mongoose')

const projectStatusSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        tagId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'tags',
        },
        projectId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'projects',
        },
        status: String,
        createdDate: Date,
        color: String,
        hex: {
            type: String,
        },
        rgba: {
            type: String,
        },
        startDate: String,
        expectedEndDate: Date,
        endDate: Date,
        graduationDate: Date,
        active: {
            type: Boolean,
            default: false,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('projectStatuses', projectStatusSchema)
