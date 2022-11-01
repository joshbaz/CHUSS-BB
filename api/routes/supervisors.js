const express = require('express')
const router = express.Router()
const supervisorController = require('../controllers/supervisors')

router.post(
    '/v1/project/create/:pid',
    supervisorController.createProjectSupervisor
)

router.post('/v1/project/assign/:pid', supervisorController.assignSupervisor)

/** get all supervisors */
router.get('/v1/getall', supervisorController.getAllSupervisors)

/** get individual supervisors */
router.get('/v1/individual/:id', supervisorController.getIndividualSupervisor)

/** create examiners */
router.post(
    '/v1/create',

    supervisorController.createSupervisor
)

/** get paginated examiners */
router.get('/v1/psupervisors', supervisorController.getPaginatedSupervisors)

/** update examiners */
router.patch('/v1/update/:id', supervisorController.updateSupervisor)




module.exports = router
