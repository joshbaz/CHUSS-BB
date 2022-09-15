const AdminModel = require('../models/administrator')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')

require('dotenv').config()
/**
 *
 * try {
 * }
 * catch (error) {
 * if (!error.statusCode)
 * {  error.statusCode = 500 }
 * next(error)
 * }
 *
 */

/** creation of new administrator */

exports.createAdmin = async (req, res, next) => {
    try {
        const errors = validationResult(req)

        if (!errors.isEmpty()) {
            console.log(errors.errors[0].msg)
            const error = new Error('Validation failed')
            error.statusCode = 422
            error.message = errors.errors[0].msg
            throw error
        }
        const {
            email,
            password,
            firstname,
            lastname,
            authType,
            contact,
            active,
        } = req.body

        const hash = await bcrypt.hash(password, 12)
        const adminUser = new AdminModel({
            _id: new mongoose.Types.ObjectId(),
            email,
            password: hash,
            firstname,
            lastname,
            authType,
            contact,
            active,
        })

        await adminUser.save()

        res.status(201).json(`administrator with email ${email} registered`)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

exports.loginUser = async (req, res, next) => {
    try {
        const { email, password } = req.body
        console.log('email', email)
        //find user
        const findOneUser = await AdminModel.findOne({ email: email })

        if (!findOneUser) {
            const error = new Error('Email does not exist')
            error.statusCode = 404
            throw error
        }

        //compare password
        const comparePassword = await bcrypt.compare(
            password,
            findOneUser.password
        )

        if (!comparePassword) {
            const error = new Error('Wrong Password')
            error.statusCode = 401
            throw error
        }

        const token = jwt.sign(
            {
                email: findOneUser.email,
                userId: findOneUser._id,
            },
            process.env.SECRET,
            { expiresIn: '24h' }
        )

        res.status(200).json({
            token: token,
            id: findOneUser._id.toString(),
            email: findOneUser.email,
            firstname: findOneUser.firstname,
            lastname: findOneUser.lastname,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
