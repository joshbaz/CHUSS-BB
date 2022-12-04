const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
const StudentModel = require('../models/students')
const ProjectFileModel = require('../models/projectFiles')
const ProgramTypeModel = require('../models/programType')
require('../models/examiners')
require('../models/examinerReports')

const io = require('../../socket')

const path = require('path')
const multer = require('multer')
let mongo = require('mongodb')
const { GridFsStorage } = require('multer-gridfs-storage')
var Grid = require('gridfs-stream')
require('dotenv').config()
const mongoUri = process.env.MONGO_R_URL
const conn = mongoose.createConnection(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

let gfs
let gridfsBucket

conn.once('open', () => {
    gridfsBucket = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'chussfiles',
    })

    gfs = Grid(conn.db, mongo)
    gfs.collection('chussfiles')
    // gfs = Grid(conn.db)
    // gfs.collection('reportFiless')
})
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
            schoolName,
            departmentName,
            phoneNumber,
            email,
            alternative_email: alternativeEmail,
        })

        const savedStudent = await student.save()

        const project = new ProjectModel({
            _id: mongoose.Types.ObjectId(),
            topic: Topic,
            activeStatus: 'Thesis / dessertation Approval',
            projectStatus: [
                {
                    status: 'Admissions',
                    notes: `New ${programType} student entry`,
                    completed: true,
                },
                {
                    status: 'Thesis / dessertation Approval',
                    notes: 'Approval of the thesis/ dessertation',
                    active: true,
                },
                {
                    status: 'Looking For Examinar',
                    notes: '',
                    completed: false,
                },
                {
                    status: 'Marking in Progress',
                    notes: '',
                    completed: false,
                },
                {
                    status: 'Waiting For Viva Approval',
                    notes: '',
                    completed: false,
                },
                {
                    status: 'Waiting For Viva Minutes',
                    notes: '',
                    completed: false,
                },
                {
                    status: 'Final Submission',
                    notes: '',
                    completed: false,
                },
                {
                    status: 'Graduated',
                    notes: '',
                    completed: false,
                },
            ],
            student: savedStudent._id,
            proposedFee: findProposedFee.programFee,
        })

        await project.save()

        // if (req.files) {
        //     for (let iteration = 0; iteration < req.files.length; iteration++) {
        //         //scanned Form
        //         if (req.files[iteration].metadata.name === 'Intent') {
        //             const filesExtenstions = path
        //                 .extname(req.files[iteration].originalname)
        //                 .slice(1)
        //             const saveFile = new ProjectFileModel({
        //                 _id: mongoose.Types.ObjectId(),
        //                 fileId: req.files[iteration].id,
        //                 fileName: req.files[iteration].metadata.name,
        //                 fileExtension: filesExtenstions,
        //                 fileType: req.files[iteration].mimetype,
        //                 fileSize: req.files[iteration].size,
        //                 description: 'scannedForm',
        //             })

        //             let savedFiles = await saveFile.save()

        //             savedProject.files = [
        //                 ...savedProject.files,
        //                 {
        //                     fileId: savedFiles._id,
        //                 },
        //             ]

        //             await savedProject.save()
        //         }

        //         //thesisfile
        //         if (req.files[iteration].metadata.name === 'thesis') {
        //             const filesExtenstions = path
        //                 .extname(req.files[iteration].originalname)
        //                 .slice(1)
        //             const saveFile = new ProjectFileModel({
        //                 _id: mongoose.Types.ObjectId(),
        //                 fileId: req.files[iteration].id,
        //                 fileName: req.files[iteration].metadata.name,
        //                 fileExtension: filesExtenstions,
        //                 fileType: req.files[iteration].mimetype,
        //                 fileSize: req.files[iteration].size,
        //                 description: 'thesisfile',
        //             })

        //             let savedFiles = await saveFile.save()

        //             savedProject.files = [
        //                 ...savedProject.files,
        //                 {
        //                     fileId: savedFiles._id,
        //                 },
        //             ]

        //             await savedProject.save()
        //         }
        //     }
        // } else {
        // }

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
        io.getIO().emit('new-student', {
            actions: 'new-student',
        })
        res.status(201).json(`${programType} student created successfully`)
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

            semesterRegistration,
            academicYear,
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

        //change Project
        findProject.topic = Topic

        await findProject.save()

        // if (req.files) {
        //     for (let iteration = 0; iteration < req.files.length; iteration++) {
        //         //scanned Form
        //         if (req.files[iteration].metadata.name === 'Intent') {
        //             const filesExtenstions = path
        //                 .extname(req.files[iteration].originalname)
        //                 .slice(1)
        //             const saveFile = new ProjectFileModel({
        //                 _id: mongoose.Types.ObjectId(),
        //                 fileId: req.files[iteration].id,
        //                 fileName: req.files[iteration].metadata.name,
        //                 fileExtension: filesExtenstions,
        //                 fileType: req.files[iteration].mimetype,
        //                 fileSize: req.files[iteration].size,
        //                 description: 'scannedForm',
        //             })

        //             let savedFiles = await saveFile.save()

        //             findProject.files = [
        //                 ...findProject.files,
        //                 {
        //                     fileId: savedFiles._id,
        //                 },
        //             ]

        //             await findProject.save()
        //         }

        //         //thesisfile
        //         if (req.files[iteration].metadata.name === 'thesis') {
        //             const filesExtenstions = path
        //                 .extname(req.files[iteration].originalname)
        //                 .slice(1)
        //             const saveFile = new ProjectFileModel({
        //                 _id: mongoose.Types.ObjectId(),
        //                 fileId: req.files[iteration].id,
        //                 fileName: req.files[iteration].metadata.name,
        //                 fileExtension: filesExtenstions,
        //                 fileType: req.files[iteration].mimetype,
        //                 fileSize: req.files[iteration].size,
        //                 description: 'thesisfile',
        //             })

        //             let savedFiles = await saveFile.save()

        //             findProject.files = [
        //                 ...findProject.files,
        //                 {
        //                     fileId: savedFiles._id,
        //                 },
        //             ]

        //             await findProject.save()
        //         }
        //     }
        // } else {
        // }
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
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
                    findProject.activeStatus = status
                    findProject.projectStatus = [...newDataArray]
                    await findProject.save()
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    return res.status(200).json('status 2 updated')
                }
            }

            if (
                newDataArray[iteration].status.toLowerCase() ===
                status.toLowerCase()
            ) {
                newDataArray[iteration].active = true
                newDataArray[iteration].completed = false
                findProject.activeStatus = status
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
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    return res.status(200).json('status 4 updated')
                } else {
                    findProject.projectStatus = [...newDataArray]
                    await findProject.save()
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
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
                findProject.activeStatus = status
                await findProject.save()
                io.getIO().emit('updatestudent', {
                    actions: 'update-student',
                    data: findProject._id.toString(),
                })
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
                'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId opponents.opponentId opponentReports.reportId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId supervisor.supervisorId doctoralmembers.doctoralmemberId registration.registrationId'
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

/** get all projects */
exports.getAllProjects = async (req, res, next) => {
    try {
        let overall_total = await ProjectModel.find().countDocuments()
        let getProjects = await ProjectModel.find()
            .sort({ createdAt: -1 })
            .populate(
                'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId opponents.opponentId opponentReports.reportId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId supervisor.supervisorId doctoralmembers.doctoralmemberId registration.registrationId'
            )
        res.status(200).json({
            items: getProjects,
            overall_total,
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
            'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId vivaFiles.fileId opponents.opponentId opponentReports.reportId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId supervisor.supervisorId doctoralmembers.doctoralmemberId registration.registrationId'
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

        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })

        res.status(201).json('updated candidate files')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** remove candidate files */
exports.removeCandidateFile = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const fileId = req.params.fid
        const secId = req.params.secId

        const findProject = await ProjectModel.findById(projectId).populate(
            'files.fileId'
        )
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        const findMainFile = await ProjectFileModel.findOne({ fileId: fileId })
        if (!findMainFile) {
            const error = new Error('No File  found!')
            error.statusCode = 404
            throw error
        }
        console.log('filed', findMainFile)
        /** gather all files */
        let allFiles = [...findProject.files]

        /** remove the file from project files */
        let newFiles = allFiles.filter((data) => {
            if (data._id.toString() === secId.toString()) {
                return
            } else {
                return data
            }
        })
        /** save the file */
        findProject.files = newFiles
        await findProject.save()

        const initFileId = findMainFile.fileId

        if (initFileId) {
            if (!initFileId || initFileId === 'undefined') {
                return res.status(400).send('no document found')
            } else {
                const newFileId = new mongoose.Types.ObjectId(initFileId)
                const file = await gfs.files.findOne({ _id: newFileId })
                const gsfb = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'chussfiles',
                })

                gsfb.delete(file._id, async (err, gridStore) => {
                    if (err) {
                        return next(err)
                    }

                    console.log('file chunks deletion registration')

                    await ProjectFileModel.findByIdAndDelete(findMainFile._id)
                    console.log('registration finally deleted registration')
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(200).json(`File has been deleted`)
                    //res.status(200).end()
                    return
                })
            }
        } else {
            await ProjectFileModel.findByIdAndDelete(findMainFile._id)
            console.log('not allowed registration finally deleted registration')
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })
            res.status(200).json(`File has been deleted`)
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
/** remove viva files */
exports.removePVivaFile = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const fileId = req.params.fid
        const secId = req.params.secId
        console.log('testing it', projectId, fileId, secId, secId.toString())
        const findProject = await ProjectModel.findById(projectId).populate(
            'files.fileId'
        )
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        const findMainFile = await ProjectFileModel.findOne({
            fileId: fileId,
        })
        if (!findMainFile) {
            const error = new Error('No File  found!')
            error.statusCode = 404
            throw error
        }
        console.log('filed', findMainFile, 'ee', findProject)
        /** gather all files */
        let allFiles = [...findProject.vivaFiles]
        /** remove the file from project files */
        console.log('allFiles', allFiles)
        let newFiles = allFiles.filter((data) => {
            if (data._id.toString() === secId.toString()) {
                return
            } else {
                return data
            }
        })
        /** save the file */
        findProject.vivaFiles = newFiles
        console.log('allFiles', newFiles)
        await findProject.save()

        const initFileId = findMainFile.fileId

        if (initFileId) {
            if (!initFileId || initFileId === 'undefined') {
                return res.status(400).send('no document found')
            } else {
                const newFileId = new mongoose.Types.ObjectId(initFileId)
                const file = await gfs.files.findOne({ _id: newFileId })
                const gsfb = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'chussfiles',
                })

                gsfb.delete(file._id, async (err, gridStore) => {
                    if (err) {
                        return next(err)
                    }

                    console.log('file chunks deletion registration')

                    await ProjectFileModel.findByIdAndDelete(findMainFile._id)
                    console.log('registration finally deleted registration')
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(200).json(`File has been deleted`)
                    //res.status(200).end()
                    return
                })
            }
        } else {
            await ProjectFileModel.findByIdAndDelete(findMainFile._id)
            console.log('not allowed registration finally deleted registration')
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })
            res.status(200).json(`File has been deleted`)
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
/** final submission files */
exports.removePFSubmissionFile = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const fileId = req.params.fid
        const secId = req.params.secId

        const findProject = await ProjectModel.findById(projectId).populate(
            'files.fileId'
        )
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        const findMainFile = await ProjectFileModel.findOne({
            fileId: fileId,
        })
        if (!findMainFile) {
            const error = new Error('No File  found!')
            error.statusCode = 404
            throw error
        }
        console.log('filed', findMainFile)
        /** gather all files */
        let allFiles = [...findProject.FinalSubmissionFiles]
        /** remove the file from project files */
        let newFiles = allFiles.filter((data) => {
            if (data._id.toString() === secId.toString()) {
                return
            } else {
                return data
            }
        })
        /** save the file */
        findProject.FinalSubmissionFiles = newFiles
        await findProject.save()

        const initFileId = findMainFile.fileId

        if (initFileId) {
            if (!initFileId || initFileId === 'undefined') {
                return res.status(400).send('no document found')
            } else {
                const newFileId = new mongoose.Types.ObjectId(initFileId)
                const file = await gfs.files.findOne({ _id: newFileId })
                const gsfb = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'chussfiles',
                })

                gsfb.delete(file._id, async (err, gridStore) => {
                    if (err) {
                        return next(err)
                    }

                    console.log('file chunks deletion registration')

                    await ProjectFileModel.findByIdAndDelete(findMainFile._id)
                    console.log('registration finally deleted registration')
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(200).json(`File has been deleted`)
                    //res.status(200).end()
                    return
                })
            }
        } else {
            await ProjectFileModel.findByIdAndDelete(findMainFile._id)
            console.log('not allowed registration finally deleted registration')
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })
            res.status(200).json(`File has been deleted`)
        }
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
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })

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
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })

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
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
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
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
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
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
        res.status(201).json('updated graduation Date')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update resubmission */
