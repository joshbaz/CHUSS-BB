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

/** create supervisors */
router.post('/v1/create', supervisorController.createSupervisor)

/** get paginated supervisors */
router.get('/v1/psupervisors', supervisorController.getPaginatedSupervisors)

/** update supervisors */
router.patch('/v1/update/:id', supervisorController.updateSupervisor)

/** remove supervisors from project */
router.patch(
    '/v1/project/remove/:pid/:sid',
    supervisorController.removeProjectSupervisor
)

module.exports = router
