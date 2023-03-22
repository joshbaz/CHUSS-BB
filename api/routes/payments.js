const express = require('express')
const router = express.Router()
const PaymentController = require('../controllers/payments')
const isAuth = require('../middleware/is-auth')
router.patch('/v1/update/:payId', isAuth, PaymentController.updatePayment)

router.get('/v1/getpayments', isAuth, PaymentController.getAllPayments)

router.get('/v1/paginated/:perPage/:page', isAuth, PaymentController.getPaginatedPayments)

router.get(
    '/v1/individual/:payId',
    isAuth,
    PaymentController.getIndividualPayment
)

module.exports = router
