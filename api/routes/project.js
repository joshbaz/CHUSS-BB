const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')

const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')

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

// function checkFileType(file, cb) {
//     const filetypes = /pdf|jpg|png|gif/
//     const extname = filetypes.test(
//         path.extname(file.originalname).toLowerCase()
//     )
//     const mimetype = filetypes.test(file.mimetype)
//     if (mimetype && extname) return cb(null, true)
//     cb('filetype')
// }

const uploadMiddleware = (req, res, next) => {
    const upload = store.array('projectFiles')

    upload(req, res, function (err) {
      //  console.log('we are here')
        if (err instanceof multer.MulterError) {
            return res.status(400).send('File too large')
        } else if (err) {
            if (err === 'filetype')
                return res.status(400).send('Documents only')
            return res.sendStatus(500)
        }
        next()
    })
}

router.post('/v1/create', uploadMiddleware, projectController.createProject)

router.patch(
    '/v1/update/:id',
    uploadMiddleware,
    projectController.updateProject
)
/** project status update */
router.put('/vl/status/update/:id', projectController.updateProjectStatus)

router.get('/vl/pprojects', projectController.getPaginatedProjects)

router.get('/v1/projects/:id', projectController.getIndividualProjects)

/** get all projects */
router.get('/v1/allprojects', projectController.getAllProjects)

/** final submission */
router.put(
    '/v1/finalsubmission/update/:id',
    uploadMiddleware,
    projectController.putFinalSubmissionFiles
)

/** candidate files */
router.put(
    '/v1/candidatefiles/update/:id',
    uploadMiddleware,
    projectController.putCandidateFiles
)

/** viva files */
router.put(
    '/v1/vivafiles/update/:id',
    uploadMiddleware,
    projectController.putVivaFiles
)
/** remove files */
/** remove candidate files */
router.delete(
    '/v1/remove/cfiles/:pid/:fid/:secId',
    projectController.removeCandidateFile
)
/** remove viva files */
router.delete(
    '/v1/remove/vfiles/:pid/:fid/:secId',
    projectController.removePVivaFile
)

/** remove submission files */
router.delete(
    '/v1/remove/sfiles/:pid/:fid/:secId',
    projectController.removePFSubmissionFile
)
/** viva defense */
router.put('/v1/vivadefense/update/:id', projectController.updateVivaDefense)

/** date of final submission */
router.put(
    '/v1/dateofsubmission/update/:id',
    projectController.updateDateOfFinalSubmission
)

/** date of final submission */
router.put(
    '/v1/graduation/update/:id',
    projectController.updateDateOfGraduation
)

/** date of final submission */
router.patch(
    '/v1/resubmission/update/:id',
    projectController.updateResubmission
)

/** delete student */
router.delete('/v1/student/remove/:pid', projectController.deleteProject)

//DeleteFiles
const deleteFile = (id) => {
    if (!id || id === 'undefined') return res.status(400).send('no file found')
    const _id = new mongoose.Types.ObjectId(id)
    gfs.delete(_id, (err) => {
        if (err) return res.status(500).send('File deletion error')
    })
}

router.get('/files/:id', (req, res) => {
    const id = req.params.id
    if (!id || id === 'undefined') return res.status(400).send('no file found')
    const _id = new mongoose.Types.ObjectId(id)
    gfs.find({ _id }).toArray((err, files) => {
        if (!files || files.length === 0)
            return res.status(400).send('no files exists')
        gfs.openDownloadStream(_id).pipe(res)
    })
})

module.exports = router
