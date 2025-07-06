import { Module } from '@nestjs/common';
import { UserController } from './users.controller';
import { UserService } from './users.service';
import { UserModel } from './users.model';
import { DatabaseService } from '../database/database.service';
import { MailerModule } from '@nestjs-modules/mailer';
import { HandlebarsAdapter } from '@nestjs-modules/mailer/dist/adapters/handlebars.adapter';
import { MongoService } from 'src/database/mongo.service';

@Module({
  imports: [
    MailerModule.forRoot({
      transport: {
        host: 'pro.turbo-smtp.com',
        port: 587,
        auth: {
          user: 'medaplus56@gmail.com ',
          pass: 'd38DEmuW',
        },
      },
      defaults: {
        from: 'Med A+ Academy <medaplus56@gmail.com>',
      },
    }),
  ],
  controllers: [UserController],
  providers: [
    MongoService,
    UserService,
    UserModel,
    DatabaseService,
  ],
  exports: [UserService, UserModel],
})
export class UsersModule {}
