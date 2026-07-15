import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateQuizTables1784128666773 implements MigrationInterface {
    name = 'CreateQuizTables1784128666773'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TABLE "playing_user" ("id" SERIAL NOT NULL, "numberQuestion" integer NOT NULL DEFAULT '0', "score" integer NOT NULL DEFAULT '0', "registrationAt" TIMESTAMP NOT NULL DEFAULT now(), "gameId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_3279c52fcb50bbd33f85a785ab2" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "round_question" ("id" SERIAL NOT NULL, "gameId" integer NOT NULL, "questionId" integer NOT NULL, CONSTRAINT "PK_55b1c3ce7115e92871e25f536c6" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "game" ("id" SERIAL NOT NULL, "status" "public"."status_game" NOT NULL DEFAULT 'PendingSecondPlayer', CONSTRAINT "PK_352a30652cd352f552fef73dec5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "answered_question" ("id" SERIAL NOT NULL, "answer" character varying NOT NULL, "isCorrect" boolean NOT NULL, "addedAt" TIMESTAMP NOT NULL DEFAULT now(), "questionId" integer NOT NULL, "gameId" integer NOT NULL, "userId" integer NOT NULL, CONSTRAINT "PK_16c139d459048e2e7c658f1dc49" PRIMARY KEY ("id"))`);
        await queryRunner.query(`ALTER TABLE "playing_user" ADD CONSTRAINT "FK_0979471da9cc6c2ea487e09314b" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "playing_user" ADD CONSTRAINT "FK_f69244f11c211d11f3242abddf8" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "round_question" ADD CONSTRAINT "FK_ef00cc66f62556ca6e5695b25a0" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "round_question" ADD CONSTRAINT "FK_638ee8ad28af9dc560562827789" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answered_question" ADD CONSTRAINT "FK_b059fe057c076cc25ccf751bb70" FOREIGN KEY ("questionId") REFERENCES "question"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answered_question" ADD CONSTRAINT "FK_2f34f76ed967cd44ed2188abd66" FOREIGN KEY ("gameId") REFERENCES "game"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "answered_question" ADD CONSTRAINT "FK_e71443c4ab93f2ce2c9d051afca" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "answered_question" DROP CONSTRAINT "FK_e71443c4ab93f2ce2c9d051afca"`);
        await queryRunner.query(`ALTER TABLE "answered_question" DROP CONSTRAINT "FK_2f34f76ed967cd44ed2188abd66"`);
        await queryRunner.query(`ALTER TABLE "answered_question" DROP CONSTRAINT "FK_b059fe057c076cc25ccf751bb70"`);
        await queryRunner.query(`ALTER TABLE "round_question" DROP CONSTRAINT "FK_638ee8ad28af9dc560562827789"`);
        await queryRunner.query(`ALTER TABLE "round_question" DROP CONSTRAINT "FK_ef00cc66f62556ca6e5695b25a0"`);
        await queryRunner.query(`ALTER TABLE "playing_user" DROP CONSTRAINT "FK_f69244f11c211d11f3242abddf8"`);
        await queryRunner.query(`ALTER TABLE "playing_user" DROP CONSTRAINT "FK_0979471da9cc6c2ea487e09314b"`);
        await queryRunner.query(`DROP TABLE "answered_question"`);
        await queryRunner.query(`DROP TABLE "game"`);
        await queryRunner.query(`DROP TABLE "round_question"`);
        await queryRunner.query(`DROP TABLE "playing_user"`);
    }

}
