const express = require('express')
const router = express.Router()
const isAuth = require('../middleware/is-auth')

const schoolController = require('../controllers/schools')

router.post('/v1/create', isAuth, schoolController.createSchool)

/** update school */
router.patch('/v1/update/:id', isAuth, schoolController.updateSchool)

/** all schools */
router.get('/v1/allschools', isAuth, schoolController.getAllSchools)

/** get paginated schools */
router.get('/v1/pschools', isAuth, schoolController.getPaginatedSchools)

/** get individual schools */
router.get('/v1/individual/:id', isAuth, schoolController.getIndividualSchool)

router.delete('/v1/delete/:sid', isAuth, schoolController.deleteSchool)
module.exports = router
