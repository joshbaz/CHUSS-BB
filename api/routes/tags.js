const express = require('express')
const router = express.Router()
const tagController = require('../controllers/tags')
router.post('/v1/create', tagController.createTag)

router.get('/v1/getall', tagController.getAllTags)

router.put('/v1/edit/:tagId', tagController.editTag)

module.exports = router