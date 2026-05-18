import { INestApplication } from '@nestjs/common';
import { DocumentBuilder, SwaggerModule } from '@nestjs/swagger';

export function swaggerSetup(app: INestApplication, isSwaggerEnabled: boolean, globalPrefix: string) {
    if (isSwaggerEnabled) {
        const config = new DocumentBuilder()
            .setTitle('BLOG-POST API')
            .addBearerAuth()
            .addBasicAuth(
                {
                    type: 'http',
                    scheme: 'basic',
                },
                'basicAuth',
            )
            .setVersion('1.0')
            .build();

        const document = SwaggerModule.createDocument(app, config);
        SwaggerModule.setup(globalPrefix, app, document, {
            customSiteTitle: 'Blog-Post Swagger',
        });
    }
}