exports.updateResubmission = async (req, res, next) => {
    try {
        const projectId = req.params.id
        const { submissionStatus } = req.body
        const status =
            submissionStatus === 'resubmission' ? 'Looking For Examinar' : ''
        const notes = 'resubmission'
        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        findProject.submissionStatus = submissionStatus
        await findProject.save()

        if (submissionStatus === 'resubmission') {
            let newDataArray = [...findProject.projectStatus]
            findProject.activeStatus = status

            for (
                let iteration = 0;
                iteration < newDataArray.length;
                iteration++
            ) {
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
                        io.getIO().emit('updatestudent', {
                            actions: 'update-student',
                            data: findProject._id.toString(),
                        })
                        return res.status(201).json('submission status changed')
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

                        findProject.projectStatus = [
                            ...newDataArray,
                            ...filteredArray,
                        ]
                        await findProject.save()
                        io.getIO().emit('updatestudent', {
                            actions: 'update-student',
                            data: findProject._id.toString(),
                        })
                        return res.status(201).json('submission status changed')
                    } else {
                        findProject.projectStatus = [...newDataArray]
                        await findProject.save()
                        return
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
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(201).json('submission status changed')
                    return
                }
            }
            //res.status(201).json('submission status changed')
        } else {
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })
            res.status(201).json('submission status changed')
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
