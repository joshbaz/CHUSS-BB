const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
const StudentModel = require('../models/students')
const ProjectFileModel = require('../models/projectFiles')
require('../models/examiners')
require('../models/examinerReports')

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
/** creation of  project*/

exports.createProject = async (req, res, next) => {
    try {
        const {
            registrationNumber,
            studentName,
            programType,
            degreeProgram,
            schoolName,
            departmentName,
            Topic,
            email,
            phoneNumber,
            alternativeEmail,
            supervisor1,
            supervisor2,
            semesterRegistration,
            academicYear,
            scannedForm,
            thesisfile,
        } = req.body

        console.log('scannedForm', scannedForm)
        const student = new StudentModel({
            _id: mongoose.Types.ObjectId(),
            registrationNumber,
            studentName,
            graduate_program_type: programType,
            degree_program: degreeProgram,
            semester: semesterRegistration,
            academicYear,
            schoolName,
            departmentName,
            phoneNumber,
            email,
            alternative_email: alternativeEmail,
        })

        const savedStudent = await student.save()

        let supervisors = [
            supervisor1 !== undefined && {
                name: supervisor1,
            },
            supervisor2 !== undefined && {
                name: supervisor2,
            },
        ]

        const project = new ProjectModel({
            _id: mongoose.Types.ObjectId(),
            topic: Topic,
            supervisors,
            projectStatus: [
                {
                    status: 'New',
                    notes: 'new project creation',
                },
            ],
            student: savedStudent._id,
        })

        let savedProject = await project.save()

        if (scannedForm !== null) {
            const file = new ProjectFileModel({
                _id: mongoose.Types.ObjectId(),
                fileName: scannedForm.name,
                fileExtension: scannedForm.ext,
                fileData: scannedForm.buffer,
                description: 'scannedForm',
            })

            let savefile = await file.save()
            savedProject.files = [
                ...savedProject.files,
                {
                    fileId: savefile._id,
                },
            ]

            await savedProject.save()
        } else {
        }

        if (thesisfile !== null) {
            const file = new ProjectFileModel({
                _id: mongoose.Types.ObjectId(),
                fileName: scannedForm.name,
                fileExtension: scannedForm.ext,
                fileData: scannedForm.buffer,
                description: 'thesisfile',
            })

            let savefile = await file.save()

            savedProject.files = [
                ...savedProject.files,
                {
                    fileId: savefile._id,
                },
            ]

            await savedProject.save()
        } else {
        }

        res.status(201).json('created project successfully')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** paginated projects */

exports.getPaginatedProjects = async (req, res, next) => {
    try {
        const { perPage, page } = req.body

        let currentPage
        console.log('currentPages', req.query.page, page)
        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8

        console.log('currentPage', currentPage)

        //total of all projects
        let overall_total = await ProjectModel.find().countDocuments()

        let getProjects = await ProjectModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .populate(
                'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId'
            )

        let current_total = await ProjectModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .countDocuments()

        res.status(200).json({
            items: getProjects,
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

/** get single projects */

exports.getIndividualProjects = async (req, res, next) => {
    try {
        const id = req.params.id
        let getProject = await ProjectModel.findById(id).populate(
            'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId'
        )
       // console.log(getProject)

        if (!getProject) {
            const error = new Error('Project not found')
            error.statusCode = 404
            throw error
        }

        res.status(200).json(getProject)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
