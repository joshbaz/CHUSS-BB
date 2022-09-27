const express = require('express')
const router = express.Router()
const preferenceController = require('../controllers/preferences')
/** program type */
router.post('/v1/programType/create', preferenceController.createProgramType)

router.get('/v1/programType/getall', preferenceController.getAllProgramTypes)

router.put('/v1/programType/edit/:typeId', preferenceController.editProgramType)

/** academic Year */
router.post('/v1/academicYear/create', preferenceController.createAcademicYear)

router.get('/v1/academicYear/getall', preferenceController.getAllAcademicYears)

router.put(
    '/v1/academicYear/edit/:yearId',
    preferenceController.editAcademicYear
)

module.exports = router
