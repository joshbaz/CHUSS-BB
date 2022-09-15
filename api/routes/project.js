const express = require('express')
const router = express.Router()
const projectController = require('../controllers/project')
const multer = require('multer')
const GridFsStorage = require('multer-gridfs-storage')
const gridStream = require('gridfs-stream')
const path = require('path')
const crypto = require('crypto')
const mongoose = require('mongoose')

require('dotenv').config()
const mongoUri = process.env.MONGO_L_URL

const conn = mongoose.createConnection(mongoUri, {
    useNewUrlParser: true,
    useUnifiedTopology: true,
})

let gfs

conn.once('open', () => {
    gfs = new mongoose.mongo.GridFSBucket(conn.db, {
        bucketName: 'projectFiless',
    })
})

// const storage = new GridFsStorage({
//     url: mongoUri,
//     options: {
//         useUnifiedTopology: true
//     },
//     file:(req, file)=>{
//         return new Promise((resolve, reject)=>{
//             crypto.randomBytes()
//         })
//     }
// })

router.post('/v1/create', projectController.createProject)

router.get('/vl/pprojects', projectController.getPaginatedProjects)

router.get('/v1/projects/:id', projectController.getIndividualProjects)

module.exports = router
