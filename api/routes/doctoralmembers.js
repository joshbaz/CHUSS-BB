const express = require('express')
const router = express.Router()
const doctoralController = require('../controllers/doctoralmembers')
const isAuth = require('../middleware/is-auth')

router.post(
    '/v1/project/create/:pid',
    isAuth,
    doctoralController.createProjectDMember
)

router.post('/v1/project/assign/:pid', 
isAuth, 
doctoralController.assignMember)

/** get all supervisors */
router.get('/v1/getall', 
isAuth, 
doctoralController.getAllMembers)

/** get individual supervisors */
router.get(
    '/v1/individual/:id',
    isAuth,
    doctoralController.getIndividualMembers
)

/** create examiners */
router.post('/v1/create', 
isAuth, 
doctoralController.createCMembers)

/** get paginated examiners */
router.get('/v1/pdcmembers/:perPage/:page', 
isAuth, 
doctoralController.getPaginatedMembers)

/** update examiners */
router.patch('/v1/update/:id', 
isAuth, 
doctoralController.updateCMember)

/** remove supervisors from project */
router.patch(
    '/v1/project/remove/:pid/:sid',
    isAuth,
    doctoralController.removeProjectDCMember
)

module.exports = router
