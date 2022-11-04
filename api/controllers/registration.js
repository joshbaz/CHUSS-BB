const mongoose = require('mongoose')
const RegistrationModel = require('../models/registration')
const ProjectModel = require('../models/projects')

{/** Add registration */}
exports.addRegistration = async (req, res, next) => {
    try {

        const projectId = req.params.pid;
        const findProject = await ProjectModel.findById(projectId)
         if (!findProject) {
             const error = new Error('Project not found!')
             error.statusCode = 404
             throw error
         }

         

    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

{/** remove registration */}
exports.removeRegistration = async (req, res, next)=>{
    try {
        
    } catch (error) {
         if (!error.statusCode) {
             error.statusCode = 500
         }
         next(error)
    }
}
{/** get all registration */}
exports.getAllRegistration = async (req, res, next)=>{
    try {
        
    } catch (error) {
         if (!error.statusCode) {
             error.statusCode = 500
         }
         next(error)
    }
}

{
    /** get single registration */
}
exports.getSingleRegistration = async (req, res, next) => {
    try {
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

{
    /** update registration */
}
exports.updateRegistration = async (req, res, next) => {
    try {
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
