import sequelize from '../config/database.js';

import User from './user.model.js';
import Workspace from './workspace.model.js';
import WorkspaceMember from './workspaceMember.model.js';
import Document from './document.model.js';

// User ↔ Workspace (many-to-many)
User.belongsToMany(Workspace, {
  through: WorkspaceMember,
  foreignKey: 'userId'
});

Workspace.belongsToMany(User, {
  through: WorkspaceMember,
  foreignKey: 'workspaceId'
});

// Ownership (optional but powerful)
Workspace.belongsTo(User, {
  as: 'owner',
  foreignKey: 'ownerId'
});

User.hasMany(Workspace, {
  as: 'ownedWorkspaces',
  foreignKey: 'ownerId'
});

// Workspace → Documents
Workspace.hasMany(Document, {
  foreignKey: 'workspaceId'
});
Document.belongsTo(Workspace, {
  foreignKey: 'workspaceId'
});

// User → Documents (uploader)
User.hasMany(Document, {
  foreignKey: 'uploadedBy'
});
Document.belongsTo(User, {
  foreignKey: 'uploadedBy'
});

const db = {
  sequelize,
  User,
  Workspace,
  WorkspaceMember,
  Document
};

db.init = async () => {
  try {
    await sequelize.authenticate();
    console.log('PostgreSQL connected (Aiven)');
  } catch (err) {
    console.error('DB init failed:', err);
    process.exit(1);
  }
};

export default db;
