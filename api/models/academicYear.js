const mongoose = require('mongoose')

const academicYearSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        academicYear: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('academicYears', academicYearSchema)
