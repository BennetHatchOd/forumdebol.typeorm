import { Body, Controller, Post, UseGuards, HttpCode, HttpStatus, Get, Req, Res } from '@nestjs/common';
import { UserService } from '../application/user.service';
import { AuthGuard } from '@nestjs/passport';
import { UserInputDto } from '../dto/input/user.input.dto';
import { AUTH_PATH, URL_PATH } from '@core/url.path.setting';
import { EmailInputDto } from '@src/modules/users-system/dto/input/email.input.dto';
import { ConfirmCodeInputDto } from '@src/modules/users-system/dto/input/confirm.code.input.dto';
import { NewPasswordInputDto } from '@src/modules/users-system/dto/input/new.password.input.dto';
import { CurrentUserId } from '@core/decorators/current.user';
import { UserAboutViewDto } from '../dto/view/user.about.view.dto';
import { CommandBus } from '@nestjs/cqrs';
import { CreateSessionCommand } from '@modules/users-system/application/commands/create.session.usecase';
import { SessionInputDto } from '@modules/users-system/dto/input/session.input.dto';
import { Request, Response } from 'express';
import { SessionIsActiveGuard } from '@core/guards/session.is.active';
import { TokenPayloadDto } from '@modules/users-system/dto/token.payload.dto';
import { DeleteMySessionCommand } from '@modules/users-system/application/commands/delete.my.session.usecase';
import { UpdateSessionCommand } from '@modules/users-system/application/commands/update.session.usecase';
import { SkipThrottle, ThrottlerGuard } from '@nestjs/throttler';
import { CreateUserCommand } from '@modules/users-system/application/commands/create.user.usecase';
import { ConfirmationEmailCommand } from '@modules/users-system/application/commands/confirmation.email.usecase';
import {
    CreateCodeConfirmationEmailCommand
} from '@modules/users-system/application/commands/create.code.confirmation.email.usecase';
import { AskNewPasswordCommand } from '@modules/users-system/application/commands/ask.new.password.usecase';


@Controller(URL_PATH.auth)
@UseGuards(ThrottlerGuard)
export class AuthController {
    constructor(
        private userService: UserService,
        private readonly commandBus: CommandBus,
    ){}

    @Post(AUTH_PATH.login)
    @HttpCode(HttpStatus.OK)
    @UseGuards(AuthGuard('local'))
    async authorization(
        @CurrentUserId() user: string,
        @Req() req: Request,
        @Res({ passthrough: true }) res: Response,
    ):Promise<{accessToken: string}>{

        const device =  req.headers['user-agent'] || 'unknown device';
        const ip = req.ip || 'unknown ip';

        const session: SessionInputDto ={
            userId: user,
            deviceName: device,
            ip: ip
        }
        const refreshToken: string = await this.commandBus.execute(new CreateSessionCommand(session))
        const accessTokens: string = await this.userService.createAccessToken(user)
        res.cookie('refreshToken', refreshToken,
            {httpOnly: true,
            secure: true,})
        return {
            accessToken: accessTokens};
    }

    @Post(AUTH_PATH.registration)
    @HttpCode(HttpStatus.NO_CONTENT)
    async registration(@Body() inputUserDto: UserInputDto) : Promise<void> {

        await this.commandBus.execute(new CreateUserCommand(inputUserDto, false, true));
        return;
    }

    @Post(AUTH_PATH.confirmation)
    @HttpCode(HttpStatus.NO_CONTENT)
    async confirmation(@Body() inputCode: ConfirmCodeInputDto): Promise<void> {

        await this.commandBus.execute(new ConfirmationEmailCommand(inputCode.code));
        return;
    }

    @Post(AUTH_PATH.resentEmail)
    @HttpCode(HttpStatus.NO_CONTENT)
    async reSendMail(@Body() inputEmail:EmailInputDto): Promise<void> {

        await this.commandBus.execute(new CreateCodeConfirmationEmailCommand(inputEmail.email));
        return;
    }

    @Post(AUTH_PATH.askNewPassword)
    @HttpCode(HttpStatus.NO_CONTENT)
    async askNewPassword(@Body() inputEmail:EmailInputDto):Promise<void> {
        await this.commandBus.execute(new AskNewPasswordCommand(inputEmail.email));
        return;
    }

    @Post(AUTH_PATH.confirmNewPassword)
    @HttpCode(HttpStatus.NO_CONTENT)
    async resentPassword(@Body()recoveryPassport: NewPasswordInputDto):Promise<void> {

        return await this.userService.setNewPassword(recoveryPassport)
    }

    @Get(AUTH_PATH.aboutMe)
    @SkipThrottle()
    @UseGuards(AuthGuard('jwt'))
    async getMe(@CurrentUserId() user: string)//: Promise<UserAboutViewDto>
    {
        const answer: UserAboutViewDto = await this.userService.aboutMe(user)
        return answer;
    }

    @Post(AUTH_PATH.logout)
    @HttpCode(HttpStatus.NO_CONTENT)
    @SkipThrottle()
    @UseGuards(SessionIsActiveGuard)
    async logOut(
        @CurrentUserId() user: TokenPayloadDto,
    ):Promise<void>{

        await this.commandBus.execute(new DeleteMySessionCommand(
            user.userId,
            user.deviceId));
        return;
    }

    @Post(AUTH_PATH.refresh)
    @HttpCode(HttpStatus.OK)
    @SkipThrottle()
    @UseGuards(SessionIsActiveGuard)
    async newRefreshToken(
        @CurrentUserId() user: TokenPayloadDto,
        @Res({ passthrough: true }) res: Response,
    ):Promise<{accessToken: string}>{

        const refreshToken: string = await this.commandBus.execute(new UpdateSessionCommand(user))
        const accessTokens: string = await this.userService.createAccessToken(user.userId)
        res.cookie('refreshToken', refreshToken,
            {httpOnly: true,
                secure: true,})
        return {
            accessToken: accessTokens};
    }
}
