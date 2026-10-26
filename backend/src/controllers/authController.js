const bcrypt = require('bcryptjs');
const jwt = require('jsonwebtoken');
const prisma = require('../config/db');

const normalizeEmail = (value) => (typeof value === 'string' ? value.trim().toLowerCase() : '');
const normalizeName = (value) => (typeof value === 'string' ? value.trim() : '');

const register = async (req, res) => {
  try {
    const { email, password, name, role = 'PATIENT', age, gender, baselineMMSE, medicalHistory } = req.body;
    const normalizedRole = typeof role === 'string' ? role.trim().toUpperCase() : '';
    if (normalizedRole !== 'PATIENT') {
      return res.status(403).json({ error: 'Staff accounts must be provisioned through an authorized process' });
    }

    const normalizedEmail = normalizeEmail(email);
    const normalizedPassword = typeof password === 'string' ? password.trim() : '';
    const normalizedName = normalizeName(name);
    if (!normalizedEmail || !normalizedPassword || !normalizedName) {
      return res.status(400).json({ error: 'Email, password, and name are required' });
    }

    const existingUser = await prisma.user.findUnique({ where: { email: normalizedEmail } });
    if (existingUser) {
      return res.status(400).json({ error: 'User with this email already exists' });
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(normalizedPassword, salt);

    const user = await prisma.user.create({
      data: {
        email: normalizedEmail,
        passwordHash,
        name: normalizedName,
        role: 'PATIENT',
        patient: {
          create: {
            age: Number.parseInt(age ?? 65, 10),
            gender: gender || 'Unspecified',
            baselineMMSE: Number.parseFloat(baselineMMSE ?? 30.0),
            medicalHistory: medicalHistory || ''
          }
        }
      },
      include: {
        patient: true
      }
    });

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.status(201).json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patient: user.patient
      }
    });
  } catch (error) {
    console.error('Register error:', error);
    return res.status(500).json({ error: 'Failed to register user' });
  }
};

const login = async (req, res) => {
  try {
    const normalizedEmail = normalizeEmail(req.body.email);
    const passwordValue = typeof req.body.password === 'string' ? req.body.password.trim() : '';
    if (!normalizedEmail || !passwordValue) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const user = await prisma.user.findUnique({
      where: { email: normalizedEmail },
      include: { patient: true }
    });

    if (!user) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const isMatch = await bcrypt.compare(passwordValue, user.passwordHash);
    if (!isMatch) {
      return res.status(401).json({ error: 'Invalid credentials' });
    }

    const token = jwt.sign(
      { userId: user.id, role: user.role },
      process.env.JWT_SECRET,
      { expiresIn: '7d' }
    );

    return res.json({
      token,
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        role: user.role,
        patient: user.patient
      }
    });
  } catch (error) {
    console.error('Login error:', error);
    return res.status(500).json({ error: 'Failed to login' });
  }
};

const me = async (req, res) => {
  try {
    const user = await prisma.user.findUnique({
      where: { id: req.user.id },
      include: { patient: true }
    });

    if (!user) {
      return res.status(404).json({ error: 'User not found' });
    }

    return res.json({
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role,
      patient: user.patient
    });
  } catch (error) {
    console.error('Me error:', error);
    return res.status(500).json({ error: 'Failed to get profile' });
  }
};

module.exports = { register, login, me };
