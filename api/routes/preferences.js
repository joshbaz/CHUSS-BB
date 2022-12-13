const express = require('express')
const router = express.Router()
const preferenceController = require('../controllers/preferences')
const isAuth = require('../middleware/is-auth')
/** program type */
router.post(
    '/v1/programType/create',
    //isAuth,
    preferenceController.createProgramType
)

router.get(
    '/v1/programType/getall',
    //isAuth,
    preferenceController.getAllProgramTypes
)

router.put(
    '/v1/programType/edit/:typeId',
    //isAuth,
    preferenceController.editProgramType
)

/** academic Year */
router.post(
    '/v1/academicYear/create',
    //isAuth,
    preferenceController.createAcademicYear
)

router.get(
    '/v1/academicYear/getall',
    //isAuth,
    preferenceController.getAllAcademicYears
)

router.put(
    '/v1/academicYear/edit/:yearId',
    //isAuth,
    preferenceController.editAcademicYear
)

module.exports = router
