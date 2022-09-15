const mongoose = require('mongoose')

const adminSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        email: { type: String, required: true },
        password: { type: String, required: true },
        firstname: { type: String, required: true },
        lastname: { type: String, required: true },
        authType: {
            type: String,
            default: 'admin',
        },
        contact: { type: String, required: true },
        active: {
            type: Boolean,
            default: false,
            required: true,
        },
        deactivated: [
            {
                when: String,
            },
        ],
    },
    { timestamps: true }
)

module.exports = mongoose.model('administrator', adminSchema)
