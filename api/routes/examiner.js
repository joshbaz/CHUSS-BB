const express = require('express')
const router = express.Router()
const examinerController = require('../controllers/examiner')

router.post('/v1/project/create/:pid', examinerController.createProjectExaminer)

router.post('/v1/project/assign/:pid', examinerController.assignExaminer)

/** get all examiners */
router.get('/v1/getall', examinerController.getAllExaminers)

/** get paginated examiners */
router.get('/v1/pexaminers', examinerController.getPaginatedExaminers)

/** get individual examiners */
router.get('/v1/individual/:id', examinerController.getIndividualExaminer)
module.exports = router
