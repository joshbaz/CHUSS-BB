const express = require('express')
const router = express.Router()
const isAuth = require('../middleware/is-auth')

const departmentController = require('../controllers/schoolsDepartments')

router.post('/v1/create/:id', 
//isAuth, 
departmentController.createDepartment)

/** update school */
router.put('/v1/update/:id', 
//isAuth, 
departmentController.updateDepartment)

router.delete(
    '/v1/delete/:sid/:id',
    //isAuth,
    departmentController.deleteDepartment
)

module.exports = router
