/* Tests for biztime invoice routes */
process.env.NODE_ENV = "test";

const request = require("supertest");
const app = require("../app");
const db = require("../db");

beforeEach(async () => {
    await db.query(`INSERT INTO companies (code, name, description)
                    VALUES ('bk', 'Burger King', 'The fast food joint where you can have it Your Way.'),
                            ('wc', 'White Castle', 'What you crave')`)
    await db.query(`INSERT INTO invoices (comp_code, amt)
                    VALUES ('bk', 25.00), ('bk', 35.00)`)
})

afterEach(async function() {
    await db.query("DELETE FROM companies")
    await db.query("DELETE FROM invoices")
});
  
afterAll(async function() {
    await db.end();
});

describe('GET /invoices', () => {
    test('Get all invoices', async () => {
        let resp = await request(app).get(`/invoices`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual(expect.objectContaining({invoices: [{comp_code: "bk", id: expect.any(Number)}, {comp_code: 'bk', id: expect.any(Number)}]}))
    })
})

describe('GET /invoices/:id', () => {
    test('Get invoice by id', async () => {
        let info = await db.query(`SELECT id FROM invoices WHERE comp_code = 'bk' AND amt = 25.00`)
        let invoice = info.rows[0]
        let resp = await request(app).get(`/invoices/${invoice.id}`)
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('invoice')
    })
    test('Returns 404 if invoice id is invalid', async () => {
        const resp = await request(app).get('/invoices/9999999')
        expect(resp.statusCode).toBe(404)
    })
})

describe('POST /invoices', () => {
    test('Add new invoice', async () => {
        let resp = await request(app).post('/invoices').send({comp_code: 'wc', amt: '100.00'})
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toHaveProperty('invoice')
    })
})

describe('PUT /invoices/:id', () => {
    test('Update invoice', async () => {
        let info = await db.query(`SELECT id FROM invoices WHERE comp_code = 'bk' AND amt = 25.00`)
        let invoice = info.rows[0]
        let resp = await request(app).put(`/invoices/${invoice.id}`).send({amt: 120.00})
        expect(resp.statusCode).toBe(200)
        expect(resp.body.invoice).toEqual(expect.objectContaining({amt: 120.00}))
    })
    test('Returns 404 if invoice id is invalid', async () => {
        const resp = await request(app).put('/invoices/9999999').send({amt: 120.00})
        expect(resp.statusCode).toBe(404)
    })
})

describe('DELETE /invoices/:id', () => {
    test('Deletes invoice', async () => {
        let info = await db.query(`SELECT id FROM invoices WHERE comp_code = 'bk' AND amt = 25.00`)
        let invoice = info.rows[0]
        let resp = await request(app).delete(`/invoices/${invoice.id}`)
        expect(resp.body).toEqual({status: "deleted"})
    })
    test('Returns 404 if invoice id is invalid', async () => {
        const resp = await request(app).delete('/invoices/9999999')
        expect(resp.statusCode).toBe(404)
    })
})