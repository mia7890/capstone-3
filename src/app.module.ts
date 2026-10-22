import { Module } from '@nestjs/common';
import { ServeStaticModule } from '@nestjs/serve-static';
import * as path from 'path';
import { ApiController } from './controllers/api.controller';
import { AdminController, AuthController } from './controllers/auth.controller';
import { AuthService } from './services/auth.service';
import { InventoryService } from './services/inventory.service';
import { NoteParserService } from './services/note-parser.service';

@Module({
  imports: [
    ServeStaticModule.forRoot({
      rootPath: path.join(process.cwd(), 'public'),
      exclude: ['/api/(.*)'],
    }),
  ],
  controllers: [ApiController, AuthController, AdminController],
  providers: [NoteParserService, InventoryService, AuthService],
})
export class AppModule {}
