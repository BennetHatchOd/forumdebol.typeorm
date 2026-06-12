import { INestApplication } from '@nestjs/common';
import type { Response } from 'supertest';
import request from 'supertest';

export const deleteAllData
    = async (app: INestApplication, prefix: string): Promise<Response> => {
    return request(app.getHttpServer()).delete(prefix + `/testing/all-data`);
};