const express = require('express')
const router = express.Router()
const { body } = require('express-validator')
const AdminModel = require('../models/administrator')

const adminController = require('../controllers/administrator')
const isAuth = require('../middleware/is-auth')

router.post(
    '/v1/create',
    isAuth,
    [
        body('email')
            .isEmail()
            .withMessage('Please insert a valid Email')
            .custom((value, { req }) => {
                return AdminModel.findOne({ email: value }).then((emails) => {
                    if (emails) {
                        return Promise.reject('Email already exists!!')
                    }
                })
            })
            .normalizeEmail(),
        body('password')
            .trim()
            .isLength({ min: 6 })
            .withMessage('Please insert a valid Password'),
    ],
    adminController.createAdmin
)

router.post('/v1/login', adminController.loginUser)

module.exports = router
