const express = require('express')
const router = express.Router()
const tagController = require('../controllers/tags')
const isAuth = require('../middleware/is-auth')
router.post('/v1/create', 
//isAuth, 
tagController.createTag)

router.get('/v1/getall', 
//isAuth, 
tagController.getAllTags)

router.put('/v1/edit/:tagId', 
//isAuth, 
tagController.editTag)

module.exports = router
