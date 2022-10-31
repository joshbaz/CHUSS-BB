const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
const StudentModel = require('../models/students')
const ProjectFileModel = require('../models/projectFiles')
const ProgramTypeModel = require('../models/programType')
require('../models/examiners')
require('../models/examinerReports')
const path = require('path')

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

        console.log('all project files', req.files)

        //find Program type
        const findProposedFee = await ProgramTypeModel.findOne({
            programName: programType,
        })

        if (!findProposedFee) {
            const error = new Error('Create/Check Program Type')
            error.statusCode = 404
            throw error
        }

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

        let supervisors = []
        if (supervisor1 !== undefined && supervisor1 !== '') {
            supervisors.push({
                name: supervisor1,
            })
        } else {
        }

        if (supervisor2 !== undefined && supervisor2 !== '') {
            supervisors.push({
                name: supervisor2,
            })
        } else {
        }

        const project = new ProjectModel({
            _id: mongoose.Types.ObjectId(),
            topic: Topic,
            supervisors,
            projectStatus: [
                {
                    status: 'Create Project',
                    notes: 'Project creation',
                    completed: true,
                },
                {
                    status: 'Looking For Examinar',
                    notes: 'Searching for examiners',
                    active: true,
                },
            ],
            student: savedStudent._id,
            proposedFee: findProposedFee.programFee,
        })

        let savedProject = await project.save()

        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                //scanned Form
                if (req.files[iteration].metadata.name === 'Intent') {
                    const filesExtenstions = path
                        .extname(req.files[iteration].originalname)
                        .slice(1)
                    const saveFile = new ProjectFileModel({
                        _id: mongoose.Types.ObjectId(),
                        fileId: req.files[iteration].id,
                        fileName: req.files[iteration].metadata.name,
                        fileExtension: filesExtenstions,
                        fileType: req.files[iteration].mimetype,
                        fileSize: req.files[iteration].size,
                        description: 'scannedForm',
                    })

                    let savedFiles = await saveFile.save()

                    savedProject.files = [
                        ...savedProject.files,
                        {
                            fileId: savedFiles._id,
                        },
                    ]

                    await savedProject.save()
                }

                //thesisfile
                if (req.files[iteration].metadata.name === 'thesis') {
                    const filesExtenstions = path
                        .extname(req.files[iteration].originalname)
                        .slice(1)
                    const saveFile = new ProjectFileModel({
                        _id: mongoose.Types.ObjectId(),
                        fileId: req.files[iteration].id,
                        fileName: req.files[iteration].metadata.name,
                        fileExtension: filesExtenstions,
                        fileType: req.files[iteration].mimetype,
                        fileSize: req.files[iteration].size,
                        description: 'thesisfile',
                    })

                    let savedFiles = await saveFile.save()

                    savedProject.files = [
                        ...savedProject.files,
                        {
                            fileId: savedFiles._id,
                        },
                    ]

                    await savedProject.save()
                }
            }
        } else {
        }

        // if (scannedForm !== null) {
        //     const file = new ProjectFileModel({
        //         _id: mongoose.Types.ObjectId(),
        //         fileName: scannedForm.name,
        //         fileExtension: scannedForm.ext,
        //         fileData: scannedForm.buffer,
        //         description: 'scannedForm',
        //     })

        //     let savefile = await file.save()
        //     savedProject.files = [
        //         ...savedProject.files,
        //         {
        //             fileId: savefile._id,
        //         },
        //     ]

        //     await savedProject.save()
        // } else {
        // }

        // if (thesisfile !== null) {
        //     const file = new ProjectFileModel({
        //         _id: mongoose.Types.ObjectId(),
        //         fileName: thesisfile.name,
        //         fileExtension: thesisfile.ext,
        //         fileData: thesisfile.buffer,
        //         description: 'thesisfile',
        //     })

        //     let savefile = await file.save()

        //     savedProject.files = [
        //         ...savedProject.files,
        //         {
        //             fileId: savefile._id,
        //         },
        //     ]

        //     await savedProject.save()
        // } else {
        // }

        res.status(201).json('created project successfully')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update Project Details */
