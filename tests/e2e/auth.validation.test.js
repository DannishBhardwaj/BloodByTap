const request = require('supertest')
const app = require('../../server')

describe('Auth validation', () => {
  it('rejects invalid register payload', async () => {
    const response = await request(app)
      .post('/api/auth/register')
      .send({ email: 'not-an-email', password: '123' })

    expect(response.status).toBe(400)
    expect(Array.isArray(response.body.errors)).toBe(true)
    expect(response.body.errors.length).toBeGreaterThan(0)
  })

  it('rejects login payload without email', async () => {
    const response = await request(app)
      .post('/api/auth/login')
      .send({ password: 'password123' })

    expect(response.status).toBe(400)
    expect(Array.isArray(response.body.errors)).toBe(true)
  })
})
