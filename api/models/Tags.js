const mongoose = require('mongoose')

const TagsSchema = mongoose.Schema(
    {
        _id: mongoose.Schema.Types.ObjectId,
        tagName: {
            type: String,
            required: true,
        },
        table: {
            type: String,
            required: true,
        },
        hex: {
            type: String,
            required: true,
        },
        rgba: {
            type: String,
            required: true,
        },
        fullColor: {
            type: String,
            required: true,
        },
    },
    { timestamps: true }
)

module.exports = mongoose.model('tags', TagsSchema)
