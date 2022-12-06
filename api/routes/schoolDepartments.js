const express = require('express')
const router = express.Router()

const departmentController = require('../controllers/schoolsDepartments')

router.post('/v1/create/:id', departmentController.createDepartment)

/** update school */
router.put('/v1/update/:id', departmentController.updateDepartment)

router.delete('/v1/delete/:sid/:id', departmentController.deleteDepartment)

module.exports = router
