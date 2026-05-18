import { ArgumentsHost, Catch, ExceptionFilter } from '@nestjs/common';
import { Request, Response } from 'express';
import { DomainException } from '@core/exceptions/domain.exception';
import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

@Catch(DomainException)
export class DomainExceptionFilter implements ExceptionFilter {
    catch(exception: DomainException, host: ArgumentsHost) {
        const ctx = host.switchToHttp();
        const response = ctx.getResponse<Response>();
        const request = ctx.getRequest<Request>();

        const status = this.mapToHttp(exception);
        //if (exception.code === DomainExceptionCode.ValidationError)
        if (status === 400)
            response.status(status).json({
                errorsMessages: exception.extension,
            })
        else
            response.status(status).json({})
    }
    mapToHttp(exception: DomainException): number {
        switch (exception.code) {
            case DomainExceptionCode.BadRequest:
            case DomainExceptionCode.ValidationError:
            case DomainExceptionCode.EmailNotConfirmed:
            case DomainExceptionCode.EmailNotExist:
            case DomainExceptionCode.ConfirmationCodeExpired:
            case DomainExceptionCode.PasswordRecoveryCodeExpired:
            case DomainExceptionCode.PasswordRecoveryCodeNotFound:
                return 400;
            case DomainExceptionCode.NotFound:
                return 404;
            case DomainExceptionCode.Forbidden:
                return 403;
            case DomainExceptionCode.Unauthorized:
            case DomainExceptionCode.RefreshTokenNotVerify:
                return 401;
            case DomainExceptionCode.InternalServerError:
            case DomainExceptionCode.TooManyEntiriesInDB:
                return 500;
        }
        return 500;
    }
}

