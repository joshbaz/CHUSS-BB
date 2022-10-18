const mongoose = require('mongoose')
const ProjectModel = require('../models/projects')
//const StudentModel = require('../models/students')
const ProjectFileModel = require('../models/projectFiles')
const OpponentModel = require('../models/opponents')

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
            _id: mongoose.Types.ObjectId(),
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
                        _id: mongoose.Types.ObjectId(),
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
            if (titerations === items.length) {
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
