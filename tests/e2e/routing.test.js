const request = require('supertest')
const app = require('../../server')

describe('Routing', () => {
  it('returns 404 for unknown route', async () => {
    const response = await request(app).get('/api/does-not-exist')

    expect(response.status).toBe(404)
    expect(response.body).toEqual({ message: 'Route not found' })
  })
})
