import {
  MigrationInterface,
  QueryRunner,
  Table,
  TableForeignKey,
  TableIndex,
} from 'typeorm';

export class CreateWithdrawalsTable1743072000000 implements MigrationInterface {
  public async up(queryRunner: QueryRunner): Promise<void> {
    // Create enum type for withdrawal status
    await queryRunner.query(
      `CREATE TYPE "withdrawal_status_enum" AS ENUM ('pending', 'approved', 'rejected', 'paid')`,
    );

    await queryRunner.createTable(
      new Table({
        name: 'withdrawals',
        columns: [
          {
            name: 'id',
            type: 'uuid',
            isPrimary: true,
            generationStrategy: 'uuid',
            default: 'uuid_generate_v4()',
          },
          {
            name: 'projectId',
            type: 'uuid',
          },
          {
            name: 'amount',
            type: 'decimal',
            precision: 18,
            scale: 7,
          },
          {
            name: 'status',
            type: 'enum',
            enum: ['pending', 'approved', 'rejected', 'paid'],
            enumName: 'withdrawal_status_enum',
            default: "'pending'",
          },
          {
            name: 'transactionHash',
            type: 'varchar',
            isNullable: true,
          },
          {
            name: 'rejectionReason',
            type: 'text',
            isNullable: true,
          },
          {
            name: 'createdAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
          {
            name: 'updatedAt',
            type: 'timestamp',
            default: 'CURRENT_TIMESTAMP',
          },
        ],
      }),
      true,
    );

    // Create indexes
    await queryRunner.createIndex(
      'withdrawals',
      new TableIndex({
        name: 'IDX_withdrawals_project_id',
        columnNames: ['projectId'],
      }),
    );

    await queryRunner.createIndex(
      'withdrawals',
      new TableIndex({
        name: 'IDX_withdrawals_status',
        columnNames: ['status'],
      }),
    );

    // Create foreign key
    await queryRunner.createForeignKey(
      'withdrawals',
      new TableForeignKey({
        name: 'FK_withdrawals_project',
        columnNames: ['projectId'],
        referencedTableName: 'projects',
        referencedColumnNames: ['id'],
        onDelete: 'CASCADE',
      }),
    );
  }

  public async down(queryRunner: QueryRunner): Promise<void> {
    const table = await queryRunner.getTable('withdrawals');

    if (table) {
      // Drop foreign key
      const projectForeignKey = table.foreignKeys.find(
        (fk) => fk.name === 'FK_withdrawals_project',
      );
      if (projectForeignKey) {
        await queryRunner.dropForeignKey('withdrawals', projectForeignKey);
      }

      // Drop indexes
      const projectIdIndex = table.indices.find(
        (idx) => idx.name === 'IDX_withdrawals_project_id',
      );
      if (projectIdIndex) {
        await queryRunner.dropIndex('withdrawals', projectIdIndex);
      }

      const statusIndex = table.indices.find(
        (idx) => idx.name === 'IDX_withdrawals_status',
      );
      if (statusIndex) {
        await queryRunner.dropIndex('withdrawals', statusIndex);
      }
    }

    await queryRunner.dropTable('withdrawals');

    // Drop enum type
    await queryRunner.query(`DROP TYPE "withdrawal_status_enum"`);
  }
}
