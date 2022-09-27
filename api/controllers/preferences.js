const mongoose = require('mongoose')
const ProgramTypeModel = require('../models/programType')
const AcademicYearModel = require('../models/academicYear')

/** graduate Program Types */
/** create Program Types */
exports.createProgramType = async (req, res, next) => {
    try {
        const { programName, programFee } = req.body

        const newprogramType = new ProgramTypeModel({
            _id: new mongoose.Types.ObjectId(),
            programName,
            programFee: programFee,
        })

        await newprogramType.save()

        res.status(201).json(`program - ${programName} created`)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all Program Types */
exports.getAllProgramTypes = async (req, res, next) => {
    try {
        const getProgramTypes = await ProgramTypeModel.find()

        res.status(200).json({ items: getProgramTypes })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update Program Types */
exports.editProgramType = async (req, res, next) => {
    try {
        const typeId = req.params.typeId
        const { programName, programFee } = req.body

        const getProgramType = await ProgramTypeModel.findById(typeId)

        if (!getProgramType) {
            const error = new Error('ProgramType not found')
            error.statusCode = 404
            throw error
        }

        getProgramType.programName = programName

        getProgramType.programFee = programFee

        await getProgramType.save()
        res.status(200).json('Program Updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** Academic Year */
/** create AcademicYear */
exports.createAcademicYear = async (req, res, next) => {
    try {
        const { academicYear } = req.body

        const newAcademicYear = new AcademicYearModel({
            _id: new mongoose.Types.ObjectId(),
            academicYear,
        })

        await newAcademicYear.save()

        res.status(201).json(`Academic year - ${academicYear} created`)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all AcademicYear */
exports.getAllAcademicYears = async (req, res, next) => {
    try {
        const getAcademicYears = await AcademicYearModel.find()

        res.status(200).json({ items: getAcademicYears })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update AcademicYear */
exports.editAcademicYear = async (req, res, next) => {
    try {
        const yearId = req.params.yearId
        const { academicYear } = req.body
        const getAcademicYear = await AcademicYearModel.findById(yearId)

        if (!getAcademicYear) {
            const error = new Error('Academic year not found')
            error.statusCode = 404
            throw error
        }

        getAcademicYear.academicYear = academicYear 

      

        await getAcademicYear.save()
        res.status(200).json('Academic Year Updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
