export const authAPI = {
  login: jest.fn(),
  register: jest.fn(),
  getCurrentUser: jest.fn(),
}

export const alertsAPI = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
  update: jest.fn(),
  delete: jest.fn(),
}

export const emergenciesAPI = {
  getAll: jest.fn(),
  getById: jest.fn(),
  create: jest.fn(),
}

export const usersAPI = {
  getProfile: jest.fn(),
  updateProfile: jest.fn(),
}
