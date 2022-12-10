const express = require('express')
const router = new express.Router()
const db = require('../db')
const ExpressError = require('../expressError')

router.get('/', async (req, res, next) => {
    try {
        let resp = await db.query(`SELECT id, comp_code FROM invoices`)
        res.send({invoices: resp.rows})
    } catch(err) {
        next(err)
    }
})

router.get('/:id', async (req, res, next) => {
    let id = req.params.id
    try {
        let resp = await db.query(`SELECT i.id, i.amt, i.paid, i.add_date, i.paid_date, c.code, c.name, c.description FROM invoices AS i JOIN companies AS c  ON i.comp_code=c.code WHERE id = $1`, [id])  
        let data = resp.rows[0]
        let invoice = {invoice: {id: data.id, amt: data.amt, paid: data.paid, paid_date: data.paid_date, company: {code: data.code, name: data.name, description: data.description}}}    
        res.send(invoice)                             
    } catch {
        let e = new ExpressError("Invoice not found", 404)
        next(e)
    }
})

router.post('/', async (req, res, next) => {
    try {
        let {comp_code, amt} = req.body
        let resp = await db.query(`INSERT INTO invoices (comp_code, amt) VALUES ($1, $2) RETURNING *`, [comp_code, amt])
        res.send(resp.rows[0])
    } catch (err) {
        next(err)
    }
})

router.put('/:id', async (req, res, next) => {
    try{
        let id = req.params.id
        let amt = req.body.amt
        console.log(id, amt)
        let resp = await db.query(`UPDATE invoices SET amt = $1 WHERE id = $2 RETURNING *`, [amt, id])
        
        res.send({invoice: resp.rows[0]})
    } catch {
        let e = new ExpressError("Invoice not found", 404)
        next(e)
    }
})

router.delete('/:id', async (req, res, next) => {
    try {
        let id = req.params.id
        let resp = await db.query(`DELETE FROM invoices WHERE id = $1 RETURNING ID`, [id])
        if (resp.rows.length === 0){
            res.send({status: "deleted"})
        } else {
            next()
        }
    } catch (err) {
        next()
    }
})

module.exports = router;