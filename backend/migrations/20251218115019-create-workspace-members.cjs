'use strict';

module.exports = {
  async up(queryInterface, Sequelize) {
    await queryInterface.createTable('workspace_members', {
      id: {
        type: Sequelize.UUID,
        primaryKey: true,
        defaultValue: Sequelize.UUIDV4
      },
      role: {
        type: Sequelize.ENUM('OWNER', 'MEMBER'),
        defaultValue: 'MEMBER'
      },
      userId: {
        type: Sequelize.UUID,
        references: {
          model: 'users',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      workspaceId: {
        type: Sequelize.UUID,
        references: {
          model: 'workspaces',
          key: 'id'
        },
        onDelete: 'CASCADE'
      },
      createdAt: {
        type: Sequelize.DATE,
        allowNull: false
      },
      updatedAt: {
        type: Sequelize.DATE,
        allowNull: false
      }
    });
  },

  async down(queryInterface, Sequelize) {
    await queryInterface.dropTable('workspace_members');
    await queryInterface.sequelize.query(
      'DROP TYPE IF EXISTS enum_workspace_members_role;'
    );
  }
};
