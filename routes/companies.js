const express = require('express')
const slugify = require('slugify')
const router = new express.Router()
const db = require('../db')
const ExpressError = require('../expressError')


router.get('/', async (req, res) => {
    try {
        let resp = await db.query(`SELECT code, name FROM companies`)
        res.json({companies: resp.rows})
    } catch (err) {
        next(err)
    }
})

router.get('/:code', async (req, res, next) => {
    let code = req.params.code
    try {
        let resp1 = await db.query(`SELECT * FROM companies WHERE code = $1`, [code])
        if (resp1.rows.length === 0) {
            throw new ExpressError(`Company with code ${code} could not be found.`, 404)
        }
        let company = resp1.rows[0]
        let resp2 = await db.query(`SELECT * 
                                    FROM companies as c                                                                                                                                                                                        
                                    JOIN companies_industries as ci                                                                                                                                                                             
                                    ON c.code = ci.comp_code                                                                                                                                                                                    
                                    JOIN industries as i                                                                                                                                                                                        
                                    ON ci.industry_code = i.code                                                                                                                                                                               
                                    WHERE c.code = $1; `, [code])
        if (resp2.rows.length === 0) {
            company.industries = []
        } else {
            company.industries = resp2.rows.map(invoice => invoice.industry)
        }
        res.json(company)
    } catch (err) {
        next(err)
    }
})

router.post('/', async (req, res, next) => {
    try {
        let {name, description} = req.body
        // Get company code
        let code = slugify(name, {
            replacement: '',
            remove: `/[*+~.()'"!:@]/g}`,
            lower: true,
        })
        let resp = await db.query(`INSERT INTO companies(code, name, description) VALUES ($1, $2, $3) RETURNING code, name, description`, [code, name, description])
        res.json({company: resp.rows[0]})
    } catch (err) {
        next(err)
    }
})

router.put('/:code', async (req, res, next) => {
    try {
        let code = req.params.code
        let {name, description} = req.body
        let resp = await db.query(`UPDATE companies SET name = $1, description = $2 WHERE code = $3 RETURNING code, name, description`, [name, description, code])
        if (resp.rows.length === 0){
           throw new ExpressError(`Company with code ${code} could not be found`, 404)
        } else {
            res.json({company: resp.rows[0]})
        }
    } catch (err) {
        next(err)
    }
})

router.delete('/:code', async (req, res, next) => {
    try {
        let code = req.params.code
        let resp = await db.query(`DELETE FROM companies WHERE code = $1 RETURNING CODE`, [code])
        if (resp.rows.length === 0) {
            throw new ExpressError(`Company with code ${code} could not be found`, 404)
        } else {
            res.json({status: "deleted"})
        }
    } catch (err) {
        next(err)
    }
})

module.exports = router;