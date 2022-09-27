const mongoose = require('mongoose')
const PayModel = require('../models/payments')

exports.updatePayment = async (req, res, next) => {
    try {
        const { payStatus } = req.body
        const { payId } = req.params

        const getPayment = await PayModel.findById(payId).populate(
            'examiner project report'
        )
        if (!getPayment) {
            const error = new Error('Payment not found')
            error.statusCode = 404
            throw error
        }

        getPayment.payStatus = payStatus

        await getPayment.save()

        res.status(200).json('payment updated')
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//get single payment
exports.getIndividualPayment = async (req, res, next) => {
    try {
        const payId = req.params.payId
        const getPayment = await PayModel.findById(payId).populate(
            'examiner project report'
        )
        if (!getPayment) {
            const error = new Error('Payment not found')
            error.statusCode = 404
            throw error
        }

        res.status(200).json(getPayment)
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//get all payments
exports.getAllPayments = async (req, res, next) => {
    try {
        const getPayments = await PayModel.find().populate('examiner project report')

        res.status(200).json({ items: getPayments })
    } catch (error) {
        if (!error.statusCode) {
            error.statusCode = 500
        }
        next(error)
    }
}

//get paginated payments
exports.getPaginatedPayments = async (req, res, next) => {
    try {
        const { perPage, page } = req.body

        let currentPage

        if (page === undefined) {
            currentPage = 1
        } else {
            currentPage = page
        }

        let perPages = perPage || 8

        //total of all payments
        let overall_total = await PayModel.find().countDocuments()

        let getPayments = await PayModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .populate('examiner project report')

        let current_total = await PayModel.find()
            .sort({ createdAt: -1 })
            .skip((currentPage - 1) * perPages)
            .limit(perPages)
            .countDocuments()

        res.status(200).json({
            items: getPayments,
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
