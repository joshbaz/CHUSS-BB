const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
const StudentModel = require('../models/students')
const TagModel = require('../models/Tags')
const ProjectFileModel = require('../models/projectFiles')
const ProgramTypeModel = require('../models/programType')
const ProjectStatusModel = require('../models/projectStatuses')
const Moments = require('moment-timezone')
require('../models/examiners')
require('../models/examinerReports')

const io = require('../../socket')

const path = require('path')
let mongo = require('mongodb')
//const { GridFsStorage } = require('multer-gridfs-storage')
var Grid = require('gridfs-stream')

require('dotenv').config()
/** email configurations */
const nodemailer = require('nodemailer')

const fs = require('fs')
const hogan = require('hogan.js')
const transporter = nodemailer.createTransport({
    service: 'gmail',

    secure: true,
    auth: {
        user: process.env.gUser,
        pass: process.env.gPass,
    },
})
/** end - email configuration */
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
            gender,
            programType,
            degreeProgram,
            schoolName,
            departmentName,
            Topic,
            email,
            phoneNumber,
            alternativeEmail,
            entryType,
            createdDate,
            fundingType,
        } = req.body

        // console.log('all project files', req.files)

        //find Program type
        const findProposedFee = await ProgramTypeModel.findOne({
            programName: programType,
        })

        if (!findProposedFee) {
            const error = new Error('Create/Check Program Type')
            error.statusCode = 404
            throw error
        }

        const findStudent = await StudentModel.findOne({
            registrationNumber: registrationNumber,
        })

        if (findStudent) {
            const error = new Error('Student already exists')
            error.statusCode = 404
            throw error
        }

        const student = new StudentModel({
            _id: mongoose.Types.ObjectId(),
            registrationNumber,
            studentName,
            gender,
            graduate_program_type: programType,
            degree_program: degreeProgram,
            schoolName,
            departmentName,
            phoneNumber,
            email,
            alternative_email: alternativeEmail,
            fundingType,
        })

        const savedStudent = await student.save()

        const createdDates =
            entryType === 'old entry' && createdDate
                ? Moments(new Date(createdDate)).tz('Africa/Kampala')
                : Moments(new Date()).tz('Africa/Kampala')

        const project = new ProjectModel({
            _id: mongoose.Types.ObjectId(),
            topic: Topic,
            student: savedStudent._id,
            proposedFee: findProposedFee.programFee,
            createdDate: createdDates,
            entryType: entryType,
        })

        await project.save()

        //check if Admissions exists in the tags

        //if not then create the tag
        /** get the Id tag and create the project statuses */
        /** add the project statuses to the project */

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
            gender,
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
            fundingType,
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
        findStudent.gender = gender
        findStudent.fundingType = fundingType
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

        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })
        res.status(201).json('updated successfully')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** create status from The project */
