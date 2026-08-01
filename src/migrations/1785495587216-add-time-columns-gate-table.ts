import { MigrationInterface, QueryRunner } from "typeorm";

export class AddTimeColumnsGateTable1785495587216 implements MigrationInterface {
    name = 'AddTimeColumnsGateTable1785495587216'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "playing_user" DROP COLUMN "registrationAt"`);
        await queryRunner.query(`ALTER TABLE "game" ADD "pairCreatedAt" TIMESTAMP NOT NULL DEFAULT '"2026-07-31T10:59:49.949Z"'`);
        await queryRunner.query(`ALTER TABLE "game" ADD "startAt" TIMESTAMP`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "startAt"`);
        await queryRunner.query(`ALTER TABLE "game" DROP COLUMN "pairCreatedAt"`);
        await queryRunner.query(`ALTER TABLE "playing_user" ADD "registrationAt" TIMESTAMP NOT NULL DEFAULT now()`);
    }

}
