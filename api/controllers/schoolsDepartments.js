const mongoose = require('mongoose')
const DepartmentModel = require('../models/departments')
const SchoolModel = require('../models/schools')
const Moments = require('moment-timezone')
const io = require('../../socket')

/** create school */
exports.createDepartment = async (req, res, next) => {
    try {
        const { deptName, deptHead, email, officeNumber } = req.body
        const schoolId = req.params.id
        const creationDate = Moments().tz('Africa/Kampala').format()
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
                    creationDate: creationDate,
                })

                const saveDepartment = await newDepartment.save()

                findSchool.departments = [
                    ...findSchool.departments,
                    { departmentId: saveDepartment._id },
                ]

                await findSchool.save()
                io.getIO().emit('updatedepartment', {
                    actions: 'update-department',
                    data: findSchool._id.toString(),
                })

                res.status(200).json('department added')
            }
        } else {
            const newDepartment = new DepartmentModel({
                _id: new mongoose.Types.ObjectId(),
                deptName,
                deptHead,
                email,
                officeNumber,
                creationDate: creationDate,
            })

            const saveDepartment = await newDepartment.save()

            findSchool.departments = [
                ...findSchool.departments,
                { departmentId: saveDepartment._id },
            ]

            await findSchool.save()
            io.getIO().emit('updatedepartment', {
                actions: 'update-department',
                data: findSchool._id.toString(),
            })
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
        io.getIO().emit('updatedepartment', {
            actions: 'update-department',
        })
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
        const deptId = req.params.id
        const schoolId = req.params.sid

        const findSchool = await SchoolModel.findById(schoolId)

        if (!findSchool) {
            const error = new Error('School Not Found')
            error.statusCode = 404
            throw error
        }

        const findDepartment = await DepartmentModel.findById(deptId)

        if (!findDepartment) {
            const error = new Error('Department Not Found')
            error.statusCode = 404
            throw error
        }

        let allDepts = [...findSchool.departments]

        let newDepts = allDepts.filter((data) => {
            if (
                data.departmentId.toString() === findDepartment._id.toString()
            ) {
                return
            } else {
                return data
            }
        })

        findSchool.departments = newDepts
        await findSchool.save()

        await DepartmentModel.findByIdAndDelete(findDepartment._id)
        io.getIO().emit('deletedepartment', {
            actions: 'delete-department',
            data: findSchool._id.toString(),
        })

        res.status(200).json(`Department has been deleted`)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
