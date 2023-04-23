const mongoose = require('mongoose')
const ExaminerReportModel = require('../models/examinerReports')
const ReportFileModel = require('../models/reportFiles')
const PaymentModel = require('../models/payments')

const io = require('../../socket')

const path = require('path')
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
/** update ExaminerReport */
exports.updateExaminerReport = async (req, res, next) => {
    try {
        const reportId = req.params.rid
        //  console.log(req.file, 'req.files', 'trying it')

        const { score, remarks, ungraded } = req.body

        const findReport = await ExaminerReportModel.findById(
            reportId
        ).populate('projectId examiner')

        const submissionDate = Moments().tz('Africa/Kampala').format()

        if (!findReport) {
            const error = new Error('Report not found')
            error.statusCode = 404
            throw error
        }

        if (ungraded === 'true') {
            findReport.remarks = remarks
            findReport.ungraded = ungraded
            findReport.marked = ungraded && true
            findReport.reportStatus = ungraded && 'ungraded'
            findReport.submissionDate = submissionDate

            await findReport.save()
        } else {
            findReport.score = score
            findReport.marked = score ? true : false
            findReport.ungraded = 'false'
            findReport.reportStatus = score > 59 ? 'Passed' : 'failed'
            findReport.submissionDate = submissionDate
            await findReport.save()
        }

        if (
            !findReport.payment &&
            findReport.examiner.typeOfExaminer === 'External'
        ) {
            const payment = new PaymentModel({
                _id: new mongoose.Types.ObjectId(),
                student: findReport.projectId.student,
                proposedFee: findReport.projectId.proposedFee,
                examiner: findReport.examiner._id,
                project: findReport.projectId._id,
                report: findReport._id,
            })

            let paymentSaved = await payment.save()
            paymentSaved.payCode = paymentSaved._id
                .toString()
                .split('')
                .slice(19)
                .join('')
            await paymentSaved.save()
            findReport.payment = paymentSaved._id
            await findReport.save()
        } else {
        }

        if (req.file) {
            const filesExtenstions = path
                .extname(req.file.originalname)
                .slice(1)
            const saveFile = new ReportFileModel({
                _id: new mongoose.Types.ObjectId(),
                fileId: req.file.id,
                fileName: 'reportFile',
                fileExtension: filesExtenstions,
                fileType: req.file.mimetype,
                fileSize: req.file.size,

                description: 'Report File',
            })

            let savedFiles = await saveFile.save()

            findReport.reportFiles = [
                ...findReport.reportFiles,
                { files: savedFiles._id },
            ]
            await findReport.save()
        } else {
        }

        // if (reportFile !== null) {
        //     const saveFile = new ReportFileModel({
        //         _id: new mongoose.Types.ObjectId(),
        //         fileName: reportFile.name,
        //         fileExtension: reportFile.ext,
        //         fileType: reportFile.fileType,
        //         fileSize: reportFile.fileSize,
        //         fileData: reportFile.buffer,
        //         description: 'Report File',
        //     })

        //     let savedFiles = await saveFile.save()

        //     findReport.reportFiles = [
        //         ...findReport.reportFiles,
        //         { files: savedFiles._id },
        //     ]
        //     await findReport.save()
        // } else {
        // }
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findReport.projectId._id.toString(),
        })

        io.getIO().emit('updatereport', {
            actions: 'update-report',
            data: findReport._id.toString(),
        })
        res.status(200).json('updated report')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get ExaminerReport */