/** create Project status and Tag */
exports.createProjectStatus = async (req, res, next) => {
    try {
        const {
            tagName,
            hex,
            table,
            rgba,
            fullColor,
            projectType,
            projectId,
            startAt,
            expectedEnd,
            timeline,
            timelineDate,
        } = req.body
        const createdDate = Moments(new Date()).tz('Africa/Kampala')
        const startDate = Moments(new Date(startAt)).tz('Africa/Kampala')
        const expectedEndDate = Moments(new Date(expectedEnd)).tz(
            'Africa/Kampala'
        )
        const endDates = Moments(new Date()).tz('Africa/Kampala')

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('Project not found')
            error.statusCode = 404
            throw error
        }

        const newTag = new TagModel({
            _id: new mongoose.Types.ObjectId(),
            tagName,
            table,
            hex,
            fullColor,
            projectType,
        })

        const savedTag = await newTag.save()

        const newProjectStatus = new ProjectStatusModel({
            _id: new mongoose.Types.ObjectId(),
            projectId: projectId,
            tagId: savedTag._id,
            status: tagName,
            createdDate,
            color: hex,
            startDate,
            expectedEndDate,
        })

        const saveProjectStatus = await newProjectStatus.save()

        /** find the saved active status status */
        const findActiveStatus = await ProjectStatusModel.findOne({
            $and: [
                {
                    projectId: projectId,
                },
                {
                    active: true,
                },
            ],
        })

        if (!findActiveStatus) {
            saveProjectStatus.active = true
            //save the status in project
            await saveProjectStatus.save()

            findProject.projectStatus = [
                ...findProject.projectStatus,
                {
                    projectStatusId: saveProjectStatus._id,
                },
            ]

            await findProject.save()

            res.status(200).json('status added')
        } else {
            findActiveStatus.endDate = endDates
            findActiveStatus.active = false

            await findActiveStatus.save()
            saveProjectStatus.active = true
            //save the status in project
            await saveProjectStatus.save()

            findProject.projectStatus = [
                ...findProject.projectStatus,
                {
                    projectStatusId: saveProjectStatus._id,
                },
            ]

            await findProject.save()
            res.status(200).json('status added')
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** new project status update */
/** currently running */
exports.updateProjectStatus2 = async (req, res, next) => {
    try {
        const {
            status,
            statusId,
            startDate,
            expectedEnd,
            endDate,
            timeline,
            statusDate,
            statusEntryType,
            dateOfGraduation,
        } = req.body
        const projectId = req.params.id

        const createdDate = Moments(new Date()).tz('Africa/Kampala')
        let startDates = null
        let expectedEndDate = null
        let statusDateRegistered = null
        if (status !== 'Graduated') {
            startDates =
                timeline === 'true'
                    ? Moments(new Date(startDate)).tz('Africa/Kampala')
                    : null
            expectedEndDate =
                timeline === 'true'
                    ? Moments(new Date(expectedEnd)).tz('Africa/Kampala')
                    : null
            statusDateRegistered =
                timeline === 'true'
                    ? null
                    : Moments(new Date(statusDate)).tz('Africa/Kampala')
        } else {
        }

        const endDates =
            statusEntryType === 'old entry'
                ? Moments(new Date(endDate)).tz('Africa/Kampala')
                : Moments(new Date()).tz('Africa/Kampala')

        let graduationDates = null

        /** checking for entire student information */
        const findProject = await ProjectModel.findById(projectId).populate(
            'student'
        )
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        //find tag
        const findTag = await TagModel.findById(statusId)
        if (!findTag) {
            const error = new Error('No tag found')
            error.statusCode = 404
            throw error
        }

        if (findTag.tagName === 'Graduated') {
            graduationDates = Moments(new Date(dateOfGraduation)).tz(
                'Africa/Kampala'
            )

            findProject.GraduationDate = graduationDates

            const findProjectStatus = await ProjectStatusModel.findOne({
                $and: [
                    {
                        projectId: projectId,
                    },
                    {
                        tagId: findTag._id,
                    },
                ],
            })

            if (!findProjectStatus) {
                const newProjectStatus = new ProjectStatusModel({
                    _id: new mongoose.Types.ObjectId(),
                    projectId: projectId,
                    tagId: findTag._id,
                    status: findTag.tagName,
                    createdDate,
                    hex: findTag.hex,
                    rgba: findTag.rgba,
                    startDate: startDates,
                    expectedEndDate,

                    graduationDates,
                })

                const saveProjectStatus = await newProjectStatus.save()

                /** find the saved active status status */
                const findActiveStatus = await ProjectStatusModel.findOne({
                    $and: [
                        {
                            projectId: projectId,
                        },
                        {
                            active: true,
                        },
                    ],
                })

                if (!findActiveStatus) {
                    if (statusEntryType === 'old entry' && endDate) {
                        saveProjectStatus.active = true
                        saveProjectStatus.endDate = endDates
                        saveProjectStatus.entryType = 'old entry'
                        findProject.activeStatus = saveProjectStatus.status
                    } else {
                        saveProjectStatus.active = true
                        findProject.activeStatus = saveProjectStatus.status
                    }

                    //save the status in project
                    await saveProjectStatus.save()

                    findProject.projectStatus = [
                        ...findProject.projectStatus,
                        {
                            projectStatusId: saveProjectStatus._id,
                        },
                    ]

                    await findProject.save()

                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })

                    res.status(200).json('status added')
                } else {
                    findActiveStatus.endDate = endDates
                    findActiveStatus.active = false

                    await findActiveStatus.save()

                    if (statusEntryType === 'old entry' && endDate) {
                        saveProjectStatus.active = true
                        saveProjectStatus.endDate = endDates
                        saveProjectStatus.entryType = 'old entry'
                        findProject.activeStatus = saveProjectStatus.status
                    } else {
                        saveProjectStatus.active = true
                        findProject.activeStatus = saveProjectStatus.status
                    }

                    //save the status in project
                    await saveProjectStatus.save()

                    findProject.projectStatus = [
                        ...findProject.projectStatus,
                        {
                            projectStatusId: saveProjectStatus._id,
                        },
                    ]

                    await findProject.save()

                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(200).json('status added')
                }
            } else {
                //tag for graduation already exists
                findProjectStatus.graduationDates = graduationDates
                const savedProjectStatuses = await findProjectStatus.save()

                /** find the saved active status status */
                const findActiveStatus = await ProjectStatusModel.findOne({
                    $and: [
                        {
                            projectId: projectId,
                        },
                        {
                            active: true,
                        },
                    ],
                })

                if (!findActiveStatus) {
                    if (statusEntryType === 'old entry' && endDate) {
                        savedProjectStatuses.active = true
                        savedProjectStatuses.entryType = 'old entry'
                        findProject.activeStatus = savedProjectStatuses.status
                    } else {
                        savedProjectStatuses.active = true
                        findProject.activeStatus = savedProjectStatuses.status
                    }

                    //save the status in project
                    await savedProjectStatuses.save()

                    await findProject.save()

                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })

                    res.status(200).json('status updated')
                } else if (
                    findActiveStatus &&
                    findActiveStatus.status !== 'Graduated'
                ) {
                    findActiveStatus.endDate = endDates
                    findActiveStatus.active = false

                    await findActiveStatus.save()

                    if (statusEntryType === 'old entry' && endDate) {
                        savedProjectStatuses.active = true
                        savedProjectStatuses.entryType = 'old entry'
                        findProject.activeStatus = savedProjectStatuses.status
                    } else {
                        savedProjectStatuses.active = true
                        findProject.activeStatus = savedProjectStatuses.status
                    }

                    //save the status in project
                    await savedProjectStatuses.save()

                    await findProject.save()

                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(200).json('status updated')
                } else if (
                    findActiveStatus &&
                    findActiveStatus.status === 'Graduated'
                ) {
                    savedProjectStatuses.active = true

                    findProject.activeStatus = savedProjectStatuses.status

                    //save the status in project
                    await savedProjectStatuses.save()

                    await findProject.save()

                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(200).json('status updated')
                }
            }
        } else {
            const newProjectStatus = new ProjectStatusModel({
                _id: new mongoose.Types.ObjectId(),
                projectId: projectId,
                tagId: findTag._id,
                status: findTag.tagName,
                createdDate,
                hex: findTag.hex,
                rgba: findTag.rgba,
                startDate: startDates,
                expectedEndDate,
                timeline,
                statusDate: statusDateRegistered,
                graduationDates,
            })

            const saveProjectStatus = await newProjectStatus.save()

            /** find the saved active status status */
            const findActiveStatus = await ProjectStatusModel.findOne({
                $and: [
                    {
                        projectId: projectId,
                    },
                    {
                        active: true,
                    },
                ],
            })

            if (!findActiveStatus) {
                if (statusEntryType === 'old entry' && endDate) {
                    saveProjectStatus.active = true
                    saveProjectStatus.endDate = endDates
                    saveProjectStatus.entryType = 'old entry'
                    findProject.activeStatus = saveProjectStatus.status
                } else {
                    saveProjectStatus.active = true
                    findProject.activeStatus = saveProjectStatus.status
                }

                //save the status in project
                await saveProjectStatus.save()

                findProject.projectStatus = [
                    ...findProject.projectStatus,
                    {
                        projectStatusId: saveProjectStatus._id,
                    },
                ]

                await findProject.save()

                io.getIO().emit('updatestudent', {
                    actions: 'update-student',
                    data: findProject._id.toString(),
                })

                /** Send email if status is authorized for viva  */
                if (
                    saveProjectStatus.status.toLowerCase() ===
                    'authorised for viva voce'
                ) {
                    let studentName = findProject.student.studentName
                    let definedStatusDate = Moments(
                        new Date(saveProjectStatus.statusDate)
                    )
                        .tz('Africa/Kampala')
                        .format('MMM Do, YYYY')
                    /** email configurations */

                    let template = fs.readFileSync(
                        './emailStatusUpdate.hjs',
                        'utf-8'
                    )
                    let compliedTemplate = hogan.compile(template)

                    let mailOptions = {
                        from: 'joshuakimbareeba@gmail.com',
                        to: 'joshuakimbareeba@gmail.com',
                        subject: `Notification for Viva Voce Authorization for ${studentName}`,
                        html: compliedTemplate.render({
                            student: studentName,
                            regNumber: findProject.student.registrationNumber,
                            statusDate: definedStatusDate,
                            title: 'Authorized for viva voce',
                        }),
                    }

                    transporter.sendMail(mailOptions, async (error, info) => {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log('email sent: ' + info.response)
                            // findIndividualReport.SubmissionReminder = true
                            // findIndividualReport.SubmissionReminderDate = currentDate
                            //await findIndividualReport.save()
                        }
                    })

                    res.status(200).json('status added')
                } else if (
                    saveProjectStatus.status.toLowerCase() ===
                    'authorized for public defense'
                ) {
                    let studentName = findProject.student.studentName
                    let definedStatusDate = Moments(
                        new Date(saveProjectStatus.statusDate)
                    )
                        .tz('Africa/Kampala')
                        .format('MMM Do, YYYY')

                    let regNumber = findProject.student.registrationNumber
                    //send an sms to the staff members
                    //sending SMS
                    const accountSid = process.env.TWILIO_ACCOUNT_SID
                    const authToken = process.env.TWILIO_AUTH_TOKEN
                    const client = require('twilio')(accountSid, authToken)
                    let PhoneNumberArray = ['+256752667844','+256700560081','+256706861165']

                    for(let iteration = 0; iteration < PhoneNumberArray.length; iteration++){
                        let ttIteration = iteration + 1;

                        client.messages
                            .create({
                                messagingServiceSid: process.env.messageID,
                                body: `${studentName} of Reg. No ${regNumber} has been Authorized for Public Defense on ${definedStatusDate}`,
                                to: PhoneNumberArray[iteration],
                            })
                            .then((message) => console.log(message.sid))

                        if (ttIteration === PhoneNumberArray.length){
                            res.status(200).json('status added')
                        }
                    }
                    
                } else {
                    res.status(200).json('status added')
                }
            } else {
                findActiveStatus.endDate = endDates
                findActiveStatus.active = false

                await findActiveStatus.save()

                if (statusEntryType === 'old entry' && endDate) {
                    saveProjectStatus.active = true
                    saveProjectStatus.endDate = endDates
                    saveProjectStatus.entryType = 'old entry'
                    saveProjectStatus.endDate = endDates
                    saveProjectStatus.timeline = timeline
                    saveProjectStatus.statusDate = statusDateRegistered
                    findProject.activeStatus = saveProjectStatus.status
                } else {
                    saveProjectStatus.active = true
                    findProject.activeStatus = saveProjectStatus.status
                }

                //save the status in project
                await saveProjectStatus.save()

                findProject.projectStatus = [
                    ...findProject.projectStatus,
                    {
                        projectStatusId: saveProjectStatus._id,
                    },
                ]

                await findProject.save()

                io.getIO().emit('updatestudent', {
                    actions: 'update-student',
                    data: findProject._id.toString(),
                })

                if (
                    saveProjectStatus.status.toLowerCase() ===
                    'authorized for viva voce'
                ) {
                    let studentName = findProject.student.studentName

                    let definedStatusDate = Moments(
                        new Date(saveProjectStatus.statusDate)
                    )
                        .tz('Africa/Kampala')
                        .format('MMM Do, YYYY')
                    /** email configurations */

                    let template = fs.readFileSync(
                        './emailStatusUpdate.hjs',
                        'utf-8'
                    )
                    let compliedTemplate = hogan.compile(template)

                    let mailOptions = {
                        from: 'joshuakimbareeba@gmail.com',
                        to: 'joshuakimbareeba@gmail.com',
                        subject: `Notification for Viva Voce Authorization for ${studentName}`,
                        html: compliedTemplate.render({
                            student: studentName,
                            regNumber: findProject.student.registrationNumber,
                            statusDate: definedStatusDate,
                            title: 'Authorized for viva voce',
                        }),
                    }

                    transporter.sendMail(mailOptions, async (error, info) => {
                        if (error) {
                            console.log(error)
                        } else {
                            console.log('email sent: ' + info.response)
                            // findIndividualReport.SubmissionReminder = true
                            // findIndividualReport.SubmissionReminderDate = currentDate
                            //await findIndividualReport.save()
                        }
                    })

                    res.status(200).json('status added')
                } else {
                    res.status(200).json('status added')
                }
                // res.status(200).json('status added')
            }
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** update Project Status */
/** nolonger in use */
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
                    return res.status(200).json('status  updated')
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

                    //  console.log('filtered data', filteredArray, newDataArray)

                    findProject.projectStatus = [
                        ...newDataArray,
                        ...filteredArray,
                    ]
                    await findProject.save()
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    return res.status(200).json('status  updated')
                } else {
                    findProject.projectStatus = [...newDataArray]
                    await findProject.save()
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    return res.status(200).json('status  updated')
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
                res.status(200).json('status  updated')
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
        //  console.log('currentPages', req.query.page, page)
        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8

        // console.log('currentPage', currentPage)

        //total of all projects
        let overall_total = await ProjectModel.find().countDocuments()

        let getProjects = await ProjectModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .populate(
                'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId opponents.opponentId opponentReports.reportId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId supervisor.supervisorId doctoralmembers.doctoralmemberId registration.registrationId projectStatus.projectStatusId'
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
                'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId opponents.opponentId opponentReports.reportId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId supervisor.supervisorId doctoralmembers.doctoralmemberId registration.registrationId projectStatus.projectStatusId'
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
            'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId vivaFiles.fileId opponents.opponentId opponentReports.reportId opponents.projectAppointmentLetter FinalSubmissionFiles.fileId supervisor.supervisorId doctoralmembers.doctoralmemberId registration.registrationId projectStatus.projectStatusId'
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
        //   console.log('filed', findMainFile)
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

                    // console.log('file chunks deletion registration')

                    await ProjectFileModel.findByIdAndDelete(findMainFile._id)
                    //  console.log('registration finally deleted registration')
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
            // console.log('not allowed registration finally deleted registration')
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
        // console.log('testing it', projectId, fileId, secId, secId.toString())
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
        // console.log('filed', findMainFile, 'ee', findProject)
        /** gather all files */
        let allFiles = [...findProject.vivaFiles]
        /** remove the file from project files */
        //  console.log('allFiles', allFiles)
        let newFiles = allFiles.filter((data) => {
            if (data._id.toString() === secId.toString()) {
                return
            } else {
                return data
            }
        })
        /** save the file */
        findProject.vivaFiles = newFiles
        //  console.log('allFiles', newFiles)
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

                    //  console.log('file chunks deletion registration')

                    await ProjectFileModel.findByIdAndDelete(findMainFile._id)
                    // console.log('registration finally deleted registration')
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
            //   console.log('not allowed registration finally deleted registration')
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
        //  console.log('filed', findMainFile)
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

                    //  console.log('file chunks deletion registration')

                    await ProjectFileModel.findByIdAndDelete(findMainFile._id)
                    // console.log('registration finally deleted registration')
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
            //   console.log('not allowed registration finally deleted registration')
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
        // const status =
        //     submissionStatus === 'resubmission' ? 'Looking For Examinar' : ''
        // const notes = 'resubmission'
        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        findProject.submissionStatus = submissionStatus
        await findProject.save()

        if (submissionStatus === 'resubmission') {
            // let newDataArray = [...findProject.projectStatus]
            // findProject.activeStatus = status
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })
            res.status(201).json('submission status changed')
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

/** delete the student */
exports.deleteProject = async (req, res, next) => {
    try {
        const projectId = req.params.pid

        const findProject = await ProjectModel.findById(projectId).populate(
            'student'
        )
        if (!findProject) {
            const error = new Error('No project found')
            error.statusCode = 404
            throw error
        }

        if (
            findProject.files.length > 0 ||
            findProject.supervisor.length > 0 ||
            findProject.registration.length > 0 ||
            findProject.doctoralmembers.length > 0 ||
            findProject.examiners.length > 0 ||
            findProject.examinerReports.length > 0 ||
            findProject.opponents.length > 0 ||
            findProject.opponentReports.length > 0 ||
            findProject.vivaFiles.length > 0 ||
            findProject.FinalSubmissionFiles.length > 0
        ) {
            const error = new Error('This student cannot be deleted')
            error.statusCode = 403
            throw error
        } else {
            let student = findProject.student._id

            await StudentModel.findByIdAndDelete(student)

            await ProjectModel.findByIdAndDelete(projectId)
            io.getIO().emit('updatestudent', {
                actions: 'update-all-student',
            })

            res.status(200).json('Student has been deleted')
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
