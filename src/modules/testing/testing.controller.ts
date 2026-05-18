import { Controller, Delete, Get, HttpCode, HttpStatus, Inject } from '@nestjs/common';
import { URL_PATH } from '@core/url.path.setting';
import console from 'node:console';
import { DATA_SOURCE } from '@core/constans/data.source';
import { DataSource } from 'typeorm';

@Controller()
export class TestingController {
    constructor(
        @Inject(DATA_SOURCE) private readonly dataSource: DataSource,
    ) {}

    @Delete(URL_PATH.testing)
    @HttpCode(HttpStatus.NO_CONTENT)
    async deleteAll() {

        const result = await this.dataSource.query(`
                  SELECT table_name
                  FROM information_schema.tables
                  WHERE table_schema = 'public'
                    AND table_type = 'BASE TABLE';
            `);
        const tableNames = result.map((row) => `"${row.table_name}"`).join(', ');
        const result1 = await this.dataSource.query(`TRUNCATE ${tableNames} RESTART IDENTITY CASCADE;`);
        console.log("clear all databases by  deleteAll() ")

    }
    @Get('json/version')
    getVersion() {
        return { browser: 'FakeBrowser/1.0', protocolVersion: '1.3' };
    }

    @Get('json/list')
    getList() {
        return [];
    }
}