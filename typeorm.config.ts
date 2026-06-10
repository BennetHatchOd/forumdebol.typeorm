import { config } from 'dotenv';
import { DataSource } from 'typeorm';

// config({ path: '.env' });
config({ path: 'src/env/.env.development.local' });

export default new DataSource({
    host: process.env.DATABASE_HOST,
    port: Number(process.env.DATABASE_PORT ?? 5432),
    username: process.env.DATABASE_USER,
    password: process.env.DATABASE_PASS,
    database: process.env.DATABASE_NAME,
    type: 'postgres',
    migrations: ['src/migrations/*.ts'],
    entities: ['src/**/*.entity.ts'],
});