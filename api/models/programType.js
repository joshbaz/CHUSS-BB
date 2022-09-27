const mongoose = require('mongoose')

const programTypeSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        programName: {
            type: String,
            required: true,
        },
        programFee: {
            type: Number,
            required: true,
            default: 0,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('programTypes', programTypeSchema)
