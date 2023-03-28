const mongoose = require('mongoose')

const adminSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        jobtitle: String,
        email: { type: String, required: true },
        password: { type: String, required: true },
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        privileges: { type: String },
        role: {
            type: String,
            default: 'admin',
        },
        createdDate: { type: Date },
        contact: { type: String, required: true },
        active: {
            type: Boolean,
            default: false,
            required: true,
        },
        deactivated: [
            {
                type: String,
            },
        ],
        status: {
            type: String,
            default: 'offline',
        },

        oneTimePassword: String,
        passwordExpiration: Date,
    },
    { timestamps: true }
)

module.exports = mongoose.model('administrator', adminSchema)
