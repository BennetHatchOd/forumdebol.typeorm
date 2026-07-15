import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQustionTables1782049716180 implements MigrationInterface {
    name = 'CreateQuestionTables1782049716180'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "question" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "body" character varying(500) NOT NULL, "correctAnswers" jsonb NOT NULL DEFAULT '[]', "published" boolean NOT NULL DEFAULT false, CONSTRAINT "UQ_02718800445a4fcc5a09865582e" UNIQUE ("body"), CONSTRAINT "PK_21e5786aa0ea704ae185a79b2d5" PRIMARY KEY ("id"))`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`DROP TABLE "question"`);
    }

}
