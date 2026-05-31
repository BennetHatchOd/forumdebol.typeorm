import { Injectable } from '@nestjs/common';
import { Repository } from 'typeorm';
import { CodeTable } from '@modules/users-system/infrastucture/type/code.type';
import { NewPassword } from '@modules/users-system/domain/new.password.entity';
import { InjectRepository } from '@nestjs/typeorm';
import { EntityForRepoType } from '@modules/users-system/infrastucture/type/entity.for.repo.type';
import { ConfirmEmail } from '@modules/users-system/domain/confirm.email.entity';
import { AuthCodeContext } from '@modules/users-system/dto/auth.code.context';

@Injectable()
export class CodeRepository {

    constructor(
        @InjectRepository(NewPassword)  private newPasswordORMRepo: Repository<NewPassword>,
        @InjectRepository(ConfirmEmail)  private confirmEmailORMRepo: Repository<ConfirmEmail>,
    ) {}



    async save(savedItem: EntityForRepoType, table: CodeTable): Promise<void> {

        switch (table){
            case "ConfirmationEmail":
                await this.confirmEmailORMRepo.save(savedItem as ConfirmEmail);
                return ;
            case "ResetPassword":
                await this.newPasswordORMRepo.save(savedItem as NewPassword);
                return ;
        }
        return;
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
