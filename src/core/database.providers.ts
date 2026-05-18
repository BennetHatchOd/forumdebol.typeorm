
import { DataSource } from 'typeorm';
import { DATA_SOURCE } from '@core/constans/data.source';

export const databaseProviders = [
    {
        provide: DATA_SOURCE,
        useFactory: async () => {
            const dataSource = new DataSource({
                type: 'postgres',
                host: 'localhost',
                port: 5432,
                username: 'nodejs',
                password: 'node',
                database: 'myTest',
                // entities: [
                //     __dirname + '/../**/*.entity{.ts,.js}',
                //],
                synchronize: false,
                //autoLoadEntities: false
            });

            return dataSource.initialize();
        },
    },
];