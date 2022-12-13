const express = require('express')
const router = express.Router()
const supervisorController = require('../controllers/supervisors')
const isAuth = require('../middleware/is-auth')
router.post(
    '/v1/project/create/:pid',
    isAuth,
    supervisorController.createProjectSupervisor
)

router.post(
    '/v1/project/assign/:pid',
   // isAuth,
    supervisorController.assignSupervisor
)

/** get all supervisors */
router.get('/v1/getall', 
//isAuth,
 supervisorController.getAllSupervisors)

/** get individual supervisors */
router.get(
    '/v1/individual/:id',
    //isAuth,
    supervisorController.getIndividualSupervisor
)

/** create supervisors */
router.post('/v1/create', 
//isAuth, 
supervisorController.createSupervisor)

/** get paginated supervisors */
router.get(
    '/v1/psupervisors',
    //isAuth,
    supervisorController.getPaginatedSupervisors
)

/** update supervisors */
router.patch('/v1/update/:id', 
//isAuth, 
supervisorController.updateSupervisor)

/** remove supervisors from project */
router.patch(
    '/v1/project/remove/:pid/:sid',
    //isAuth,
    supervisorController.removeProjectSupervisor
)

module.exports = router
