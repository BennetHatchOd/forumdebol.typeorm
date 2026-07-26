import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateStatisticsUsersTable1785036107524 implements MigrationInterface {
    name = 'CreateStatisticsUsersTable1785036107524'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "statistics_user" ("id" SERIAL NOT NULL, "sumScore" integer NOT NULL DEFAULT '0', "gamesCount" integer NOT NULL DEFAULT '0', "winsCount" integer NOT NULL DEFAULT '0', "lossesCount" integer NOT NULL DEFAULT '0', "userId" integer NOT NULL, CONSTRAINT "REL_ca37a804e2ac5051af100e37e0" UNIQUE ("userId"), CONSTRAINT "PK_62fa61febb58e0ef44ef3cfec1a" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "statistics_user" ADD CONSTRAINT "FK_ca37a804e2ac5051af100e37e04" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "statistics_user" DROP CONSTRAINT "FK_ca37a804e2ac5051af100e37e04"`);
         await queryRunner.query(`DROP TABLE "statistics_user"`);
    }

}