exports.getExaminerReport = async (req, res, next) => {
    try {
        const reportId = req.params.rid

        const findReport = await ExaminerReportModel.findById(
            reportId
        ).populate('examiner reportFiles.files')

        if (!findReport) {
            const error = new Error('Report not found')
            error.statusCode = 404
            throw error
        }

        res.status(200).json(findReport)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

exports.getAllExaminerReports = async (req, res, next) => {
    try {
        let overall_total = await ExaminerReportModel.find().countDocuments()
        const findReports = await ExaminerReportModel.find()
            .sort({ createdAt: -1 })
            .populate('examiner reportFiles.files projectId')

        res.status(200).json({
            items: findReports,
            overall_total,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** remove the examiner report file */
exports.removeExaminerReportFile = async (req, res, next) => {
    try {
        const reportId = req.params.rpid
        const fileId = req.params.fid
        const secId = req.params.secId

        const findReports = await ExaminerReportModel.findById(reportId)
        if (!findReports) {
            const error = new Error('Report not found!')
            error.statusCode = 404
            throw error
        }

        const findMainFile = await ReportFileModel.findOne({
            fileId: fileId,
        })
        if (!findMainFile) {
            const error = new Error('No File  found!')
            error.statusCode = 404
            throw error
        }

        let allFiles = [...findReports.reportFiles]
        /** remove the file from report files */
        let newFiles = allFiles.filter((data) => {
            if (data._id.toString() === secId.toString()) {
                return
            } else {
                return data
            }
        })

        /** save the file */
        findReports.reportFiles = newFiles
        await findReports.save()

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

                    await ReportFileModel.findByIdAndDelete(findMainFile._id)
                    //    console.log('registration finally deleted registration')

                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findReports.projectId.toString(),
                    })

                    io.getIO().emit('updatereport', {
                        actions: 'update-report',
                        data: findReports._id.toString(),
                    })
                    res.status(200).json(`File has been deleted`)
                    //res.status(200).end()
                    return
                })
            }
        } else {
            await ReportFileModel.findByIdAndDelete(findMainFile._id)
            //  console.log('not allowed registration finally deleted registration')

            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findReports.projectId.toString(),
            })

            io.getIO().emit('updatereport', {
                actions: 'update-report',
                data: findReports._id.toString(),
            })
            res.status(200).json(`Filev has been deleted`)
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** report statistics */
exports.reportStatistics = async (req, res, next) => {
    try {
        let currentDate = Moments(new Date())
        const findAllReports = await ExaminerReportModel.find().countDocuments()

        const findReports = await ExaminerReportModel.find({
            $and: [
                {
                    marked: false,
                },
            ],
        })
            .sort({ createdAt: -1 })
            .populate('examiner reportFiles.files projectId')

        //Reminder stats
        const newMappedData = findReports.filter((data, index) => {
            let pastDate = data.creationDate
                ? Moments(data.creationDate)
                : Moments(new Date())
            let days20 = data.creationDate
                ? currentDate.diff(pastDate, 'days')
                : 0
            if (days20 >= 60 && days20 <= 89) {
                return data
            }
        })

        //late stats
        const newMappedData2 = findReports.filter((data, index) => {
            let pastDate = data.creationDate
                ? Moments(data.creationDate)
                : Moments(new Date())
            let days20 = data.creationDate
                ? currentDate.diff(pastDate, 'days')
                : 0
            if (days20 > 90) {
                return data
            }
        })

        res.status(200).json({
            allreports: findAllReports,
            allreminders: newMappedData.length,
            latereports: newMappedData2.length,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//new structure
/** get reminders */
exports.getReportReminders = async (req, res, next) => {
    try {
        let currentDate = Moments(new Date())

        const findReports = await ExaminerReportModel.find({
            $and: [
                {
                    marked: false,
                },
            ],
        })
            .sort({ createdAt: -1 })
            .populate('examiner reportFiles.files projectId')

          

        //filter data
        const newMappedData = findReports.filter((data, index) => {
            let pastDate = data.creationDate
                ? Moments(data.creationDate)
                : Moments(new Date())
            let days20 = data.creationDate
                ? currentDate.diff(pastDate, 'days')
                : 0
            if (days20 >= 60 && days20 <= 89) {
                return data
            }
        })

        res.status(200).json({
            items: newMappedData,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** late reports */

exports.getLateReport = async (req, res, next) => {
    try {
        let currentDate = Moments(new Date())

        const findReports = await ExaminerReportModel.find({
            $and: [
                {
                    marked: false,
                },
            ],
        })
            .sort({ createdAt: -1 })
            .populate('examiner reportFiles.files projectId')

        //filter data
        const newMappedData = findReports.filter((data, index) => {
            let pastDate = data.creationDate
                ? Moments(data.creationDate)
                : Moments(new Date())
            let days20 = data.creationDate
                ? currentDate.diff(pastDate, 'days')
                : 0
            if (days20 > 90) {
                return data
            }
        })

        res.status(200).json({
            items: newMappedData,
        })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
