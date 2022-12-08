const mongoose = require('mongoose')
const SchoolModel = require('../models/schools')
const io = require('../../socket')
/** create school */
exports.createSchool = async (req, res, next) => {
    try {
        const { schoolName, deanName, deanDesignation, email, officeNumber } =
            req.body

        const newSchool = new SchoolModel({
            _id: new mongoose.Types.ObjectId(),
            schoolName,
            deanName,
            deanDesignation,
            email,
            officeNumber,
        })

        await newSchool.save()

        res.status(200).json('School created Successfully')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update school */
exports.updateSchool = async (req, res, next) => {
    try {
        const { schoolName, deanName, deanDesignation, email, officeNumber } =
            req.body
        const id = req.params.id

        const findSchool = await SchoolModel.findById(id)

        if (!findSchool) {
            const error = new Error('School Not Found')
            error.statusCode = 404
            throw error
        }

        findSchool.schoolName = schoolName
        findSchool.deanName = deanName
        findSchool.deanDesignation = deanDesignation
        findSchool.email = email
        findSchool.officeNumber = officeNumber

        await findSchool.save()

        res.status(200).json('school updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all schools */
exports.getAllSchools = async (req, res, next) => {
    try {
        const overall_total = await SchoolModel.find().countDocuments()
        const findSchools = await SchoolModel.find().populate(
            'departments.departmentId'
        )

        res.status(200).json({
            items: findSchools,
            overall_total,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** paginated schools */
exports.getPaginatedSchools = async (req, res, next) => {
    try {
        const { perPage, page } = req.body

        let currentPage

        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8
      
        let overall_total = await SchoolModel.find().countDocuments()

        let getSchools = await SchoolModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .populate('departments.departmentId')

        let current_total = await SchoolModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .countDocuments()

        res.status(200).json({
            items: getSchools,
            overall_total,
            currentPage,
            perPage: perPages,
            current_total,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** individual schools */
exports.getIndividualSchool = async (req, res, next) => {
    try {
        const id = req.params.id
        const findSchool = await SchoolModel.findById(id).populate(
            'departments.departmentId'
        )

        if (!findSchool) {
            const error = new Error('School Not Found')
            error.statusCode = 404
            throw error
        }

        res.status(200).json(findSchool)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** delete schools */
exports.deleteSchool = async (req, res, next) => {
    try {
        const schoolId = req.params.sid

        const findSchool = await SchoolModel.findById(schoolId)

        if (!findSchool) {
            const error = new Error('School Not Found')
            error.statusCode = 404
            throw error
        }

        if (findSchool.departments.length > 0) {
            const error = new Error('School has departments')
            error.statusCode = 404
            throw error
        } else {
            await SchoolModel.findByIdAndDelete(findSchool._id)
            io.getIO().emit('deleteschool', {
                actions: 'delete-school',
                data: findSchool._id.toString(),
            })

            res.status(200).json(`School has been deleted`)
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
