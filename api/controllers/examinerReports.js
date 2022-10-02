const mongoose = require('mongoose')
const ExaminerReportModel = require('../models/examinerReports')
const ReportFileModel = require('../models/reportFiles')
const PaymentModel = require('../models/payments')

/** update ExaminerReport */
exports.updateExaminerReport = async (req, res, next) => {
    try {
        const reportId = req.params.rid
        console.log(req.file, 'req.files')

        const { score, remarks, ungraded, reportFile } = req.body

        const findReport = await ExaminerReportModel.findById(
            reportId
        ).populate('projectId examiner')

        if (!findReport) {
            const error = new Error('Report not found')
            error.statusCode = 404
            throw error
        }
        if (ungraded) {
            findReport.remarks = remarks
            findReport.ungraded = ungraded
            findReport.marked = ungraded && true
            findReport.reportStatus = ungraded && 'ungraded'

            await findReport.save()
        } else {
            findReport.score = score
            findReport.marked = score ? true : false
            findReport.reportStatus = score > 59 ? 'Passed' : 'failed'
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
            const saveFile = new ReportFileModel({
                _id: new mongoose.Types.ObjectId(),
                fileId: req.file.id,
                fileName: req.file.filename,
                fileExtension: req.file.mimetype,
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
