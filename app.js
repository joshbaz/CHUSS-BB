const express = require('express')
const cors = require('cors')
const mongoose = require('mongoose')
const socketio = require('socket.io')
const bodyparser = require('body-parser')
const jwt = require('jsonwebtoken')
const AdminModel = require('./api/models/administrator')
const cron = require('node-cron')

const app = express()

require('dotenv').config()
//import routes
const adminRoutes = require('./api/routes/administrator')
const projectRoutes = require('./api/routes/project')
const examinerRoutes = require('./api/routes/examiner')
const tagRoutes = require('./api/routes/tags')
const preferenceRoutes = require('./api/routes/preferences')
const reportRoutes = require('./api/routes/examinerReports')
const paymentRoutes = require('./api/routes/payments')
const documentRoutes = require('./api/routes/documents')
const opponentRoutes = require('./api/routes/opponent')
const opponentReportRoutes = require('./api/routes/opponentReports')
const supervisorRoutes = require('./api/routes/supervisors')
const doctoralMemberRoutes = require('./api/routes/doctoralmembers')
const schoolRoutes = require('./api/routes/schools')
const departmentRoutes = require('./api/routes/schoolDepartments')
const registrationRoutes = require('./api/routes/registration')
//apply middleware
app.use(cors())
app.use(bodyparser.json())
app.use(bodyparser.urlencoded({ extended: true }))

app.use((req, res, next) => {
    res.setHeader('Access-Control-Allow-Origin', '*')
    res.setHeader(
        'Access-Control-Allow-Headers',
        'Origin, A-Requested-Width, Content-Type, Accept, Authorization'
    )

    if (req.method === 'OPTIONS') {
        res.setHeader(
            'Access-Control-Allow-Methods',
            'PUT',
            'PATCH',
            'POST',
            'DELETE',
            'GET'
        )
        return res.status(200).json({})
    }
    next()
})

/** starter page */
app.get('/', (req, res, next) => {
    res.send('RUNNING THE SERVER')
})

//routes attachment to express app
app.use('/admin', adminRoutes)
app.use('/project', projectRoutes)
app.use('/examiner', examinerRoutes)
app.use('/tags', tagRoutes)
app.use('/preferences', preferenceRoutes)
app.use('/reports', reportRoutes)
app.use('/payments', paymentRoutes)
app.use('/docs', documentRoutes)
app.use('/opponent', opponentRoutes)
app.use('/opponentreports', opponentReportRoutes)
app.use('/supervisor', supervisorRoutes)
app.use('/doctoralmember', doctoralMemberRoutes)
app.use('/school', schoolRoutes)
app.use('/department', departmentRoutes)
app.use('/registration', registrationRoutes)
/** global error handling */
app.use((error, req, res, next) => {
    const status = error.statusCode || 500
    const message = error.message
    const data = error.data

    res.status(status).json(message)
})

//apply database
mongoose.Promise = require('bluebird')

mongoose
    .connect(process.env.MONGO_R_URL, {
        useNewUrlParser: true,
        useUnifiedTopology: true,
    })
    .then((result) => {
        //run on port
        const port = process.env.PORT || 8000

        const server = app.listen(port)

        if (server) {
            console.log('successfully running on port:', port)
            console.log('connected to database:', result.connections[0].name)
            const io = require('./socket').init(server, {
                origins: ['*'],
            })

            //   const io = require('./socket').init(server, {
            //       allowRequest: (req, callback) => {
            //           const noOriginHeader = req.headers.origin === undefined
            //           callback(null, noOriginHeader)
            //       },
            //   })

            io.on('connection', async (socket) => {
                console.log('client connected')
                //  console.log('client connected', socket.handshake.auth.token)
                let token = socket.handshake.auth.token
                let decodedToken = token
                    ? jwt.verify(token, process.env.SECRET, {
                          ignoreExpiration: true,
                      })
                    : null

                if (decodedToken) {
                    const findAdmin = await AdminModel.findById(
                        decodedToken.userId
                    )
                    if (findAdmin) {
                        findAdmin.status = 'online'
                        await findAdmin.save()
                    }
                } else {
                }

                socket.on('disconnect', async () => {
                    console.log('user disconnected')

                    if (decodedToken) {
                        const findAdmin = await AdminModel.findById(
                            decodedToken.userId
                        )
                        if (findAdmin) {
                            findAdmin.status = 'offline'
                            await findAdmin.save()
                        }
                    } else {
                    }
                })
            })
        } else {
            console.log('failed to run ', port)
        }
    })
    .catch(() => {
        console.log('connection to db failed')
    })

