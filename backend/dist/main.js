"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
const core_1 = require("@nestjs/core");
const common_1 = require("@nestjs/common");
const config_1 = require("@nestjs/config");
const app_module_1 = require("./app.module");
const pokeapi_service_1 = require("./cards/pokeapi.service");
async function bootstrap() {
    const app = await core_1.NestFactory.create(app_module_1.AppModule, { bufferLogs: false });
    const config = app.get(config_1.ConfigService);
    app.get(pokeapi_service_1.PokeapiService).warmup();
    const corsOrigin = config.get('CORS_ORIGIN') || 'http://localhost:5173';
    app.enableCors({
        origin: corsOrigin.split(',').map((s) => s.trim()),
        credentials: true,
    });
    app.setGlobalPrefix('api');
    app.useGlobalPipes(new common_1.ValidationPipe({
        whitelist: true,
        transform: true,
        forbidNonWhitelisted: false,
    }));
    const port = Number(config.get('PORT')) || 3000;
    await app.listen(port);
    common_1.Logger.log(`ARCADIUM API listening on http://localhost:${port}/api`, 'Bootstrap');
}
bootstrap();
//# sourceMappingURL=main.js.map