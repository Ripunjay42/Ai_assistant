import { DataTypes } from 'sequelize';
import sequelize from '../config/database.js';

const Document = sequelize.define(
  'Document',
  {
    id: {
      type: DataTypes.UUID,
      defaultValue: DataTypes.UUIDV4,
      primaryKey: true
    },

    name: {
      type: DataTypes.STRING,
      allowNull: false
    },

    type: {
      type: DataTypes.STRING,
      allowNull: false
    },

    status: {
      type: DataTypes.ENUM('UPLOADED', 'PROCESSING', 'READY', 'FAILED'),
      defaultValue: 'UPLOADED'
    },

    errorMessage: {
      type: DataTypes.TEXT,
      allowNull: true
    },

    workspaceId: {
      type: DataTypes.UUID,
      allowNull: false
    },

    uploadedBy: {
      type: DataTypes.UUID,
      allowNull: false
    },

    s3Key: {
      type: DataTypes.STRING,
      allowNull: true
    }
  },
  {
    tableName: 'documents',
    timestamps: true
  }
);

export default Document;
