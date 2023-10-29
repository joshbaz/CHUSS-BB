const jwt = require('jsonwebtoken')
require('dotenv').config()
const AdminModel = require('../models/administrator')

module.exports = (req, res, next) => {
    const authHeader = req.get('Authorization')
    let { TokenExpiredError } = jwt
    //console.log(authHeader, 'header')
    if (!authHeader) {
        const error = new Error('Not authenticated')
        error.statusCode = 401
        throw error
    }

    const token = authHeader.split(' ')[1]
    let decodedToken

    try {
        jwt.verify(token, process.env.SECRET, (err, decoded) => {
            if (err) {
                console.log('tokenerr', err)
                const errors = new Error('invalid token')
                errors.statusCode = 401
                throw errors
            } else {
                decodedToken = decoded
            }
        })
    } catch (err) {
        console.log('results', err)
        err.statusCode = 500
        throw err
    }

    if (!decodedToken) {
        const error = new Error('Not authenticated')
        error.statusCode = 401
        throw error
    }
    req.userId = decodedToken.userId

    const runCheck = async () => {
        try {
            const findAdmin = await AdminModel.findById(decodedToken.userId)
            if (!findAdmin) {
                const error = new Error('Not authorized')
                error.statusCode = 403
                throw error
            } else {
                next()
            }
        } catch (error) {
            if (!error.statusCode) {
                error.statusCode = 500
            }
            next(error)
        }
    }

    runCheck()
    //next()
}

//check this
//connect ECONNREFUSED
