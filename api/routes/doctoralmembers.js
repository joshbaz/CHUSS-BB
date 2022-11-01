const express = require('express')
const router = express.Router()
const doctoralController = require('../controllers/doctoralmembers')

router.post('/v1/project/create/:pid', doctoralController.createProjectDMember)

router.post('/v1/project/assign/:pid', doctoralController.assignMember)

/** get all supervisors */
router.get('/v1/getall', doctoralController.getAllMembers)

/** get individual supervisors */
router.get('/v1/individual/:id', doctoralController.getIndividualMembers)

/** create examiners */
router.post(
    '/v1/create',

    doctoralController.createCMembers
)

/** get paginated examiners */
router.get('/v1/psupervisors', doctoralController.getPaginatedMembers)

/** update examiners */
router.patch('/v1/update/:id', doctoralController.updateCMember)

module.exports = router
