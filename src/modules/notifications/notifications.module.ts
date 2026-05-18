import { Module } from '@nestjs/common';
import { EmailService } from './application/email.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { CoreConfig } from '@core/core.config';

// @Module({
//   imports: [
//     MailerModule.forRoot({
//       transport: {
//         service: 'gmail',
//         secure: false,
//         auth: {
//           user: 'vng114.work@gmail.com',
//           pass: UserConfig.passwordEmail,
//         },
//       },
//       defaults: {
//         from: '"No Reply" <vng114.work@gmail.com>',
//       },
//     }),
//   ],
//   providers: [EmailService],
//   exports: [EmailService], // 👈 export for DI
// })
// export class NotificationsModule {}

@Module({
  imports: [
    MailerModule.forRootAsync({
      inject: [CoreConfig],
      useFactory: (coreConfig: CoreConfig) => ({
        transport: {
          service: 'gmail',
          secure: false,
          auth: {
            user: 'vng114.work@gmail.com',
            pass: coreConfig.passwordEmail,
          },
        },
        defaults: {
          from: '"No Reply" <vng114.work@gmail.com>',
        },
      }),
    }),
  ],
  providers: [EmailService, CoreConfig],
  exports: [EmailService],
})
export class NotificationsModule {}
