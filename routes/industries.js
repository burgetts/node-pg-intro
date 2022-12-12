const express = require('express')
const router = new express.Router()
const db = require('../db')
const ExpressError = require('../expressError')

// Add an industry
router.post('/', async (req, res, next) => {
    try {
        let {code, industry} = req.body
        let resp = await db.query(`INSERT INTO industries (code, industry) VALUES ($1, $2) RETURNING code, industry`, [code, industry])
        res.json({industry: resp.rows[0]})
    } catch (err) {
        next(err)
    }
})

// Associate company with industry
router.post('/:industry_code', async (req, res, next) => {
    try {
        let industry_code  = req.params.industry_code
        let comp_code = req.body.comp_code
        let resp = await db.query(`INSERT INTO companies_industries (industry_code, comp_code) VALUES ($1, $2) RETURNING *`, [industry_code, comp_code])
        res.json({status: "added"})
    } catch (err) {
        next(err)
    }
})
module.exports = router;