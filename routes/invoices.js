const express = require('express')
const router = new express.Router()
const db = require('../db')
const ExpressError = require('../expressError')

router.get('/', async (req, res, next) => {
    try {
        let resp = await db.query(`SELECT id, comp_code FROM invoices`)
        res.json({invoices: resp.rows})
    } catch(err) {
        next(err)
    }
})

router.get('/:id', async (req, res, next) => {
    let id = req.params.id
    try {
        let resp = await db.query(`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description FROM invoices AS i JOIN companies AS c  ON i.comp_code=c.code WHERE id = $1`, [id]) 
        if (resp.rows.length === 0){
            throw new ExpressError("Invoice not found", 404)
        } 
        let data = resp.rows[0]
        let invoice = {invoice: {id: data.id, amt: data.amt, paid: data.paid, paid_date: data.paid_date, company: {code: data.code, name: data.name, description: data.description}}}    
        res.json(invoice)                             
    } catch (err) {
        next(err)
    }
})

router.post('/', async (req, res, next) => {
    try {
        let {comp_code, amt} = req.body
        let resp = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt])
        res.json({invoice: resp.rows[0]})
    } catch (err) {
        next(err)
    }
})

router.put('/:id', async (req, res, next) => {
    try{
        let id = req.params.id
        // Get existing invoice
        let resp1 = await db.query(`SELECT * FROM invoices WHERE id = $1`, [id])
        if (resp1.rows.length === 0){
            throw new ExpressError("Invoice not found", 404)
        }
        let existing_invoice = resp1.rows[0]
        let {amt, paid} = req.body
        // If paying
        if (existing_invoice.paid === false && paid === true) {
            const paid_date = new Date()
            let resp2 = await db.query(`UPDATE invoices SET paid_date = $1, paid = $2, amt = $3 WHERE id = $4 RETURNING *`, [paid_date, paid, amt, id])
            res.json({invoice: resp2.rows[0]})
        }
        // If unpaying
        else if (existing_invoice.paid === true && paid === false) {
            const paid_date = null
            let resp2 = await db.query(`UPDATE invoices SET paid_date = $1, paid = $2, amt = $3 WHERE id = $4 RETURNING *`, [paid_date, paid, amt, id])
            res.json({invoice: resp2.rows[0]})
        }
        // If its the same 
        let resp2 = await db.query(`UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *`, [amt, id])
        res.json({invoice: resp2.rows[0]})
    } catch (err) {
        next(err)
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        let id = req.params.id
        let resp = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING ID`, [id])
        if (resp.rows.length === 0){
            throw new ExpressError("Invoice not found", 404)
        }
        res.json({status: "deleted"})
    } catch (err) {
        next()
    }
})

module.exports = router;