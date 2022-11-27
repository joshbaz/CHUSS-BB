const mongoose = require('mongoose')
const DepartmentModel = require('../models/departments')
const SchoolModel = require('../models/schools')

/** create school */
exports.createDepartment = async (req, res, next) => {
    try {
        const { deptName, deptHead, email, officeNumber } = req.body
        const schoolId = req.params.id
        //find the school
        const findSchool = await SchoolModel.findById(schoolId).populate(
            'departments.departmentId'
        )

        if (!findSchool) {
            const error = new Error('School Not Found')
            error.statusCode = 404
            throw error
        }

        if (findSchool.departments.length > 0) {
            let checkDepartment = findSchool.departments.some(
                (data) =>
                    data.departmentId.deptName.toLowerCase() ===
                    deptName.toLowerCase()
            )

            if (checkDepartment) {
                const error = new Error(
                    `Department- ${deptName.toLowerCase()} already exists`
                )
                error.statusCode = 404
                throw error
            } else {
                const newDepartment = new DepartmentModel({
                    _id: new mongoose.Types.ObjectId(),
                    deptName,
                    deptHead,
                    email,
                    officeNumber,
                })

                const saveDepartment = await newDepartment.save()

                findSchool.departments = [
                    ...findSchool.departments,
                    { departmentId: saveDepartment._id },
                ]

                await findSchool.save()

                res.status(200).json('department added')
            }
        } else {
            const newDepartment = new DepartmentModel({
                _id: new mongoose.Types.ObjectId(),
                deptName,
                deptHead,
                email,
                officeNumber,
            })

            const saveDepartment = await newDepartment.save()

            findSchool.departments = [
                ...findSchool.departments,
                { departmentId: saveDepartment._id },
            ]

            await findSchool.save()

            res.status(200).json('department added')
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update school */
exports.updateDepartment = async (req, res, next) => {
    try {
        const { deptName, deptHead, email, officeNumber } = req.body
        const deptId = req.params.id

        const findDepartment = await DepartmentModel.findById(deptId)

        if (!findDepartment) {
            const error = new Error('Department Not Found')
            error.statusCode = 404
            throw error
        }

        findDepartment.deptName = deptName
        findDepartment.deptHead = deptHead
        findDepartment.email = email
        findDepartment.officeNumber = officeNumber

        await findDepartment.save()

        res.status(200).json('department updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all school departments */
exports.getAllDepartments = async (req, res, next) => {
    try {

    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** paginated schools */
exports.getPaginatedDepartments = async (req, res, next) => {
    try {
        
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** individual schools */
exports.getIndividualDepartment = async (req, res, next) => {
    try {
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** delete schools */
exports.deleteDepartment = async (req, res, next) => {
    try {
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
