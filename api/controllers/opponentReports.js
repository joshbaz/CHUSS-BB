const mongoose = require('mongoose')
const OpponentReportModel = require('../models/opponentReports')
const ReportFileModel = require('../models/reportFiles')
const PaymentModel = require('../models/payments')
const path = require('path')
let mongo = require('mongodb')
var Grid = require('gridfs-stream')
const Moments = require('moment-timezone')
const io = require('../../socket')

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
exports.updateOpponentReport = async (req, res, next) => {
    try {
        const reportId = req.params.rid
       // console.log(req.file, 'req.files')

        //const { score, remarks, ungraded, reportFile } = req.body

        const findReport = await OpponentReportModel.findById(
            reportId
        ).populate('projectId opponent reportFiles.files')

        if (!findReport) {
            const error = new Error('Report not found')
            error.statusCode = 404
            throw error
        }

        const submissionDate = Moments().tz('Africa/Kampala').format()
        findReport.marked = true
        findReport.reportStatus = 'Passed'
        findReport.submissionDate = submissionDate
        await findReport.save()

        const payment = new PaymentModel({
            _id: new mongoose.Types.ObjectId(),
            student: findReport.projectId.student,
            proposedFee: findReport.projectId.proposedFee,
            opponent: findReport.opponent._id,
            project: findReport.projectId._id,
            opponentReport: findReport._id,
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

        if (req.file) {
            const filesExtenstions = path
                .extname(req.file.originalname)
                .slice(1)
            const saveFile = new ReportFileModel({
                _id: new mongoose.Types.ObjectId(),
                fileId: req.file.id,
                fileName: req.file.metadata.name,
                fileExtension: filesExtenstions,
                fileType: req.file.mimetype,
                fileSize: req.file.size,

                description: 'Report File',
            })

            let savedFiles = await saveFile.save()
            findReport.reportFiles = [{ files: savedFiles._id }]
            await findReport.save()
        } else {
        }
        io.getIO().emit('updatestudent', {
            actions: 'update-student',
            data: findReport.projectId._id.toString(),
        })

        io.getIO().emit('updatereport', {
            actions: 'update-report',
            data: findReport._id.toString(),
        })
        res.status(200).json('updated opponent report')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get ExaminerReport */
exports.getOpponentReport = async (req, res, next) => {
    try {
        const reportId = req.params.rid

        const findReport = await OpponentReportModel.findById(
            reportId
        ).populate('opponent reportFiles.files')

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

/** all opponent files */
exports.getAllOpponentReports = async (req, res, next) => {
    try {
        let overall_total = await OpponentReportModel.find().countDocuments()
        const findReports = await OpponentReportModel.find()
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
exports.removeOpponentReportFile = async (req, res, next) => {
    try {
        const reportId = req.params.rpid
        const fileId = req.params.fid
        const secId = req.params.secId

        const findReports = await OpponentReportModel.findById(reportId)
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
                  //  console.log('registration finally deleted registration')

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
            res.status(200).json(`File has been deleted`)
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
