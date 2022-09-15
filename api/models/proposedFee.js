const mongoose = require('mongoose')

const proposedFeeSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        ProjectType: {
            type: String,
            required: true,
        },
        proposedFee: {
            type: Number,
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('proposedFees', proposedFeeSchema)
