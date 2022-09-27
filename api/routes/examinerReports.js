const express = require('express')
const router = express.Router()
const examinerReport = require('../controllers/examinerReports')
router.patch('/v1/update/:rid', examinerReport.updateExaminerReport)
router.get('/v1/getReport/:rid', examinerReport.getExaminerReport)
module.exports = router
