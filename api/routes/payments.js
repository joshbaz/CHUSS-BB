const express = require('express')
const router = express.Router()
const PaymentController = require('../controllers/payments')
router.patch('/v1/update/:payId', PaymentController.updatePayment)

router.get('/v1/getpayments', PaymentController.getAllPayments)

router.get('/v1/paginated', PaymentController.getPaginatedPayments)

router.get('/v1/individual/:payId', PaymentController.getIndividualPayment) 

module.exports = router
