const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
//const StudentModel = require('../models/students')
const ProjectFileModel = require('../models/projectFiles')
const OpponentModel = require('../models/opponents')
const OpponentReportModel = require('../models/opponentReports')
const path = require('path')
const io = require('../../socket')
const Moments = require('moment-timezone')
let mongo = require('mongodb')
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

/** create opponent from project */
exports.createProjectOpponent = async (req, res, next) => {
    try {
        const {
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
            otherTitles,
            preferredPayment,
            mobileOperator,
            mobileSubscriberName,
            mobileNumber,
            bank,
            AccName,
            AccNumber,
            swift_bicCode,
            bankCode,
            branchCode,
            bankAddress,
            bankCity,
            typeOfExaminer,
            examinerAppLetter,
            projectAppLetter,
        } = req.body

        const projectId = req.params.pid
        const findProject = await ProjectModel.findById(projectId)

        if (!findProject) {
            const error = new Error('Project Not Found')
            error.statusCode = 404
            throw error
        }

        let paymentInfo = []

        if (preferredPayment === 'mobileMoney') {
            paymentInfo = [
                {
                    preferredPayment,
                    mobileOperator,
                    mobileSubscriberName,
                    mobileNumber,
                },
            ]
        }

        if (preferredPayment === 'Bank Transfer/Money Transfer /SWIFT') {
            paymentInfo = [
                {
                    preferredPayment,
                    bank,
                    AccountName: AccName,
                    AccountNumber: AccNumber,
                    swift_bicCode,
                    bankCode,
                    branchCode,
                    bankAddress,
                    bankCity,
                },
            ]
        }

        /** instance of an opponent */

        const opponent = new OpponentModel({
            _id: new mongoose.Types.ObjectId(),
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
            otherTitles,
            paymentInfo,
            typeOfExaminer,
        })

        const savedOpponent = await opponent.save()

        /** initialize opponents to save in project Model */
        let opponentToSave = {
            opponentId: savedOpponent._id,
            preferredPayment: preferredPayment,
        }

        /** save the examiner general appointment File */
        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                //scanned Form
                if (
                    req.files[iteration].metadata.name === 'opponentAppLetter'
                ) {
                    const filesExtenstions = path
                        .extname(req.files[iteration].originalname)
                        .slice(1)
                    const saveFile = new ProjectFileModel({
                        _id: new mongoose.Types.ObjectId(),
                        fileId: req.files[iteration].id,
                        fileName: req.files[iteration].metadata.name,
                        fileExtension: filesExtenstions,
                        fileType: req.files[iteration].mimetype,
                        fileSize: req.files[iteration].size,
                        description: 'opponentAppLetter',
                    })

                    let savedFiles = await saveFile.save()

                    savedOpponent.generalAppointmentLetters = [
                        ...savedOpponent.generalAppointmentLetters,
                        {
                            fileId: savedFiles._id,
                        },
                    ]
                    opponentToSave.generalAppointmentLetters = savedFiles._id

                    await savedOpponent.save()
                }

                //thesisfile
                if (
                    req.files[iteration].metadata.name === 'projectOppAppLetter'
                ) {
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
                        description: 'projectOppAppLetter',
                    })

                    let savedFiles = await saveFile.save()

                    opponentToSave.projectAppointmentLetter = savedFiles._id
                }
            }
        } else {
        }

        /** save the examiner to the project itself */
        findProject.opponents = [...findProject.opponents, opponentToSave]

        await findProject.save()

        /**
         * instance of examiner Report since the examiner
         * is now assigned to Project
         * */

        const opponentReport = new OpponentReportModel({
            _id: mongoose.Types.ObjectId(),
            projectId: findProject._id,
            opponent: savedOpponent._id,
            score: 0,
            reportStatus: 'pending',
        })

        let savedReport = await opponentReport.save()

        /** save the report detail to the project */
        findProject.opponentReports = [
            ...findProject.opponentReports,
            {
                reportId: savedReport._id,
            },
        ]

        await findProject.save()
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findProject._id.toString(),
        })

        res.status(201).json('Opponent has been successfully assigned')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** assign Opponent From Project */
