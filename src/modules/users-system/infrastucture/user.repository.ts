import { User } from '../domain/user.entity';
import { Inject, Injectable } from '@nestjs/common';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';
import { CreateCodeDto } from '@modules/users-system/dto/create/create.code.dto';
import { UserWithTime } from '@modules/users-system/dto/user.with.time';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';

@Injectable()
export class UserRepository {

    constructor(@Inject(DATA_SOURCE) private dataSource: DataSource) {}

    async findById(id: string): Promise<User | null> {
         const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId < 1) return null;

        const searchItem: User[] = await this.dataSource.query(`
            SELECT * 
            FROM public."Users"
            WHERE id = $1 AND "deletedAt" IS NULL
            LIMIT 1`,
            [numericId]
        );
        if (searchItem.length == 0)
            return null;

        const user = User.copyInstance(searchItem[0]);

        return user;
    }

    async checkUniq(loginCheck: string, emailCheck: string):Promise<string[]|null>  {
        // checks the uniqueness of the entered login and email, in case of duplication,
        // returns an array indicating the duplicated field

        const existLoginEmail = await this.dataSource.query(`
        SELECT
            MAX(CASE WHEN login = $1 THEN 'login' END) AS login_conflict,
            MAX(CASE WHEN email = $2 THEN 'email' END) AS email_conflict
        FROM public."Users"
        WHERE login = $1 OR email = $2`,
            [loginCheck, emailCheck]);

        if(!existLoginEmail[0].login_conflict && !existLoginEmail[0].email_conflict )
            return null;

        const arrayErrors: string[] = [];

        if(existLoginEmail[0].login_conflict)
            arrayErrors.push('login')
        if(existLoginEmail[0].email_conflict)
            arrayErrors.push('email')

        return arrayErrors;

    }

    async getPartUserByLoginEmail(loginOrEmail: string): Promise<{id:string, passHash:string}|null> {
        // returns id and hash of password by the user who has
        // a login or email that matches the passed value

        const checkedUser: User[] = await this.dataSource.query(`
            SELECT * 
                FROM public."Users"
                WHERE (login = $1 OR email = $2) AND "isConfirmEmail" AND "deletedAt" IS NULL
                LIMIT 1;`,
            [loginOrEmail, loginOrEmail]
        );

        return checkedUser.length == 0
            ? null
            : {id: checkedUser[0].id.toString(),
                passHash: checkedUser[0].passwordHash};
    }

    async findUserIdByEmail(email: string, isConfirm: boolean):Promise <number|null>{
        // search user with unconfirmed email

        const searchItem: { id: number }[] = await this.dataSource.query(`
            SELECT id 
                FROM public."Users"
                WHERE email = $1 AND "isConfirmEmail" = $2 AND "deletedAt" IS NULL
                LIMIT 1;`,
            [email, isConfirm]
        );

        return searchItem.length == 0
            ? null
            : searchItem[0].id;
    }

    async saveUser(savedItem: User): Promise<void> {

        const result = await this.dataSource.query(`
                INSERT INTO public."Users"(
                    login, email, "passwordHash", "isConfirmEmail", "deletedAt")
                VALUES($1, $2, $3, $4, $5)
                ON CONFLICT (login)
                    DO UPDATE SET
                    "passwordHash" = EXCLUDED."passwordHash",
                    "isConfirmEmail" = EXCLUDED."isConfirmEmail",
                    "deletedAt"= EXCLUDED."deletedAt"
                RETURNING id, "createdAt";`,
            [   savedItem.login,
                savedItem.email,
                savedItem.passwordHash,
                savedItem.isConfirmEmail,
                savedItem.deletedAt,
            ])
        savedItem.id = result[0].id;
        savedItem.createdAt = result[0].createdAt;
        return ;
    }

    async saveCode(createDto: CreateCodeDto, table: CodeTable): Promise<void>   {

        await this.dataSource.query(`
            INSERT INTO public."${table}" 
                ("userId", code, "expirationTime")
            VALUES ($1, $2, $3)
                ON CONFLICT ("userId")
                DO UPDATE SET
                code = EXCLUDED.code,
                "expirationTime" = EXCLUDED."expirationTime";`,
            [   createDto.userId,
                createDto.code,
                createDto.expirationTime]);
        return;
    }

    async findAndDeleteAuthCode(code: string, table: CodeTable): Promise<UserWithTime|null> {
        // Find a user by an unverified email address or recoverable password
        // using the code in the corresponding table.
        // After finding the user, delete the code entry from the table.

        const result: UserWithTime[][] = await this.dataSource.query(`
            DELETE FROM public."${table}"
            USING public."Users"
            WHERE "${table}".code = $1 
            AND "Users".id = "${table}"."userId"
            RETURNING 
                "Users".id AS "userId",
                "Users".email,
                "Users".login,
                "Users"."passwordHash",  
                "Users"."isConfirmEmail",  
                "Users"."deletedAt",  
                "${table}"."expirationTime";`,
            [code]
        );

        return result[0][0] ?? null;
    }

}
