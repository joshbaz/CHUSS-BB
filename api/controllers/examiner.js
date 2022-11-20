const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
//const StudentModel = require('../models/students')
const ProjectFileModel = require('../models/projectFiles')
const ExaminerModel = require('../models/examiners')
const ExaminerReportModel = require('../models/examinerReports')
const path = require('path')
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
        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                //scanned Form
                if (
                    req.files[iteration].metadata.name === 'examinerAppLetter'
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
                        description: 'examinerAppLetter',
                    })

                    let savedFiles = await saveFile.save()

                    savedExaminer.generalAppointmentLetters = [
                        ...savedExaminer.generalAppointmentLetters,
                        {
                            fileId: savedFiles._id,
                        },
                    ]
                    examinerToSave.generalAppointmentLetters = savedFiles._id

                    await savedExaminer.save()
                }

                //thesisfile
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

                    examinerToSave.projectAppointmentLetter = savedFiles._id
                }
            }
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

        // await items.map(async (element) => {
        //     /** find if the examiner is there */
        //     const findExaminer = await ExaminerModel.findById(element._id)

        //     if (!findExaminer) {
        //         const error = new Error('Examiner Not Found')
        //         error.statusCode = 404
        //         throw error
        //     }

        //     let examinerToSave = {
        //         examinerId: findExaminer._id,
        //     }

        //     if (findExaminer.typeOfExaminer === 'External') {
        //         if (findExaminer.paymentInfo.length > 0) {
        //             examinerToSave.preferredPayment =
        //                 findExaminer.paymentInfo[0].preferredPayment
        //         }
        //     } else {
        //     }

        //     findProject.examiners = [...findProject.examiners, examinerToSave]
        //     await findProject.save()

        //     /**
        //      * instance of examiner Report since the examiner
        //      * is now assigned to Project
        //      * */

        //     const examinerReport = new ExaminerReportModel({
        //         _id: mongoose.Types.ObjectId(),
        //         projectId: findProject._id,
        //         examiner: findExaminer._id,
        //         score: 0,
        //         reportStatus: 'pending',
        //     })

        //     let savedReport = await examinerReport.save()

        //     /** save the report detail to the project */
        //     findProject.examinerReports = [
        //         ...findProject.examinerReports,
        //         {
        //             reportId: savedReport._id,
        //         },
        //     ]

        //     await findProject.save()
        // })

        for (let iteration = 0; iteration < items.length; iteration++) {
            let titerations = iteration + 1

            /** find if the examiner is there */
            const findExaminer = await ExaminerModel.findById(
                items[iteration]._id
            )

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
            if (titerations === items.length) {
                res.status(201).json(
                    `${
                        items.length > 1 ? 'Examiners' : 'Examiner'
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

/** get all examiners */
exports.getAllExaminers = async (req, res, next) => {
    try {
        let overall_total = await ExaminerModel.find().countDocuments()
        const findExaminers = await ExaminerModel.find()
        console.log(findExaminers, 'finnnnnn')
        res.status(200).json({
            items: findExaminers,
            overall_total,
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
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8
        console.log('perPages', perPages)
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

        let newArray = [...getExaminers]

        for (let i = 0; i < newArray.length; i++) {
            let iterations = i + 1
            const findProjectCount = await ProjectModel.find({
                'examiners.examinerId': newArray[i]._id,
            }).countDocuments()

            newArray[i].studentsNo = findProjectCount
            console.log('newArray', newArray)

            if (iterations === getExaminers.length) {
                res.status(200).json({
                    items: newArray,
                    overall_total,
                    currentPage,
                    perPage: perPages,
                    current_total,
                })
            }
        }
        // await getExaminers.forEach(async (data, index) => {
        //     const findProjectCount = await ProjectModel.find({
        //         'examiners.examinerId': data._id,
        //     }).countDocuments()

        //     data.studentsNo = findProjectCount
        // })

        // res.status(200).json({
        //     items: getExaminers,
        //     overall_total,
        //     currentPage,
        //     perPage: perPages,
        //     current_total,
        // })
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

/**
 * gets students
 * who have /being marked by examiner
 */

exports.getStudentsByExaminer = async (req, res, next) => {
    try {
        const examinerId = req.params.e_id

        const { perPage, page } = req.body

        let currentPage

        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8
        console.log('perPages', perPages)

        const overall_total = await ProjectModel.find({
            'examiners.examinerId': examinerId,
        }).countDocuments()

        const getProjects = await ProjectModel.find({
            'examiners.examinerId': examinerId,
        })
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .populate(
                'student examiners.examinerId examiners.projectAppointmentLetter examinerReports.reportId files.fileId'
            )

        let current_total = await ProjectModel.find({
            'examiners.examinerId': examinerId,
        })
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

/** Main examiners */
/** create Examiner From Examiners */
exports.createExaminer = async (req, res, next) => {
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
        } = req.body

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
            preferredPayment,
        })

        const savedExaminer = await examiner.save()

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

        res.status(201).json('Examiner has been successfully created')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//update examiner from examiners
exports.updateExaminer = async (req, res, next) => {
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
            AccountName,
            AccountNumber,
            swift_bicCode,
            bankCode,
            branchCode,
            bankAddress,
            bankCity,
            examinerAppLetter,
        } = req.body

        let examinerId = req.params.id

        const getExaminer = await ExaminerModel.findById(examinerId)
        console.log('exam', getExaminer)
        if (!getExaminer) {
            const error = new Error('Examiner not found')
            error.statusCode = 404
            throw error
        }

        /** destructure the payment Info of external */
        let paymentInfo = [...getExaminer.paymentInfo]
        console.log('paymentInfo', paymentInfo)
        if (typeOfExaminer === 'External') {
            if (getExaminer.paymentInfo.length > 0) {
                if (preferredPayment === 'mobileMoney') {
                    console.log('reached here')
                    for (
                        let iteration = 0;
                        iteration < paymentInfo.length;
                        iteration++
                    ) {
                        let totalIteration = iteration + 1
                        console.log('made it', totalIteration)
                        if (
                            preferredPayment ===
                            paymentInfo[iteration].preferredPayment
                        ) {
                            console.log('made it')
                            paymentInfo[iteration].mobileOperator =
                                mobileOperator
                            paymentInfo[iteration].mobileSubscriberName =
                                mobileSubscriberName
                            paymentInfo[iteration].mobileNumber = mobileNumber

                            getExaminer.paymentInfo = paymentInfo
                            await getExaminer.save()
                        }
                        if (
                            totalIteration === paymentInfo.length &&
                            preferredPayment !==
                                paymentInfo[iteration].preferredPayment
                        ) {
                            paymentInfo = [
                                ...paymentInfo,
                                {
                                    preferredPayment,
                                    mobileOperator,
                                    mobileSubscriberName,
                                    mobileNumber,
                                },
                            ]

                            getExaminer.paymentInfo = paymentInfo

                            await getExaminer.save()
                        }
                    }
                } else {
                }
                /** bank transfer */
                if (
                    preferredPayment === 'Bank Transfer/Money Transfer /SWIFT'
                ) {
                    for (
                        let iteration = 0;
                        iteration < paymentInfo.length;
                        iteration++
                    ) {
                        let totalIteration = iteration + 1
                        if (
                            preferredPayment ===
                            paymentInfo[iteration].preferredPayment
                        ) {
                            paymentInfo[iteration].bank = bank
                            paymentInfo[iteration].AccountName = AccountName
                            paymentInfo[iteration].AccountNumber = AccountNumber
                            paymentInfo[iteration].swift_bicCode = swift_bicCode
                            paymentInfo[iteration].bankCode = bankCode
                            paymentInfo[iteration].branchCode = branchCode
                            paymentInfo[iteration].bankAddress = bankAddress
                            paymentInfo[iteration].bankCity = bankCity
                            getExaminer.paymentInfo = paymentInfo

                            await getExaminer.save()
                        }
                        if (
                            totalIteration === paymentInfo.length &&
                            preferredPayment !==
                                paymentInfo[iteration].preferredPayment
                        ) {
                            paymentInfo.push({
                                preferredPayment,
                                bank,
                                AccountName,
                                AccountNumber,
                                swift_bicCode,
                                bankCode,
                                branchCode,
                                bankAddress,
                                bankCity,
                            })

                            getExaminer.paymentInfo = paymentInfo

                            await getExaminer.save()
                        }
                    }
                }
            } else {
                if (preferredPayment === 'mobileMoney') {
                    paymentInfo = [
                        {
                            preferredPayment,
                            mobileOperator,
                            mobileSubscriberName,
                            mobileNumber,
                        },
                    ]

                    getExaminer.paymentInfo = paymentInfo
                    await getExaminer.save()
                }

                if (
                    preferredPayment === 'Bank Transfer/Money Transfer /SWIFT'
                ) {
                    paymentInfo = [
                        {
                            preferredPayment,
                            bank,
                            AccountName,
                            AccountNumber,
                            swift_bicCode,
                            bankCode,
                            branchCode,
                            bankAddress,
                            bankCity,
                        },
                    ]

                    getExaminer.paymentInfo = paymentInfo
                    await getExaminer.save()
                }
            }
        } else {
        }

        /** instance of an examiner */

        getExaminer.jobtitle = jobtitle
        getExaminer.name = name
        getExaminer.email = email
        getExaminer.phoneNumber = phoneNumber
        getExaminer.postalAddress = postalAddress
        getExaminer.countryOfResidence = countryOfResidence
        getExaminer.placeOfWork = placeOfWork
        getExaminer.otherTitles = otherTitles
        getExaminer.typeOfExaminer = typeOfExaminer
        getExaminer.preferredPayment = preferredPayment
        console.log('made jump it')
        await getExaminer.save()

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

            getExaminer.generalAppointmentLetters = [
                ...getExaminer.generalAppointmentLetters,
                {
                    fileId: savedFile._id,
                },
            ]
            await getExaminer.save()
        } else {
        }

        res.status(201).json('Examiner has been successfully updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
