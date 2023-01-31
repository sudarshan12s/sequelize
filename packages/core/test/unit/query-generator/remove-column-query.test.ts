import { DataTypes } from '@sequelize/core';
import { buildInvalidOptionReceivedError } from '@sequelize/core/_non-semver-use-at-your-own-risk_/utils/check.js';
import { createSequelizeInstance, expectsql, getTestDialect, sequelize } from '../../support';

const dialectName = getTestDialect();

describe('QueryGenerator#removeColumnQuery', () => {
  const queryGenerator = sequelize.getQueryInterface().queryGenerator;

  const User = sequelize.define('User', {
    firstName: DataTypes.STRING,
    age: DataTypes.INTEGER,
  }, { timestamps: false });

  it('generates a DROP COLUMN query in supported dialects', () => {
    expectsql(() => queryGenerator.removeColumnQuery(User.tableName, 'age'), {
      default: 'ALTER TABLE [Users] DROP COLUMN [age];',
      'mariadb mysql snowflake': `ALTER TABLE [Users] DROP [age];`,
      sqlite: 'CREATE TABLE IF NOT EXISTS `Users_backup` (`0` a, `1` g, `2` e);INSERT INTO `Users_backup` SELECT `0`, `1`, `2` FROM `Users`;DROP TABLE `Users`;ALTER TABLE `Users_backup` RENAME TO `Users`;',
    });
  });

  it('generates a DROP COLUMN IF EXISTS query in supported dialects', () => {
    expectsql(() => queryGenerator.removeColumnQuery(User.tableName, 'age', { ifExists: true }), {
      default: buildInvalidOptionReceivedError('removeColumnQuery', dialectName, ['ifExists']),
      mariadb: 'ALTER TABLE `Users` DROP IF EXISTS `age`;',
      'postgres mssql': 'ALTER TABLE [Users] DROP COLUMN IF EXISTS [age];',
    });
  });

  if (sequelize.dialect.supports.schemas) {
    it('supports schemas', () => {
      expectsql(queryGenerator.removeColumnQuery({
        schema: 'archive',
        tableName: 'user',
      }, 'email'), {
        default: 'ALTER TABLE [archive].[user] DROP COLUMN [email];',
        'mariadb mysql snowflake': 'ALTER TABLE [archive].[user] DROP [email];',
      });
    });

    it('defaults the schema to the one set in the Sequelize options', () => {
      const customSequelize = createSequelizeInstance({
        schema: 'custom',
      });
      const customSql = customSequelize.dialect.queryGenerator;

      expectsql(customSql.removeColumnQuery({
        tableName: 'user',
      }, 'email'), {
        default: 'ALTER TABLE [custom].[user] DROP COLUMN [email];',
        'mariadb mysql snowflake': 'ALTER TABLE [custom].[user] DROP [email];',
      });
    });
  }
});
