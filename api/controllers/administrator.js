const AdminModel = require('../models/administrator')
const mongoose = require('mongoose')
const bcrypt = require('bcryptjs')
const { validationResult } = require('express-validator')
const jwt = require('jsonwebtoken')
const LoginActivityModel = require('../models/LoginActivity')
const Moments = require('moment-timezone')
const io = require('../../socket')

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
            privileges,
            role,
            jobtitle,
        } = req.body

        const createdDate = Moments(new Date()).tz('Africa/Kampala')
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
            privileges,
            role,
            createdDate,
            jobtitle,
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
        const { email, password, staySigned } = req.body

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
            staySigned === false ? { expiresIn: '24h' } : null
        )

        const createdDate = Moments(new Date()).tz('Africa/Kampala')

        const newActivity = new LoginActivityModel({
            _id: new mongoose.Types.ObjectId(),
            userType: 'Administrator',
            adminId: findOneUser._id,
            loginDate: createdDate,
        })

        await newActivity.save()

        io.getIO().emit('loginactivity', {
            actions: 'update-activity',
        })
        res.status(200).json({
            token: token,
            id: findOneUser._id.toString(),
            email: findOneUser.email,
            firstname: findOneUser.firstname,
            lastname: findOneUser.lastname,
            privileges: findOneUser.privileges,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//get all Login activities
exports.getActivities = async (req, res, next) => {
    try {
        const findOneUser = await AdminModel.findOne({
            $and: [{ _id: req.userId }, { privileges: 'Super Administrator' }],
        })

        if (!findOneUser) {
            const error = new Error('Forbidden to Access Data')
            error.statusCode = 404
            throw error
        }

        const findAllActivities = await LoginActivityModel.find().populate(
            'adminId'
        )
        res.status(200).json({
            items: findAllActivities,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//get all faciliators
exports.getAllFacilitators = async (req, res, next) => {
    try {
        const findOneUser = await AdminModel.findOne({
            $and: [{ _id: req.userId }, { privileges: 'Super Administrator' }],
        })

        if (!findOneUser) {
            const error = new Error('Forbidden to Access Data')
            error.statusCode = 404
            throw error
        }
        console.log('heresss')
        const findAllAdmins = await AdminModel.find({
            _id: { $ne: req.userId },
        })

        console.log('heresss')

        res.status(200).json({
            items: findAllAdmins,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//update faciliator

exports.updateAdmin = async (req, res, next) => {
    try {
        const findOneUser = await AdminModel.findOne({
            $and: [{ _id: req.userId }, { privileges: 'Super Administrator' }],
        })

        if (!findOneUser) {
            const error = new Error('Forbidden to Access Data')
            error.statusCode = 404
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
            privileges,
            role,
            jobtitle,
        } = req.body

        const userId = req.params.id

        const findAdmin = await AdminModel.findById(userId)

        if (!findAdmin) {
            const error = new Error('administrator cannot be found')
            error.statusCode = 404
            throw error
        }

        const hash = await bcrypt.hash(password, 12)

        findAdmin.jobtitle = jobtitle
        findAdmin.email = email
        findAdmin.firstname = firstname

        findAdmin.lastname = lastname

        findAdmin.contact = contact

        findAdmin.active = active

        findAdmin.privileges = privileges

        findAdmin.role = role

        await findAdmin.save()

        io.getIO().emit('updatedAdmin', {
            actions: 'update-admin',
            data: findAdmin._id,
        })
        res.status(201).json(`administrator with email ${email} updated`)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

exports.resetPassword = async (req, res, next) => {
    try {
        const findOneUser = await AdminModel.findOne({
            $and: [{ _id: req.userId }, { privileges: 'Super Administrator' }],
        })

        if (!findOneUser) {
            const error = new Error('Forbidden to Access Data')
            error.statusCode = 404
            throw error
        }

        const userId = req.params.id

        const findAdmin = await AdminModel.findById(userId)

        if (!findAdmin) {
            const error = new Error('administrator cannot be found')
            error.statusCode = 404
            throw error
        }

        findAdmin.oneTimePassword = 'creates'
        findAdmin.passwordExpiration = Moments(Date.now() + 3600000).tz(
            'Africa/Kampala'
        )

        await findAdmin.save()
        io.getIO().emit('updatedAdmin', {
            actions: 'update-admin',
            data: findAdmin._id,
        })
        res.status(200).json('password reset')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

exports.newfacilitatorPassword = async (req, res, next) => {
    try {
        const { email, password } = req.body

        const findAdmin = await AdminModel.findOne({
            email: email,
            passwordExpiration: { $gt: Moments().tz('Africa/Kampala') },
        })

        if (!findAdmin) {
            const error = new Error('Password Expired/ no User matched')
            error.statusCode = 403
            throw error
        }

        const hash = await bcrypt.hash(password, 12)

        findAdmin.password = hash
        findAdmin.oneTimePassword = undefined
        findAdmin.passwordExpiration = undefined

        await findAdmin.save()
        io.getIO().emit('updatedAdmin', {
            actions: 'update-admin',
            data: findAdmin._id,
        })
        res.status(200).json('password successfully changed')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