//scheduling emails

// cron.schedule(
//     '30 12 * * 1-6',
//     async () => {
//         console.log('running this every day')
//         const nodemailer = require('nodemailer')
//         const Moments = require('moment-timezone')
//         const fs = require('fs')
//         const hogan = require('hogan.js')
//         const transporter = nodemailer.createTransport({
//             service: 'gmail',

//             secure: true,
//             auth: {
//                 user: 'joshuakimbareeba@gmail.com',
//                 pass: 'svjsvtpetnehqqsn',
//             },
//         })

//         const ExaminerReportModel = require('./api/models/examinerReports')
//         const StudentModel = require('./api/models/students')

//         const findReports = await ExaminerReportModel.find({
//             $and: [
//                 {
//                     marked: false,
//                 },
//                 {
//                     SubmissionReminder: false,
//                 },
//             ],
//         })
//             .sort({
//                 createdAt: -1,
//             })
//             .populate('examiner reportFiles.files projectId')

//        // console.log('find reports', findReports)
//         let currentDate = Moments(new Date())

//         const newMappedData = findReports.filter((data, index) => {
//             let pastDate = data.creationDate
//                 ? Moments(data.creationDate)
//                 : Moments(new Date())

//             let days20 = data.creationDate
//                 ? currentDate.diff(pastDate, 'days')
//                 : 0
//             if (days20 >= 60 && days20 <= 89) {
//                 return data
//             } 
//         })

//         //console.log('lookin for mappedDta', newMappedData)

//         let template = fs.readFileSync('./emailReminder.hjs', 'utf-8')
//         let compiledTemplate = hogan.compile(template)

//         for (let iteration = 0; iteration < newMappedData.length; iteration++) {
//             const findIndividualReport = await ExaminerReportModel.findById({
//                 _id: newMappedData[iteration]._id,
//             }).populate('examiner reportFiles.files projectId')

//             if (!findIndividualReport) {
//                 continue
//             }

//             const findIndividualStudent = await StudentModel.findById({
//                 _id: findIndividualReport.projectId.student,
//             })
//             if (!findIndividualStudent) {
//                 continue
//             }
//             // console.log(
//             //     'Report',
//             //     iteration,
//             //     findIndividualReport.examiner.email
//             // )
//             // console.log(
//             //     'Individual',
//             //     iteration,
//             //     findIndividualStudent.studentName
//             // )

//             let mailOptions = {
//                 from: 'joshuakimbareeba@gmail.com',
//                 to: 'joshuakimbareeba@gmail.com',
//                 // cc:"zsekito@gmail.com",
//                 subject: 'Reminder For Examiner Report Submission.',
//                 html: compiledTemplate.render({
//                     title: '',
//                     firstName: '',
//                     student: findIndividualStudent.studentName,
//                 }),
//             }
//             transporter.sendMail(mailOptions, async (error, info) => {
//                 if (error) {
//                     console.log(error)
//                 } else {
//                     console.log('email sent: ' + info.response)
//                     findIndividualReport.SubmissionReminder = true
//                     findIndividualReport.SubmissionReminderDate = currentDate
//                     await findIndividualReport.save()

//                 }
//             })
//         }
//     },
//     {
//         timezone: 'Africa/Kampala',
//     }
// )
