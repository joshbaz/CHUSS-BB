const express = require('express')
const router = express.Router()
const examinerController = require('../controllers/examiner')
const multer = require('multer')
const { GridFsStorage } = require('multer-gridfs-storage')

const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')

const isAuth = require('../middleware/is-auth')
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
    // console.log('upload', upload)
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
router.post(
    '/v1/project/create/:pid',
    isAuth,
    uploadMiddleware,
    examinerController.createProjectExaminer
)

router.post(
    '/v1/project/assign/:pid',
    isAuth,
    examinerController.assignExaminer
)

/** get all examiners */
router.get('/v1/getall', 
isAuth, 
examinerController.getAllExaminers)

/** get individual examiners */
router.get(
    '/v1/individual/:id',
     isAuth,
    examinerController.getIndividualExaminer
)

/** create examiners */
router.post(
    '/v1/create',
    isAuth,
    uploadMiddleware,
    examinerController.createExaminer
)

/** get paginated examiners */
router.get(
    '/v1/pexaminers/:perPage/:page',
    isAuth,
    examinerController.getPaginatedExaminers
)

/** get students by examiners */
router.get(
    '/v1/students/:e_id',
    isAuth,
    examinerController.getStudentsByExaminer
)

/** update examiners */
router.patch(
    '/v1/update/:id',
    isAuth,
    uploadMiddleware,
    examinerController.updateExaminer
)

/** delete project App letter */
router.patch(
    '/v1/letter/projectexaminer/delete/:pid/:fid',
    isAuth,
    examinerController.deleteProjectAppLetter
)

router.patch(
    '/v1/letter/projectexaminer/add/:pid/:eid',
    isAuth,
    uploadMiddleware,
    examinerController.createProjectAppExaminerFile
)

router.patch(
    '/v1/projectexaminers/remove/:pid/:eid/:secid',
    isAuth,
    examinerController.removeProjectExaminersR
)

router.delete(
    '/v1/examiners/remove/:eid',
    isAuth,
    examinerController.deleteExaminer
)

router.delete(
    '/v1/examiners/files/removes/:eid/:fid',
    isAuth,
    examinerController.deleteExFiles
)

// router.post('/v1/trial', upload.single('myfiles'), (req, res) => {
//     res.json({ file: req.file, text: req.body.type })
// })

module.exports = router
