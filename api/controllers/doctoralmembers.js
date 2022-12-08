const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
const DoctoralMModel = require('../models/doctoralmembers')
const io = require('../../socket')
/** create Supervisor From Project */
exports.createProjectDMember = async (req, res, next) => {
    try {
        const {
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
        } = req.body
        const projectId = req.params.pid
        const findProject = await ProjectModel.findById(projectId)

        if (!findProject) {
            const error = new Error('Project Not Found')
            error.statusCode = 404
            throw error
        }

        /** instance of an supervisor */

        const doctoralmember = new DoctoralMModel({
            _id: new mongoose.Types.ObjectId(),
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
        })

        const savedExaminer = await doctoralmember.save()
        /** initialize examiner to save in project Model */
        let examinerToSave = {
            doctoralmemberId: savedExaminer._id,
        }

        /** save the examiner to the project itself */
        findProject.doctoralmembers = [
            ...findProject.doctoralmembers,
            examinerToSave,
        ]

        await findProject.save()
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })

        res.status(201).json('Committee Member has been successfully assigned')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** assign Examiner From Project */
exports.assignMember = async (req, res, next) => {
    try {
        // const { examinerId } = req.body

        const { items } = req.body
        const projectId = req.params.pid

        /** find if project exists */
        const findProject = await ProjectModel.findById(projectId)

        if (!findProject) {
            const error = new Error('Project Not Found')
            error.statusCode = 404
            throw error
        }

        for (let iteration = 0; iteration < items.length; iteration++) {
            let titerations = iteration + 1

            /** find if the examiner is there */
            const findExaminer = await DoctoralMModel.findById(
                items[iteration]._id
            )

            if (!findExaminer) {
                const error = new Error('Committee Member Not Found')
                error.statusCode = 404
                throw error
            }

            let examinerToSave = {
                doctoralmemberId: findExaminer._id,
            }

            findProject.doctoralmembers = [
                ...findProject.doctoralmembers,
                examinerToSave,
            ]
            await findProject.save()

            if (titerations === items.length) {
                io.getIO().emit('updatestudent', {
                    actions: 'update-student',
                    data: findProject._id.toString(),
                })
                res.status(201).json(
                    `${
                        items.length > 1
                            ? 'Committee members'
                            : 'Committee member'
                    }  has been successfully assigned`
                )
            }
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all doctoral committee members */
exports.getAllMembers = async (req, res, next) => {
    try {
        const findExaminers = await DoctoralMModel.find()
       // console.log(findExaminers, 'finnnnnn')
        res.status(200).json({
            items: findExaminers,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** paginated examiners */
exports.getPaginatedMembers = async (req, res, next) => {
    try {
        const { perPage, page } = req.body

        let currentPage

        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8
       // console.log('perPages', perPages)
        let overall_total = await DoctoralMModel.find().countDocuments()

        let getExaminers = await DoctoralMModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)

        let current_total = await DoctoralMModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .countDocuments()

        let newArray = [...getExaminers]

        res.status(200).json({
            items: newArray,
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

/**
 * get single member
 * this to be removed later
 * */

exports.getIndividualMembers = async (req, res, next) => {
    try {
        const id = req.params.id
        let getExaminer = await DoctoralMModel.findById(id)
       // console.log('examiner', getExaminer)

        if (!getExaminer) {
            const error = new Error('committee member not found')
            error.statusCode = 404
            throw error
        }

        res.status(200).json(getExaminer)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** Main Committee Members */
/** create Committee Members From Committee Members */
exports.createCMembers = async (req, res, next) => {
    try {
        const {
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
        } = req.body

        /** instance of an examiner */

        const doctoralmembers = new DoctoralMModel({
            _id: new mongoose.Types.ObjectId(),
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
        })

        await doctoralmembers.save()

        res.status(201).json('Committee Member has been successfully created')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//update examiner from examiners
exports.updateCMember = async (req, res, next) => {
    try {
        const {
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
        } = req.body

        let examinerId = req.params.id

        const getExaminer = await DoctoralMModel.findById(examinerId)
       // console.log('exam', getExaminer)
        if (!getExaminer) {
            const error = new Error('Committee Member not found')
            error.statusCode = 404
            throw error
        }

        /** instance of an supervisor */

        getExaminer.jobtitle = jobtitle
        getExaminer.name = name
        getExaminer.email = email
        getExaminer.phoneNumber = phoneNumber
        getExaminer.postalAddress = postalAddress
        getExaminer.countryOfResidence = countryOfResidence
        getExaminer.placeOfWork = placeOfWork

      //  console.log('made jump it')
        await getExaminer.save()

        res.status(201).json('Committee Member has been successfully updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}


/** remove Doctoral Member From Project */
exports.removeProjectDCMember = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const dcMemberId = req.params.sid
        const findProject = await ProjectModel.findById(projectId)

        if (!findProject) {
            const error = new Error('Committee Member not found')
            error.statusCode = 404
            throw error
        }

        const findDMember = await DoctoralMModel.findById(dcMemberId)

        if (!findDMember) {
            const error = new Error('Supervisor Not Found')
            error.statusCode = 404
            throw error
        }

        let ProjectDCMember = [...findProject.doctoralmembers]

        let newProjectDCMembers = ProjectDCMember.filter((data) => {
            if (
                findDMember._id.toString() !== data.doctoralmemberId.toString()
            ) {
                return data
            } else {
              //  console.log('nfound one')
                return
            }
        })

        // console.log(newProjectSupervisors, 'new coll')
        // console.log(ProjectSupervisors, 'orig coll', findSupervisor._id)

        findProject.doctoralmembers = newProjectDCMembers

        await findProject.save()
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
        res.status(201).json('Committee Member has been successfully removed')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
