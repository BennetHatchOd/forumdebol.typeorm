import type { TypeOrmModuleOptions } from '@nestjs/typeorm';

export interface DatabaseConfig {
    database: Partial<TypeOrmModuleOptions>;
}

export default (): DatabaseConfig => ({
    database: {
        type: 'postgres',
        host: process.env.DATABASE_HOST,
        port: Number(process.env.DATABASE_PORT ?? 5432),
        username: process.env.DATABASE_USER,
        password: process.env.DATABASE_PASS,
        database: process.env.DATABASE_NAME,
        autoLoadEntities: true,
        synchronize: false,
        logging: true,
    },
});