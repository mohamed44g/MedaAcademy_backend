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
        host: 'smtp.hostinger.com',
        port: 587,
        auth: {
          user: 'medaplusacademy@med-aplus.com',
          pass: '#159357Ays',
        },
      },
      defaults: {
        from: 'Med A+ Academy <medaplusacademy@med-aplus.com>',
      },
      template: {
        dir: __dirname + '/templates',
        adapter: new HandlebarsAdapter(),
        options: {
          strict: true,
        },
      },
    }),
  ],
  controllers: [UserController],
  providers: [MongoService, UserService, UserModel, DatabaseService],
  exports: [UserService, UserModel],
})
export class UsersModule {}
