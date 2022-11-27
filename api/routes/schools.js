const express = require('express')
const router = express.Router()

const schoolController = require('../controllers/schools')

router.post('/v1/create', schoolController.createSchool)

/** update school */
router.put('/v1/update/:id', schoolController.updateSchool)

/** all schools */
router.get('/v1/allschools', schoolController.getAllSchools)

/** get paginated schools */
router.get('/v1/pschools', schoolController.getPaginatedSchools)

/** get individual schools */
router.get('/v1/individual/:id', schoolController.getIndividualSchool)
module.exports = router
