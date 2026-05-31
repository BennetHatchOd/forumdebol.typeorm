import { User } from '../domain/user.entity';
import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';
import { NewPassword } from '@modules/users-system/domain/new.password.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityForRepo } from '@modules/users-system/infrastucture/entity.for.repo';
import { ConfirmEmail } from '@modules/users-system/domain/confirm.email.entity';
import { AuthCodeContext } from '@modules/users-system/dto/auth.code.context';

@Injectable()
export class UserRepository {

    constructor(
        @InjectRepository(User)  private userORMRepo: Repository<User>,
        @InjectRepository(NewPassword)  private newPasswordORMRepo: Repository<NewPassword>,
        @InjectRepository(ConfirmEmail)  private confirmEmailORMRepo: Repository<ConfirmEmail>,
        ) {}

    async findById(id: string): Promise<User | null> {
         const numericId = Number(id);
        if (!Number.isInteger(numericId) || numericId < 1) return null;

        const searchItem: User | null = await this.userORMRepo.findOne(
            {where: { id: numericId }, }
        );

        return searchItem;
    }

    async checkUniq(loginCheck: string, emailCheck: string):Promise<string[]|null>  {
        // checks the uniqueness of the entered login and email, in case of duplication,
        // returns an array indicating the duplicated field

        const existLogin = await this.userORMRepo.exists(
            {where: { login: loginCheck } },
        );

        const existEmail = await this.userORMRepo.exists(
            {where: { email: emailCheck  } },
        );



        if(!existEmail && !existLogin )
            return null;

        const arrayErrors: string[] = [];

        if(existLogin)
            arrayErrors.push('login')
        if(existEmail)
            arrayErrors.push('email')

        return arrayErrors;

    }

    async getUserByLoginEmail(loginOrEmail: string): Promise<User|null> {
        // returns id and hash of password by the user who has
        // a login or email that matches the passed value

        const checkedUser: User | null = await this.userORMRepo.findOne(
            {where:
                    [{ login: loginOrEmail, isConfirmEmail: true },
                    { email: loginOrEmail, isConfirmEmail: true }]
            })
        return checkedUser;    }

    async findUserIdByEmail(email: string, isConfirm: boolean):Promise <number|null>{
        // search user with any email

        const checkedUser: User | null = await this.userORMRepo.findOne(
            {where:  { email: email, isConfirmEmail: isConfirm } })

        return checkedUser
            ? checkedUser.id
            : null;
    }

    async save(savedItem: EntityForRepo, table: CodeTable): Promise<void> {

        switch (table){
            case "User":
                await this.userORMRepo.save(savedItem as User);
                return ;
            case "ConfirmationEmail":
                await this.confirmEmailORMRepo.save(savedItem as ConfirmEmail);
                return ;
            case "ResetPassword":
                await this.newPasswordORMRepo.save(savedItem as NewPassword);
                return ;
        }
        return;
    }

    async delete(item: string): Promise<void> {
        await this.userORMRepo.softDelete({id: +item});
        return ;
    }

    async findAndDeleteAuthCode(code: string, table: CodeTable): Promise<AuthCodeContext|null> {
        // Find a user by code for an unverified email address or recoverable password,
        // using the code in the corresponding table.
        // After finding the user, delete the code entry from the table.

        let user: AuthCodeContext | null = null;
        switch (table){
            case "ConfirmationEmail":
                const confirm: ConfirmEmail|null = await this.confirmEmailORMRepo.findOne({
                                                                        where: {code: code},
                                                                        relations: {user: true}});
                if(confirm){
                    user = new AuthCodeContext(confirm.user, confirm.expirationTime)
                    await this.confirmEmailORMRepo.remove(confirm);
                }
            case "ResetPassword":
                const pass: NewPassword|null = await this.newPasswordORMRepo.findOne({
                                                                        where: {code: code},
                                                                        relations: {user: true}});
                if(pass){
                    user = new AuthCodeContext(pass.user, pass.expirationTime)
                    await this.newPasswordORMRepo.remove(pass);
                }
        }
        return user;
    }
    async deleteAuthCodeByUser(id: number, table: CodeTable): Promise<void> {
        // delete user's code for an unverified email address or recoverable password,
        // using the code in the corresponding table.

        let user: AuthCodeContext | null = null;
        switch (table){
            case "ConfirmationEmail":
                await this.confirmEmailORMRepo.delete({user:{id: id}});
                return ;
            case "ResetPassword":
                await this.newPasswordORMRepo.delete({user:{id: id}});
                return ;
        }
    }

}
