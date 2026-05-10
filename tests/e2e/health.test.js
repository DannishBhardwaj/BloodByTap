const request = require('supertest')
const app = require('../../server')

describe('GET /api/health', () => {
  it('returns API status', async () => {
    const response = await request(app).get('/api/health')

    expect(response.status).toBe(200)
    expect(response.body).toEqual({
      status: 'OK',
      message: 'BloodByTap API is running',
    })
  })
})
