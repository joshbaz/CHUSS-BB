const mongoose = require('mongoose')
const TagModel = require('../models/Tags')

/** create tag */
exports.createTag = async (req, res, next) => {
    try {
        const { tagName, hex, rgba, fullColor, table } = req.body

        let fullColors = `${fullColor}`

        const newtag = new TagModel({
            _id: new mongoose.Types.ObjectId(),
            tagName,
            table,
            hex,
            rgba,
            fullColor: fullColors,
        })

        await newtag.save()

        res.status(201).json(`tag - ${tagName} created`)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all tags */
exports.getAllTags = async (req, res, next) => {
    try {
        const getTags = await TagModel.find()

        res.status(200).json({ items: getTags })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all tags */
exports.editTag = async (req, res, next) => {
    try {
        const tagId = req.params.tagId
        const { tagName, hex, rgba, fullColor, table } = req.body
        let fullColors = `${fullColor}`
        const getTag = await TagModel.findById(tagId)

        if (!getTag) {
            const error = new Error('tag not found')
            error.statusCode = 404
            throw error
        }

        getTag.tagName = tagName

        getTag.hex = hex
        getTag.rgba = rgba
        getTag.fullColor = fullColors

        await getTag.save()
        res.status(200).json('Tag Updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
