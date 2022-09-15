const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
//const StudentModel = require('../models/students')
const ProjectFileModel = require('../models/projectFiles')
const ExaminerModel = require('../models/examiners')
const ExaminerReportModel = require('../models/examinerReports')

/** create Examiner From Project */
exports.createProjectExaminer = async (req, res, next) => {
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
            typeOfExaminer,
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

        /** destructure the payment Info of external */
        let paymentInfo = []
        if (typeOfExaminer === 'External') {
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

            if (preferredPayment === 'mobileMoney') {
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
        } else {
        }

        /** instance of an examiner */

        const examiner = new ExaminerModel({
            _id: mongoose.Types.ObjectId(),
            jobtitle,
            name,
            email,
            phoneNumber,
            postalAddress,
            countryOfResidence,
            placeOfWork,
            otherTitles,
            typeOfExaminer,
            paymentInfo,
        })

        const savedExaminer = await examiner.save()
        /** initialize examiner to save in project Model */
        let examinerToSave = {
            examinerId: savedExaminer._id,
            preferredPayment:
                typeOfExaminer === 'External' ? preferredPayment : '',
        }

        /** save the examiner general appointment File */
        if (examinerAppLetter !== null) {
            const file = new ProjectFileModel({
                _id: mongoose.Types.ObjectId(),
                fileName: examinerAppLetter.name,
                fileExtension: examinerAppLetter.ext,
                fileType: examinerAppLetter.fileType,
                fileSize: examinerAppLetter.fileSize,
                fileData: examinerAppLetter.buffer,
                description: 'General Appointment Letter',
            })

            let savedFile = await file.save()

            savedExaminer.generalAppointmentLetters = [
                ...savedExaminer.generalAppointmentLetters,
                {
                    fileId: savedFile._id,
                },
            ]
            await savedExaminer.save()
        } else {
        }

        /** save the examiner appointmentFile */
        if (projectAppLetter !== null) {
            const file = new ProjectFileModel({
                _id: mongoose.Types.ObjectId(),
                fileName: projectAppLetter.name,
                fileExtension: projectAppLetter.ext,
                fileType: projectAppLetter.fileType,
                fileSize: projectAppLetter.fileSize,
                fileData: projectAppLetter.buffer,
                description: 'Project Appointment Letter',
            })

            let savedFile = await file.save()

            examinerToSave.projectAppointmentLetter = savedFile._id
        } else {
        }

        /** save the examiner to the project itself */
        findProject.examiners = [...findProject.examiners, examinerToSave]

        await findProject.save()

        /**
         * instance of examiner Report since the examiner
         * is now assigned to Project
         * */

        const examinerReport = new ExaminerReportModel({
            _id: mongoose.Types.ObjectId(),
            projectId: findProject._id,
            examiner: savedExaminer._id,
            score: 0,
            reportStatus: 'pending',
        })

        let savedReport = await examinerReport.save()

        /** save the report detail to the project */
        findProject.examinerReports = [
            ...findProject.examinerReports,
            {
                reportId: savedReport._id,
            },
        ]

        await findProject.save()

        res.status(201).json('Examiner has been successfully assigned')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** assign Examiner From Project */
exports.assignExaminer = async (req, res, next) => {
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

        await items.find(async (element) => {
            /** find if the examiner is there */
            const findExaminer = await ExaminerModel.findById(element._id)

            if (!findExaminer) {
                const error = new Error('Examiner Not Found')
                error.statusCode = 404
                throw error
            }

            let examinerToSave = {
                examinerId: findExaminer._id,
            }

            if (findExaminer.typeOfExaminer === 'External') {
                if (findExaminer.paymentInfo.length > 0) {
                    examinerToSave.preferredPayment =
                        findExaminer.paymentInfo[0].preferredPayment
                }
            } else {
            }

            findProject.examiners = [...findProject.examiners, examinerToSave]
            await findProject.save()

            /**
             * instance of examiner Report since the examiner
             * is now assigned to Project
             * */

            const examinerReport = new ExaminerReportModel({
                _id: mongoose.Types.ObjectId(),
                projectId: findProject._id,
                examiner: findExaminer._id,
                score: 0,
                reportStatus: 'pending',
            })

            let savedReport = await examinerReport.save()

            /** save the report detail to the project */
            findProject.examinerReports = [
                ...findProject.examinerReports,
                {
                    reportId: savedReport._id,
                },
            ]

            await findProject.save()
        })

        res.status(201).json(
            `${
                items.length > 1 ? 'Examiners' : 'Examiner'
            }  has been successfully assigned`
        )
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

/** get all examiners */
exports.getAllExaminers = async (req, res, next) => {
    try {
        const findExaminers = await ExaminerModel.find()
        console.log(findExaminers, 'finnnnnn')
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
exports.getPaginatedExaminers = async (req, res, next) => {
    try {
        const { perPage, page } = req.body

        let currentPage

        if (page === undefined) {
            currentPage = page
        } else {
            currentPage = page
        }

        let perPages = perPage || 8

        let overall_total = await ExaminerModel.find().countDocuments()

        let getExaminers = await ExaminerModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .populate('generalAppointmentLetters.fileId')

        let current_total = await ExaminerModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .countDocuments()

        res.status(200).json({
            items: getExaminers,
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

exports.getIndividualExaminer = async (req, res, next) => {
    try {
        const id = req.params.id
        let getExaminer = await ExaminerModel.findById(id).populate(
            'generalAppointmentLetters.fileId'
        )
        console.log('examiner', getExaminer)

        if (!getExaminer) {
            const error = new Error('Examiner not found')
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