exports.assignOpponent = async (req, res, next) => {
    try {
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
            const findOpponent = await OpponentModel.findById(
                items[iteration]._id
            )

            if (!findOpponent) {
                const error = new Error('Opponent Not Found')
                error.statusCode = 404
                throw error
            }

            let opponentToSave = {
                opponentId: findOpponent._id,
            }

            if (findOpponent.paymentInfo.length > 0) {
                opponentToSave.preferredPayment = findOpponent.preferredPayment
            } else {
            }

            findProject.opponents = [...findProject.opponents, opponentToSave]

            await findProject.save()

            /**
             * instance of examiner Report since the examiner
             * is now assigned to Project
             * */

            const opponentReport = new OpponentReportModel({
                _id: mongoose.Types.ObjectId(),
                projectId: findProject._id,
                opponent: findOpponent._id,
                score: 0,
                reportStatus: 'pending',
            })

            let savedReport = await opponentReport.save()

            /** save the report detail to the project */
            findProject.opponentReports = [
                ...findProject.opponentReports,
                {
                    reportId: savedReport._id,
                },
            ]

            await findProject.save()

            if (titerations === items.length) {
                io.getIO().emit('updatestudent', {
                    actions: 'update-student',
                    data: findProject._id.toString(),
                })
                res.status(201).json(
                    `${
                        items.length > 1 ? 'Opponents' : 'Opponent'
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

/** get all opponents */
exports.getAllOpponents = async (req, res, next) => {
    try {
        const findOpponents = await OpponentModel.find()

        res.status(200).json({
            items: findOpponents,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** paginated opponents */
exports.getPaginatedOpponents = async (req, res, next) => {
    try {
        const { perPage, page } = req.body

        let currentPage

        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8
        console.log('perPages', perPages)
        let overall_total = await OpponentModel.find().countDocuments()

        let getOpponents = await OpponentModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .populate('generalAppointmentLetters.fileId')

        let current_total = await OpponentModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .countDocuments()

        let newArray = [...getOpponents]

        for (let i = 0; i < newArray.length; i++) {
            let iterations = i + 1
            const findProjectCount = await ProjectModel.find({
                'opponents.opponentId': newArray[i]._id,
            }).countDocuments()

            newArray[i].studentsNo = findProjectCount
            console.log('newArray', newArray)

            if (iterations === getOpponents.length) {
                res.status(200).json({
                    items: newArray,
                    overall_total,
                    currentPage,
                    perPage: perPages,
                    current_total,
                })
            }
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/**
 * get single Opponent
 * this to be removed later
 * */

exports.getIndividualOpponent = async (req, res, next) => {
    try {
        const id = req.params.id
        let getOpponent = await OpponentModel.findById(id).populate(
            'generalAppointmentLetters.fileId'
        )

        if (!getOpponent) {
            const error = new Error('Opponent not found')
            error.statusCode = 404
            throw error
        }

        res.status(200).json(getOpponent)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** Delete the project Appointment Letter */
exports.deleteProjectAppLetter = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const projectAppLId = req.params.fid

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        const findFileDetail = await ProjectFileModel.findById(projectAppLId)
        if (!findFileDetail) {
            const error = new Error('File not found!')
            error.statusCode = 404
            throw error
        }

        let ProjectExaminers = [...findProject.opponents]
        let foundOpponent

        let newProjectExaminers = ProjectExaminers.map((data) => {
            if (
                !data.projectAppointmentLetter ||
                findFileDetail._id.toString() !==
                    data.projectAppointmentLetter.toString()
            ) {
                return data
            } else {
                foundOpponent = data.opponentId
                return {
                    opponentId: data.opponentId,
                    preferredPayment: data.preferredPayment,
                }
            }
        })

        findProject.opponents = newProjectExaminers
        await findProject.save()

        if (findFileDetail.fileId) {
            const initFileId = findFileDetail.fileId
            console.log('initFileId', initFileId)
            if (!initFileId || initFileId === 'undefined') {
                return res.status(400).send('no document found')
            } else {
                const newFileId = new mongoose.Types.ObjectId(initFileId)
                console.log('newFileId', newFileId)

                const file = await gfs.files.findOne({ _id: newFileId })
                const gsfb = new mongoose.mongo.GridFSBucket(conn.db, {
                    bucketName: 'chussfiles',
                })

                gsfb.delete(file._id, async (err, gridStore) => {
                    if (err) {
                        return next(err)
                    }

                    console.log('file chunks deletion registration')

                    await ProjectFileModel.findByIdAndDelete(projectAppLId)
                    io.getIO().emit('updateop-project', {
                        actions: 'update-app-letter',
                        data: foundOpponent.toString(),
                    })
                    console.log('registration finally deleted registration')
                    res.status(200).json(`Project App Letter has been deleted`)
                    //res.status(200).end()
                    return
                })
            }
        } else {
            await ProjectFileModel.findByIdAndDelete(projectAppLId)
            io.getIO().emit('updateop-project', {
                actions: 'update-app-letter',
                data: foundOpponent.toString(),
            })
            console.log('not allowed file finally deleted registration')
            res.status(200).json(`File has been deleted`)
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** add project file Letter */
exports.createProjectAppOpponentFile = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const projectExaminer = req.params.eid

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        const findExaminer = await OpponentModel.findById(projectExaminer)
        if (!findExaminer) {
            const error = new Error('Examiner not found!')
            error.statusCode = 404
            throw error
        }

        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                if (req.files[iteration].metadata.name === 'projectAppLetter') {
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
                        description: 'projectAppLetter',
                    })

                    let savedFiles = await saveFile.save()

                    //examinerToSave.projectAppointmentLetter = savedFiles._id
                    //transfer details of savedFile
                    let ProjectExaminers = [...findProject.opponents]

                    let newProjectExaminers = ProjectExaminers.map((data) => {
                        if (
                            findExaminer._id.toString() !==
                            data.opponentId.toString()
                        ) {
                            return data
                        } else {
                            return {
                                opponentId: data.opponentId,
                                projectAppointmentLetter: savedFiles._id,
                                preferredPayment: data.preferredPayment,
                            }
                        }
                    })

                    /** save the project */
                    findProject.opponents = newProjectExaminers
                    await findProject.save()

                    io.getIO().emit('updateop-project', {
                        actions: 'update-app-letter',
                        data: findExaminer._id.toString(),
                    })
                    res.status(201).json('Project Appointment Letter Added ')
                    return
                }
            }
        } else {
            res.status(404).json('no file to upload')
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** remove project opponent */
exports.removeProjectOpponentsR = async (req, res, next) => {
    try {
        const sectionId = req.params.secid
        const examinerId = req.params.eid
        const projectId = req.params.pid

        const findProject = await ProjectModel.findById(projectId).populate(
            'opponentReports.reportId'
        )
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        const findExaminer = await OpponentModel.findById(examinerId)
        if (!findExaminer) {
            const error = new Error('Examiner not found!')
            error.statusCode = 404
            throw error
        }

        const findReports = await OpponentReportModel.find({
            opponent: examinerId,
            projectId: projectId,
            marked: false,
        })
        if (!findReports) {
            const error = new Error('No Reports not found!')
            error.statusCode = 404
            throw error
        }

        if (findReports.length < 1) {
            res.status(200).json('You cannot delete a Marked Report!')
        } else {
            /** query whether the secid type is resubmission /normal */
            let allProjectExaminers = [...findProject.opponents]

            /** get the secId & type */
            let secDetails = allProjectExaminers.find(
                (element) => element._id.toString() === sectionId.toString()
            )

            if (secDetails) {
                /** query out reports */
                let allProjectExamReports = [...findProject.opponentReports]
                console.log('allProjectExamReports', allProjectExamReports)
                let foundReports = allProjectExamReports.find(
                    (element) =>
                        element.reportId.opponent.toString() ===
                            secDetails.opponentId.toString() &&
                        element.reportId.marked === false
                )

                if (foundReports) {
                    /** remove the report from project */
                    console.log('saved new ', foundReports)
                    let newAllReports = allProjectExamReports.filter((data) => {
                        if (
                            foundReports._id.toString() !== data._id.toString()
                        ) {
                            return data
                        } else {
                            return
                        }
                    })

                    findProject.opponentReports = newAllReports
                    await findProject.save()
                    console.log('saved new ')
                    /** Delete the report from reports */
                    await OpponentReportModel.findByIdAndDelete(
                        foundReports.reportId._id
                    )
                    /** remove project appointment if any and examiner from project */
                    if (secDetails.projectAppointmentLetter) {
                        const findFileDetail = await ProjectFileModel.findById(
                            secDetails.projectAppointmentLetter
                        )
                        if (!findFileDetail) {
                            const error = new Error('File not found!')
                            error.statusCode = 404
                            throw error
                        }

                        let newAllExaminers = allProjectExaminers.filter(
                            (data) => {
                                if (
                                    secDetails._id.toString() !==
                                    data._id.toString()
                                ) {
                                    return data
                                }
                            }
                        )

                        findProject.opponents = newAllExaminers
                        await findProject.save()
                        /** delete the project file found */
                        if (findFileDetail.fileId) {
                            const initFileId = findFileDetail.fileId
                            console.log('initFileId', initFileId)
                            if (!initFileId || initFileId === 'undefined') {
                                return res.status(400).send('no document found')
                            } else {
                                const newFileId = new mongoose.Types.ObjectId(
                                    initFileId
                                )
                                console.log('newFileId', newFileId)

                                const file = await gfs.files.findOne({
                                    _id: newFileId,
                                })
                                const gsfb = new mongoose.mongo.GridFSBucket(
                                    conn.db,
                                    {
                                        bucketName: 'chussfiles',
                                    }
                                )

                                gsfb.delete(
                                    file._id,
                                    async (err, gridStore) => {
                                        if (err) {
                                            return next(err)
                                        }

                                        console.log(
                                            'file chunks deletion registration'
                                        )

                                        await ProjectFileModel.findByIdAndDelete(
                                            findFileDetail._id
                                        )
                                        console.log('opponnet finally deleted ')

                                        io.getIO().emit('updatestudent', {
                                            actions: 'update-student',
                                            data: findProject._id.toString(),
                                        })
                                        res.status(200).json(
                                            `opponnet removed from project`
                                        )
                                        //res.status(200).end()
                                        return
                                    }
                                )
                            }
                        } else {
                            await ProjectFileModel.findByIdAndDelete(
                                findFileDetail._id
                            )
                            console.log(
                                'not allowed file finally deleted registration'
                            )
                            io.getIO().emit('updatestudent', {
                                actions: 'update-student',
                                data: findProject._id.toString(),
                            })

                            res.status(200).json(
                                `opponent removed from project`
                            )
                        }
                    } else {
                        let newAllExaminers = allProjectExaminers.filter(
                            (data) => {
                                if (
                                    secDetails._id.toString() !==
                                    data._id.toString()
                                ) {
                                    return data
                                }
                            }
                        )

                        findProject.opponents = newAllExaminers
                        await findProject.save()

                        io.getIO().emit('updatestudent', {
                            actions: 'update-student',
                            data: findProject._id.toString(),
                        })
                        res.status(200).json('opponent removed from project')
                    }
                    /** Done */
                } else {
                    res.status(200).json('Opponent cannot be removed')
                }
            } else {
                res.status(200).json('Opponent cannot be removed')
            }
            /** get returned values */

            // res.status(200).json('returned values')
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
