const mongoose = require('mongoose')

const systemSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        smsActive: { type: Boolean, default: false },
        emailActive: { type: Boolean, default: false },
    },
    { timestamps: true }
)

module.exports = mongoose.model('systemPreferences', systemSchema)