exports.updateProject = async (req, res, next) => {
    try {
        const projectId = req.params.id
        const {
            registrationNumber,
            studentId,
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

        const findProposedFee = await ProgramTypeModel.findOne({
            programName: programType,
        })

        if (!findProposedFee) {
            const error = new Error('Create/Check Program Type')
            error.statusCode = 404
            throw error
        }

        const findStudent = await StudentModel.findById(studentId)
        if (!findStudent) {
            const error = new Error('No student found')
            error.statusCode = 404
            throw error
        }

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        //change student
        findStudent.registrationNumber = registrationNumber
        findStudent.studentName = studentName
        findStudent.graduate_program_type = programType
        findStudent.degree_program = degreeProgram
        findStudent.semester = semesterRegistration
        findStudent.academicYear = academicYear
        findStudent.schoolName = schoolName
        findStudent.departmentName = departmentName
        findStudent.phoneNumber = phoneNumber
        findStudent.email = email
        findStudent.alternative_email = alternativeEmail

        await findStudent.save()

        let supervisors = []
        if (supervisor1 !== undefined && supervisor1 !== '') {
            supervisors.push({
                name: supervisor1,
            })
        } else {
        }

        if (supervisor2 !== undefined && supervisor2 !== '') {
            supervisors.push({
                name: supervisor2,
            })
        } else {
        }
        //change Project
        findProject.topic = Topic
        findProject.supervisors = supervisors

        await findProject.save()

        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                //scanned Form
                if (req.files[iteration].metadata.name === 'Intent') {
                    const filesExtenstions = path
                        .extname(req.files[iteration].originalname)
                        .slice(1)
                    const saveFile = new ProjectFileModel({
                        _id: mongoose.Types.ObjectId(),
                        fileId: req.files[iteration].id,
                        fileName: req.files[iteration].metadata.name,
                        fileExtension: filesExtenstions,
                        fileType: req.files[iteration].mimetype,
                        fileSize: req.files[iteration].size,
                        description: 'scannedForm',
                    })

                    let savedFiles = await saveFile.save()

                    findProject.files = [
                        ...findProject.files,
                        {
                            fileId: savedFiles._id,
                        },
                    ]

                    await findProject.save()
                }

                //thesisfile
                if (req.files[iteration].metadata.name === 'thesis') {
                    const filesExtenstions = path
                        .extname(req.files[iteration].originalname)
                        .slice(1)
                    const saveFile = new ProjectFileModel({
                        _id: mongoose.Types.ObjectId(),
                        fileId: req.files[iteration].id,
                        fileName: req.files[iteration].metadata.name,
                        fileExtension: filesExtenstions,
                        fileType: req.files[iteration].mimetype,
                        fileSize: req.files[iteration].size,
                        description: 'thesisfile',
                    })

                    let savedFiles = await saveFile.save()

                    findProject.files = [
                        ...findProject.files,
                        {
                            fileId: savedFiles._id,
                        },
                    ]

                    await findProject.save()
                }
            }
        } else {
        }

        res.status(201).json('updated project successfully')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update Project Status */
exports.updateProjectStatus = async (req, res, next) => {
    try {
        const { status, notes } = req.body
        const projectId = req.params.id
        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }
        let newDataArray = [...findProject.projectStatus]

        // newDataArray.filter((element, index) => {
        //     if (element.active === true) {
        //         if (element.status !== status) {
        //             newDataArray[index].status = false
        //         }
        //     }
        // })

        for (let iteration = 0; iteration < newDataArray.length; iteration++) {
            let alliteration = iteration + 1

            if (newDataArray[iteration].active === true) {
                if (
                    newDataArray[iteration].status.toLowerCase() !==
                    status.toLowerCase()
                ) {
                    newDataArray[iteration].active = false
                    newDataArray[iteration].completed = true

                    // findProject.projectStatus = [
                    //     ...newDataArray,
                    //     {
                    //         status: status,
                    //         notes: notes,
                    //         active: true,
                    //     },
                    // ]

                    // await findProject.save()
                    // return res.status(200).json('status 3 updated')
                } else {
                    newDataArray[iteration].notes = notes

                    findProject.projectStatus = [...newDataArray]
                    await findProject.save()
                    return res.status(200).json('status 2 updated')
                }
            }

            if (
                newDataArray[iteration].status.toLowerCase() ===
                status.toLowerCase()
            ) {
                newDataArray[iteration].active = true
                newDataArray[iteration].completed = false

                let removedArray = newDataArray.splice(iteration + 1)
                if (removedArray.length > 0) {
                    let filteredArray = removedArray.filter((data) => {
                        data.completed = false
                        data.active = false
                        return data
                    })

                    console.log('filtered data', filteredArray, newDataArray)

                    findProject.projectStatus = [
                        ...newDataArray,
                        ...filteredArray,
                    ]
                    await findProject.save()
                    return res.status(200).json('status 4 updated')
                } else {
                    findProject.projectStatus = [...newDataArray]
                    await findProject.save()
                    return res.status(200).json('status 3 updated')
                }
            }

            if (
                alliteration === newDataArray.length &&
                newDataArray[iteration].status.toLowerCase() !==
                    status.toLowerCase()
            ) {
                findProject.projectStatus = [
                    ...newDataArray,
                    {
                        status: status,
                        notes: notes,
                        active: true,
                    },
                ]

                await findProject.save()
                res.status(200).json('status 1 updated')
            }
        }
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
                'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId opponents.opponentId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId'
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
            'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId vivaFiles.fileId opponents.opponentId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId'
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

/** candidate files update */
exports.putCandidateFiles = async (req, res, next) => {
    try {
        const projectId = req.params.id

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                //scanned Form

                const filesExtenstions = path
                    .extname(req.files[iteration].originalname)
                    .slice(1)
                const saveFile = new ProjectFileModel({
                    _id: mongoose.Types.ObjectId(),
                    fileId: req.files[iteration].id,
                    fileName: req.files[iteration].metadata.name,
                    fileExtension: filesExtenstions,
                    fileType: req.files[iteration].mimetype,
                    fileSize: req.files[iteration].size,
                    description: 'candidateFiles',
                })

                let savedFiles = await saveFile.save()

                findProject.files = [
                    ...findProject.files,
                    {
                        fileId: savedFiles._id,
                    },
                ]

                await findProject.save()
            }
        } else {
        }

        res.status(201).json('updated candidate files')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** viva files update */
exports.putVivaFiles = async (req, res, next) => {
    try {
        const projectId = req.params.id

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                //scanned Form

                const filesExtenstions = path
                    .extname(req.files[iteration].originalname)
                    .slice(1)
                const saveFile = new ProjectFileModel({
                    _id: mongoose.Types.ObjectId(),
                    fileId: req.files[iteration].id,
                    fileName: req.files[iteration].metadata.name,
                    fileExtension: filesExtenstions,
                    fileType: req.files[iteration].mimetype,
                    fileSize: req.files[iteration].size,
                    description: 'vivaFiles',
                })

                let savedFiles = await saveFile.save()

                findProject.vivaFiles = [
                    ...findProject.vivaFiles,
                    {
                        fileId: savedFiles._id,
                    },
                ]

                await findProject.save()
            }
        } else {
        }

        res.status(201).json('updated viva success')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** Date of Defense */
exports.updateVivaDefense = async (req, res, next) => {
    try {
        const projectId = req.params.id
        const { DateOfDefense } = req.body

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        findProject.DateOfDefense = DateOfDefense
        await findProject.save()

        res.status(201).json('updated viva success')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** finalSubmission files update */
exports.putFinalSubmissionFiles = async (req, res, next) => {
    try {
        const projectId = req.params.id

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                //scanned Form

                const filesExtenstions = path
                    .extname(req.files[iteration].originalname)
                    .slice(1)
                const saveFile = new ProjectFileModel({
                    _id: mongoose.Types.ObjectId(),
                    fileId: req.files[iteration].id,
                    fileName: req.files[iteration].metadata.name,
                    fileExtension: filesExtenstions,
                    fileType: req.files[iteration].mimetype,
                    fileSize: req.files[iteration].size,
                    description: 'finalSubmission',
                })

                let savedFiles = await saveFile.save()

                findProject.FinalSubmissionFiles = [
                    ...findProject.FinalSubmissionFiles,
                    {
                        fileId: savedFiles._id,
                    },
                ]

                await findProject.save()
            }
        } else {
        }

        res.status(201).json('updated final submit files success')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** Date of Final Submission */
exports.updateDateOfFinalSubmission = async (req, res, next) => {
    try {
        const projectId = req.params.id
        const { FinalSubmissionDate } = req.body

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        findProject.FinalSubmissionDate = FinalSubmissionDate
        await findProject.save()

        res.status(201).json('updated final submission date success')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** Date of Graduation */
exports.updateDateOfGraduation = async (req, res, next) => {
    try {
        const projectId = req.params.id
        const { GraduationDate } = req.body

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        findProject.GraduationDate = GraduationDate
        await findProject.save()

        res.status(201).json('updated graduation Date')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
