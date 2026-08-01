import {
    Body,
    Controller,
    Delete,
    Get,
    HttpCode,
    HttpStatus,
    Param,
    Post,
    Query, UseGuards,
} from '@nestjs/common';
import { UserInputDto } from '../dto/input/user.input.dto';
import { UserViewDto } from '../dto/view/user.view.dto';
import { UserQueryRepository } from '../infrastucture/query/user.query.repository';
import { PaginatedViewDto } from '@core/dto/base.paginated.view.dto';
import { GetUserQueryParams } from '../dto/input/get.user.query.params';
import { AuthGuard } from '@nestjs/passport';
import { URL_PATH } from '@core/url.path.setting';
import { IdInputDto } from '@core/dto/input/id.Input.Dto';
import { ApiBasicAuth } from '@nestjs/swagger';
import { CommandBus } from '@nestjs/cqrs';
import { SkipThrottle } from '@nestjs/throttler';
import { DeleteUserCommand } from '@modules/users-system/application/commands/delete.user.usecase';
import { CreateUserCommand } from '@modules/users-system/application/commands/create.user.usecase';

@SkipThrottle()
@UseGuards(AuthGuard('basic'))
@ApiBasicAuth()
@Controller(URL_PATH.usersAdmin)
export class UserControllers {
    constructor(
        private commandBus: CommandBus,
        private userQueryRepository: UserQueryRepository,
    ) {}

    @Post()
    @HttpCode(HttpStatus.CREATED)
    async createUser(@Body() inputUserDto: UserInputDto):Promise<UserViewDto> {

        const createId: string = await this.commandBus.execute(new CreateUserCommand(inputUserDto, true));
        const userView: UserViewDto = await this.userQueryRepository.findById(createId);
        return userView;
    }

    @Get()
    async getAll(@Query() query: GetUserQueryParams,)
        : Promise<PaginatedViewDto<UserViewDto>> {

        const userPaginator: PaginatedViewDto<UserViewDto>
            = await this.userQueryRepository.find(query);

        return userPaginator;

    }

    @Delete(':id')
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteUser(@Param() { id }: IdInputDto): Promise<void>{
        return await this.commandBus.execute(new DeleteUserCommand(id));
    }
}