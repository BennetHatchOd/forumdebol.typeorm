import { MigrationInterface, QueryRunner } from "typeorm";

export class CreateCommentsTables1781709751188 implements MigrationInterface {
    name = 'CreateCommentsTables1781709751188'

    public async up(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`CREATE TYPE "public"."rating_enum" AS ENUM('Like', 'Dislike', 'None')`);
        await queryRunner.query(`CREATE TABLE "like_comment" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "status" "public"."rating_enum" NOT NULL, "targetId" integer NOT NULL, CONSTRAINT "UQ_42f7e957638c217ebe53bd1b579" UNIQUE ("userId", "targetId"), CONSTRAINT "PK_307553e232b4620fde327c59eb5" PRIMARY KEY ("id"))`);
        await queryRunner.query(`CREATE TABLE "like_post" ("id" SERIAL NOT NULL, "createdAt" TIMESTAMP NOT NULL DEFAULT now(), "userId" integer NOT NULL, "status" "public"."rating_enum" NOT NULL, "targetId" integer NOT NULL, CONSTRAINT "UQ_0fc720753c44cf625b77cc53a22" UNIQUE ("userId", "targetId"), CONSTRAINT "PK_d41caa70371e578e2a4791a88ae" PRIMARY KEY ("id"))`);
         await queryRunner.query(`ALTER TABLE "like_comment" ADD CONSTRAINT "FK_cb85953b04dd87a25b3475c5f2c" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like_comment" ADD CONSTRAINT "FK_312b7356b6d4757e99fc29b1dc7" FOREIGN KEY ("targetId") REFERENCES "comment"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like_post" ADD CONSTRAINT "FK_17d3baf43f9eef20590c5b6ddfa" FOREIGN KEY ("userId") REFERENCES "user"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
        await queryRunner.query(`ALTER TABLE "like_post" ADD CONSTRAINT "FK_c56b612a031f66f61a04697ef60" FOREIGN KEY ("targetId") REFERENCES "post"("id") ON DELETE NO ACTION ON UPDATE NO ACTION`);
    }

    public async down(queryRunner: QueryRunner): Promise<void> {
        await queryRunner.query(`ALTER TABLE "like_post" DROP CONSTRAINT "FK_c56b612a031f66f61a04697ef60"`);
        await queryRunner.query(`ALTER TABLE "like_post" DROP CONSTRAINT "FK_17d3baf43f9eef20590c5b6ddfa"`);
        await queryRunner.query(`ALTER TABLE "like_comment" DROP CONSTRAINT "FK_312b7356b6d4757e99fc29b1dc7"`);
        await queryRunner.query(`ALTER TABLE "like_comment" DROP CONSTRAINT "FK_cb85953b04dd87a25b3475c5f2c"`);
        await queryRunner.query(`DROP TABLE "like_post"`);
        await queryRunner.query(`DROP TABLE "like_comment"`);
        await queryRunner.query(`DROP TYPE "public"."rating_enum"`);
    }

}
