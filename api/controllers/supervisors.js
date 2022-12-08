const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
const SupervisorModel = require('../models/supervisors')
const io = require('../../socket')
/** create Supervisor From Project */
exports.createProjectSupervisor = async (req, res, next) => {
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

        const supervisor = new SupervisorModel({
            _id: new mongoose.Types.ObjectId(),
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
        })

        const savedExaminer = await supervisor.save()
        /** initialize examiner to save in project Model */
        let examinerToSave = {
            supervisorId: savedExaminer._id,
        }

        /** save the examiner to the project itself */
        findProject.supervisor = [...findProject.supervisor, examinerToSave]

        await findProject.save()
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
        res.status(201).json('Supervisor has been successfully assigned')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** assign Examiner From Project */
exports.assignSupervisor = async (req, res, next) => {
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
            const findExaminer = await SupervisorModel.findById(
                items[iteration]._id
            )

            if (!findExaminer) {
                const error = new Error('Supervisor Not Found')
                error.statusCode = 404
                throw error
            }

            let examinerToSave = {
                supervisorId: findExaminer._id,
            }

            findProject.supervisor = [...findProject.supervisor, examinerToSave]
            await findProject.save()

            if (titerations === items.length) {
                io.getIO().emit('updatestudent', {
                    actions: 'update-student',
                    data: findProject._id.toString(),
                })
                res.status(201).json(
                    `${
                        items.length > 1 ? 'Supervisors' : 'Supervisor'
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

/** get all examiners */
exports.getAllSupervisors = async (req, res, next) => {
    try {
        const findExaminers = await SupervisorModel.find()
       
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
exports.getPaginatedSupervisors = async (req, res, next) => {
    try {
        const { perPage, page } = req.body

        let currentPage

        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8
       
        let overall_total = await SupervisorModel.find().countDocuments()

        let getExaminers = await SupervisorModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)

        let current_total = await SupervisorModel.find()
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
 * get single examiner
 * this to be removed later
 * */

exports.getIndividualSupervisor = async (req, res, next) => {
    try {
        const id = req.params.id
        let getExaminer = await SupervisorModel.findById(id)


        if (!getExaminer) {
            const error = new Error('supervisor not found')
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

/** Main Supervisor */
/** create Supervisor From Supervisors */
exports.createSupervisor = async (req, res, next) => {
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

        const supervisor = new SupervisorModel({
            _id: new mongoose.Types.ObjectId(),
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
        })

        await supervisor.save()

        res.status(201).json('Supervisor has been successfully created')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//update examiner from examiners
exports.updateSupervisor = async (req, res, next) => {
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

        const getExaminer = await SupervisorModel.findById(examinerId)
       
        if (!getExaminer) {
            const error = new Error('Supervisor not found')
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

       
        await getExaminer.save()

        res.status(201).json('Supervisor has been successfully updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** remove Supervisor From Project */
exports.removeProjectSupervisor = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const supervisorId = req.params.sid
        const findProject = await ProjectModel.findById(projectId)

        if (!findProject) {
            const error = new Error('Project Not Found')
            error.statusCode = 404
            throw error
        }

        const findSupervisor = await SupervisorModel.findById(supervisorId)

        if (!findSupervisor) {
            const error = new Error('Supervisor Not Found')
            error.statusCode = 404
            throw error
        }

        let ProjectSupervisors = [...findProject.supervisor]

        let newProjectSupervisors = ProjectSupervisors.filter((data) => {
            if (
                findSupervisor._id.toString() !== data.supervisorId.toString()
            ) {
                return data
            } else {
               
                return
            }
        })

        // console.log(newProjectSupervisors, 'new coll')
        // console.log(ProjectSupervisors, 'orig coll', findSupervisor._id)

        findProject.supervisor = newProjectSupervisors

        await findProject.save()
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
        res.status(201).json('Supervisor has been successfully removed')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
