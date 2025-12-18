import db from '../models/index.js';
import { hashPassword, comparePassword } from '../utils/password.js';
import { signToken } from '../utils/jwt.js';

export const signup = async (req, res) => {
  const { email, password, name } = req.body;

  const existingUser = await db.User.findOne({ where: { email } });
  if (existingUser) {
    return res.status(400).json({ message: 'Email already exists' });
  }

  const passwordHash = await hashPassword(password);

  const user = await db.User.create({
    email,
    passwordHash,
    name
  });

  // Create default workspace
  const workspace = await db.Workspace.create({
    name: `${name || 'My'} Workspace`,
    ownerId: user.id
  });

  await db.WorkspaceMember.create({
    userId: user.id,
    workspaceId: workspace.id,
    role: 'OWNER'
  });

  const token = signToken({ userId: user.id });

  res.status(201).json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
};

export const login = async (req, res) => {
  const { email, password } = req.body;

  const user = await db.User.findOne({ where: { email } });
  if (!user) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const isValid = await comparePassword(password, user.passwordHash);
  if (!isValid) {
    return res.status(401).json({ message: 'Invalid credentials' });
  }

  const token = signToken({ userId: user.id });

  res.json({
    token,
    user: {
      id: user.id,
      email: user.email,
      name: user.name
    }
  });
};
