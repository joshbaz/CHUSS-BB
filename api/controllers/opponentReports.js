const mongoose = require('mongoose')
const OpponentReportModel = require('../models/opponentReports')
const ReportFileModel = require('../models/reportFiles')
const PaymentModel = require('../models/payments')
const path = require('path')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')
const crypto = require('crypto')

require('dotenv').config()
const mongoUri = process.env.MONGO_R_URL

const conn = mongoose.createConnection(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

let gfs

conn.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'chussfiles',
    })
})

const deleteFile = async (id) => {
    if (!id || id === 'undefined') return res.status(400).send('no file found')
    const _id = new mongoose.Types.ObjectId(id)
    await gfs.delete(_id, (err) => {
        if (err) {
            return 'error'
        } else {
            return 'success'
        }
    })
}
/** update ExaminerReport */
exports.updateOpponentReport = async (req, res, next) => {
    try {
        const reportId = req.params.rid
        console.log(req.file, 'req.files')

        const { score, remarks, ungraded, reportFile } = req.body

        const findReport = await OpponentReportModel.findById(
            reportId
        ).populate('projectId opponent reportFiles.files')

        if (!findReport) {
            const error = new Error('Report not found')
            error.statusCode = 404
            throw error
        }

        findReport.score = score
        findReport.marked = score ? true : false
        findReport.reportStatus = score > 59 ? 'Passed' : 'failed'
        await findReport.save()

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

        if (req.file) {
            if (findReport.reportFiles.length > 0) {
                const performDeleteFile = deleteFile(
                    findReport.reportFiles[0].files.fileId
                )

                if (performDeleteFile === 'success') {
                    await ReportFileModel.deleteOne({
                        _id: findReport.reportFiles[0].files._id,
                    })
                    const filesExtenstions = path
                        .extname(req.file.originalname)
                        .slice(1)
                    const saveFile = new ReportFileModel({
                        _id: new mongoose.Types.ObjectId(),
                        fileId: req.files.id,
                        fileName: req.files.metadata.name,
                        fileExtension: filesExtenstions,
                        fileType: req.files.mimetype,
                        fileSize: req.files.size,

                        description: 'Report File',
                    })

                    let savedFiles = await saveFile.save()
                    findReport.reportFiles = [{ files: savedFiles._id }]
                    await findReport.save()
                } else {
                }
            } else {
                const filesExtenstions = path
                    .extname(req.file.originalname)
                    .slice(1)
                const saveFile = new ReportFileModel({
                    _id: new mongoose.Types.ObjectId(),
                    fileId: req.files.id,
                    fileName: req.files.metadata.name,
                    fileExtension: filesExtenstions,
                    fileType: req.files.mimetype,
                    fileSize: req.files.size,

                    description: 'Report File',
                })

                let savedFiles = await saveFile.save()
                findReport.reportFiles = [{ files: savedFiles._id }]
                await findReport.save()
            }

            
        } else {
        }

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
