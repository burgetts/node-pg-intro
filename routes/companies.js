const express = require('express')
const router = new express.Router()
const db = require('../db')
const ExpressError = require('../expressError')

router.get('/', async (req, res) => {
    try {
        let resp = await db.query(`SELECT code, name FROM companies`)
        res.send({companies: resp.rows})
    } catch (err) {
        next(err)
    }
})

router.get('/:code', async (req, res, next) => {
    let code = req.params.code
    try {
        let resp = await db.query(`SELECT * FROM companies c JOIN invoices i ON c.code = i.comp_code WHERE c.code = $1`, [code])
        let data = resp.rows
        let invoice_ids = data.map(invoice => invoice.id)
        let company = {company: {code: data[0].code, name: data[0].name, description: data[0].description, invoices: invoice_ids}}
        res.send(company)
    } catch {
        let e = new ExpressError(`Company ${code} not found`, 404)
        next(e)
    }
})

router.post('/', async (req, res) => {
    try {
        let {code, name, description} = req.body
        let resp = await db.query(`INSERT INTO companies(code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description])
        res.send({company: resp.rows[0]})
    } catch (err) {
        next(err)
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        let code = req.params.code
        let {name, description} = req.body
        let resp = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description`, [name, description, code])
        if (resp.rows[0]){
            res.send({company: resp.rows[0]})
        } else {
            next()
        }
    } catch (err) {
        next(err)
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        let code = req.params.code
        let resp = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING CODE`, [code])
        console.log(resp.rows)
        if (resp.rows.length === 0) {
            res.json({status: "deleted"})
        } else {
            next()
        }
    } catch (err) {
        next()
    }
})

module.exports = router;