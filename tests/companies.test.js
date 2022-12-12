/* Tests for biztime company routes */
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

describe('GET /companies', () => {
    test('Gets all companies', async () => {
        const resp = await request(app).get('/companies')
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual({"companies": [{"code": "bk", "name": "Burger King"}, {"code": "wc", "name": "White Castle"}]})
    })
})

describe('GET /companies/:code', () => {
    test('Gets company by company code', async () => {
        const resp = await request(app).get('/companies/bk')
        expect(resp.statusCode).toBe(200)
        expect(resp.body).toEqual(expect.objectContaining({name: "Burger King"}))
    })
    test('Returns 404 if company code is invalid', async () => {
        const resp = await request(app).get('/companies/segksdfksjdfksjdf')
        expect(resp.statusCode).toBe(404)
    })
})

describe('POST /companies', () => {
    test('Add a new company', async () => {
        const resp = await request(app).post('/companies').send({code: "gc", name: "Golden Corral", description: "Buffet for the whole family"})
        expect(resp.body).toEqual({company: {code: 'gc', name: 'Golden Corral', description: "Buffet for the whole family" }})
    })
})

describe('PUT /company/:code', () => {
    test('Update a company', async () => {
        const resp = await request(app).put('/companies/bk').send({name: "Burger King", description: "Out of business"})
        expect(resp.body).toEqual({company: {code: "bk", description: "Out of business", name: "Burger King"}})
    })
    test('Returns 404 if company code is invalid', async () => {
        const resp = await request(app).put('/companies/dfgfdgdfg').send({code: "gc", name: "Golden Corral", description: "Buffet for the whole family"})
        expect(resp.statusCode).toBe(404)
    })
})

describe('DELETE /company/:code', () => {
    test('Delete a company', async () => {
        const resp = await request(app).delete('/companies/bk')
        expect(resp.body).toEqual({status: "deleted"})
    })
    test('Returns 404 if company code is invalid', async () => {
        const resp = await request(app).delete('/companies/dfgfdgdfg')
        expect(resp.statusCode).toBe(404)
    })
})

