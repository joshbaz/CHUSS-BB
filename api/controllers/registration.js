const mongoose = require('mongoose')
const RegistrationModel = require('../models/registration')
const ProjectModel = require('../models/projects')
const multer = require('multer')
const io = require('../../socket')
let mongo = require('mongodb')
const { GridFsStorage } = require('multer-gridfs-storage')
var Grid = require('gridfs-stream')
require('dotenv').config()
const mongoUri = process.env.MONGO_R_URL
const path = require('path')
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

const storage = new GridFsStorage({
    url: mongoUri,
    options: {
        useUnifiedTopology: true,
    },
    file: (req, file) => {
        return new Promise((resolve, reject) => {
            crypto.randomBytes(16, (err, buf) => {
                if (err) {
                    return reject(err)
                }
                const filename =
                    buf.toString('hex') + path.extname(file.originalname)
                const filesExtenstions = path.extname(file.originalname)
                const extractNameOnly = path.basename(
                    file.originalname,
                    filesExtenstions
                )
                const fileInfo = {
                    filename: filename,
                    bucketName: 'chussfiles',
                    filesExtensions: filesExtenstions,
                    metadata: {
                        name: extractNameOnly,
                    },
                }
                resolve(fileInfo)
            })
        })
    },
})

const store = multer({
    storage: storage,
    // fileFilter: function (req, file, cb) {
    //     checkFileType(file, cb)
    // },
})
{
    /** Add registration */
}
exports.addRegistration = async (req, res, next) => {
    try {
        const { regDate, regType, semester, academicYear } = req.body
        const projectId = req.params.pid
        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        console.log(findProject, 'regs')

        const registration = new RegistrationModel({
            _id: new mongoose.Types.ObjectId(),
            registrationtype: regType,
            date: regDate,
            semester: semester,
            academicYear,
        })

        const saveRegistration = await registration.save()

        if (req.files) {
            for (let iteration = 0; iteration < req.files.length; iteration++) {
                const filesExtenstions = path
                    .extname(req.files[iteration].originalname)
                    .slice(1)
                saveRegistration.registrationfile = {
                    fileId: req.files[iteration].id,
                    fileName: req.files[iteration].metadata.name,
                    fileExtension: filesExtenstions,
                    fileType: req.files[iteration].mimetype,
                    fileSize: req.files[iteration].size,
                    description: 'registration',
                }

                let newsaved = await saveRegistration.save()
                let savePRegister = {
                    registrationId: newsaved._id,
                }

                findProject.registration = [
                    ...findProject.registration,
                    savePRegister,
                ]
                await findProject.save()
            }
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })

            res.status(200).json('registration created successfully')
        } else {
            console.log('we have no files')
            let savePRegister = {
                registrationId: saveRegistration._id,
            }
            findProject.registration = [
                ...findProject.registration,
                savePRegister,
            ]

            await findProject.save()
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })

            res.status(200).json('registration created successfully')
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

{
    /** remove registration */
}
exports.removeRegistration = async (req, res, next) => {
    try {
        const projectId = req.params.pid
        const registrationId = req.params.rid

        const findProject = await ProjectModel.findById(projectId)
        if (!findProject) {
            const error = new Error('Project not found!')
            error.statusCode = 404
            throw error
        }

        console.log('found project')

        const findRegistration = await RegistrationModel.findById(
            registrationId
        )
        if (!findRegistration) {
            const error = new Error('Registration not found!')
            error.statusCode = 404
            throw error
        }

        console.log('found registration')

        let ProjectRegistration = [...findProject.registration]

        let newProjectRegistration = ProjectRegistration.filter((data) => {
            if (
                findRegistration._id.toString() !==
                data.registrationId.toString()
            ) {
                return data
            } else {
                console.log('nfound one')
                return
            }
        })

        console.log('removed registration')

        findProject.registration = newProjectRegistration

        await findProject.save()

        console.log(
            'filedId registration',
            findRegistration.registrationfile.fileId
        )

        if (findRegistration.registrationfile.fileId) {
            const initFileId = findRegistration.registrationfile.fileId
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

                    await RegistrationModel.findByIdAndDelete(registrationId)
                    console.log('registration finally deleted registration')
                    io.getIO().emit('updatestudent', {
                        actions: 'update-student',
                        data: findProject._id.toString(),
                    })
                    res.status(200).json(`Registration has been deleted`)
                    //res.status(200).end()
                    return
                })

                //    let checkData = await gfs.files
                //        .find({ _id: newFileId })
                //        .toArray((err, files) => {
                //            console.log('files', files)
                //        })

                // await gfs.files.deleteOne(
                //     { _id: newFileId },
                //     (err, results) => {
                //         if (err) {
                //             console.log('error file registration')
                //             return res.status(400).json('failed to delete file')
                //         }
                //         console.log('file deletion registration', results)
                //         return
                //     }
                // )
            }
        } else {
            await RegistrationModel.findByIdAndDelete(registrationId)
            console.log('not allowed registration finally deleted registration')
            io.getIO().emit('updatestudent', {
                actions: 'update-student',
                data: findProject._id.toString(),
            })
            res.status(200).json(`Registration has been deleted`)
        }
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
{
    /** get all registration */
}
exports.getAllRegistration = async (req, res, next) => {
    try {
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

{
    /** get single registration */
}
exports.getSingleRegistration = async (req, res, next) => {
    try {
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

{
    /** update registration */
}
exports.updateRegistration = async (req, res, next) => {
    try {
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}
