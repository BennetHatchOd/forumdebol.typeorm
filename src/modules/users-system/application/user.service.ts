import { Inject, Injectable } from '@nestjs/common';
import { PasswordHashService } from './password.hash.service';
import { isBefore } from 'date-fns';
import { UserAboutViewDto } from '../dto/view/user.about.view.dto';
import { UserConfig } from '../config/user.config';
import { INJECT_TOKEN } from '@core/constans/jwt.tokens';
import { JwtService } from '@nestjs/jwt';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';
import { NewPasswordInputDto } from '@src/modules/users-system/dto/input/new.password.input.dto';
import { UserRepository } from '@modules/users-system/infrastucture/user.repository';
import { UserWithTime } from '@modules/users-system/dto/user.with.time';
import { CodeTable } from '@modules/users-system/infrastucture/code.type';

@Injectable()
export class UserService {
    constructor(
        @Inject(INJECT_TOKEN.ACCESS_TOKEN)
        private readonly accessJwtService: JwtService,
        private readonly userRepository: UserRepository,
        private readonly passwordHashService: PasswordHashService,
        private readonly userConfig: UserConfig,
    ) {}

    async createAccessToken(userId: string) {


        return this.accessJwtService.sign({ user: userId });
    }

    async validateUserForLocalAuth(
        loginOrEmail: string,
        passHash: string,
    ): Promise<string | null> {
        // проверяет по полям логин И емайл пользователя, если он найден,
        // проверяет совпадение хеша пароля и
        // возвращает ид найденного пользователя
        const foundUser: { id: string; passHash: string } | null =
            await this.userRepository.getPartUserByLoginEmail(loginOrEmail);

        if (
            foundUser !== null &&
            (await this.passwordHashService.checkHash(
                passHash,
                foundUser.passHash,
            ))
        )
            return foundUser.id;

        return null;
    }

    async validateUserForBasicAuth(
        login: string,
        password: string,
    ): Promise<boolean> {
        // проверяет по authHeader поля логин и пароль пользователя,

        return (
            login === this.userConfig.adminNameBasicAuth &&
            password === this.userConfig.adminPasswordBasicAuth
        );
    }


    async setNewPassword(recoveryPassword: NewPasswordInputDto): Promise<void> {
        // Sets a new password if a valid recovery code was received

        const userNewPassword: UserWithTime|null =
            await this.userRepository.findAndDeleteAuthCode(recoveryPassword.recoveryCode,
                                                            CodeTable.RESET_PASSWORD);

        if (!userNewPassword || isBefore(userNewPassword.expirationTime, new Date()))
            throw new DomainException({
                message: "a valid recovery code wasn't received or expired",
                code: DomainExceptionCode.PasswordRecoveryCodeNotFound,
                extension: [{message: "a valid recovery code wasn't received or expired",
                    field: "recoveryCode"}]
            });

        const hash: string = await this.passwordHashService.createHash(
            recoveryPassword.newPassword,
            this.userConfig.saltRound,
        );
        userNewPassword.passwordHash = hash;
        const user = UserWithTime.mapToUser(userNewPassword)
        await this.userRepository.saveUser(user);

        return;
    }

    async aboutMe(userId: string): Promise<UserAboutViewDto> {
        const user = (await this.userRepository.findById(userId));
        const userView = UserAboutViewDto.mapToView(user!);
        return userView;
    }
}