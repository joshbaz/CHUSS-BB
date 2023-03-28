const mongoose = require('mongoose')

const LoginActivitySchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        userType: { type: String },
        adminId: {
            type: mongoose.Schema.Types.ObjectId,
            ref: 'administrator',
        },
        loginDate: { type: Date, required: true },
    },
    { timestamps: true }
)

module.exports = mongoose.model('LoginActivities', LoginActivitySchema)
