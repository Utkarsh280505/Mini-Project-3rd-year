jest.mock('../src/config/db', () => ({
  user: {
    findUnique: jest.fn(),
    create: jest.fn()
  }
}));

const prisma = require('../src/config/db');
const { register } = require('../src/controllers/authController');

describe('public registration authorization', () => {
  beforeEach(() => {
    jest.clearAllMocks();
  });

  it('prevents public self-registration for clinician and administrator roles', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    await register({ body: { name: 'Synthetic Staff', email: 'staff@example.test', password: 'synthetic-password', role: 'CLINICIAN' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(res.json).toHaveBeenCalledWith({
      error: 'Staff accounts must be provisioned through an authorized process'
    });
    expect(prisma.user.findUnique).not.toHaveBeenCalled();
    expect(prisma.user.create).not.toHaveBeenCalled();
  });

  it('also rejects administrator role requests during public registration', async () => {
    const res = {
      status: jest.fn().mockReturnThis(),
      json: jest.fn().mockReturnThis()
    };

    await register({ body: { name: 'Synthetic Admin', email: 'admin@example.test', password: 'synthetic-password', role: 'ADMIN' } }, res);

    expect(res.status).toHaveBeenCalledWith(403);
    expect(prisma.user.create).not.toHaveBeenCalled();
  });
});
