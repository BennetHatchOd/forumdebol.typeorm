import { NestExpressApplication } from '@nestjs/platform-express';
import { pipesSetup } from './pipes.setup';
import { swaggerSetup } from '@src/setup/swagger.setup';
import { HttpExceptionFilter } from '@core/exceptions/filters/http.exception.filter';
import { DomainExceptionFilter } from '@core/exceptions/filters/domain.exception.filter';
import passport from 'passport';
import cookieParser from 'cookie-parser';

export function appSetup(
    app: NestExpressApplication,
    isSwaggerEnable: boolean,
    globalPrefix: string
){
    pipesSetup(app);
    app.setGlobalPrefix(globalPrefix);
    swaggerSetup(app, isSwaggerEnable, globalPrefix);
    app.enableCors();
    app.use(passport.initialize());
    app.set('trust proxy', 1);
    app.use(cookieParser());
    app.useGlobalFilters(new DomainExceptionFilter(), new HttpExceptionFilter());
}