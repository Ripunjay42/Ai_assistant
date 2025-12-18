import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const WorkspaceMember = sequelize.define(
  'WorkspaceMember',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    role: {
      type: DataTypes.ENUM('OWNER', 'MEMBER'),
      defaultValue: 'MEMBER'
    }
  },
  {
    tableName: 'workspace_members',
    timestamps: true
  }
);

export default WorkspaceMember;
