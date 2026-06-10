import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateUserAuthTables1781096712753 implements MigrationInterface {
    name = 'CreateUserAuthTables1781096712753'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "user" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "deletedAt" TIMESTAMP, "login" character varying(10) NOT NULL, "email" character varying NOT NULL, "passwordHash" character varying NOT NULL, "isConfirmEmail" boolean NOT NULL DEFAULT 'true', CONSTRAINT "UQ_a62473490b3e4578fd683235c5e" UNIQUE ("login"), CONSTRAINT "UQ_e12875dfb3b1d92d7d7c5377e22" UNIQUE ("email"), CONSTRAINT "PK_cace4a159ff9f2512dd42373760" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "confirm_email" ("code" uuid NOT NULL DEFAULT uuid_generate_v4(), "expirationTime" TIMESTAMP NOT NULL, "userId" integer NOT NULL, CONSTRAINT "REL_35b272d31566395eeb78929caa" UNIQUE ("userId"), CONSTRAINT "PK_4064cc3deeb8682e20dc2e0c3ef" PRIMARY KEY ("code"))`);
        await queryRunner.query(`CREATE TABLE "new_password" ("code" uuid NOT NULL DEFAULT uuid_generate_v4(), "expirationTime" TIMESTAMP NOT NULL, "userId" integer NOT NULL, CONSTRAINT "REL_0bc59209dda0a505f3ea9c523b" UNIQUE ("userId"), CONSTRAINT "PK_902702c566a1811e5d3e0afe6ef" PRIMARY KEY ("code"))`);
        await queryRunner.query(`CREATE TABLE "session" ("deviceId" uuid NOT NULL DEFAULT uuid_generate_v4(), "version" character varying(10) NOT NULL, "deviceName" character varying NOT NULL, "ip" character varying NOT NULL, "updatedAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, CONSTRAINT "PK_c57e995074bf9afc1a2953d2329" PRIMARY KEY ("deviceId"))`);
        await queryRunner.query(`ALTER TABLE "confirm_email" ADD CONSTRAINT "FK_35b272d31566395eeb78929caa7" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "new_password" ADD CONSTRAINT "FK_0bc59209dda0a505f3ea9c523be" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "session" ADD CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "session" DROP CONSTRAINT "FK_3d2f174ef04fb312fdebd0ddc53"`);
        await queryRunner.query(`ALTER TABLE "new_password" DROP CONSTRAINT "FK_0bc59209dda0a505f3ea9c523be"`);
        await queryRunner.query(`ALTER TABLE "confirm_email" DROP CONSTRAINT "FK_35b272d31566395eeb78929caa7"`);
        await queryRunner.query(`DROP TABLE "session"`);
        await queryRunner.query(`DROP TABLE "new_password"`);
        await queryRunner.query(`DROP TABLE "confirm_email"`);
        await queryRunner.query(`DROP TABLE "user"`);
    }

}
