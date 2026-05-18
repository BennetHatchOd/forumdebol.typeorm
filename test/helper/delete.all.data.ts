import { INestApplication } from '@nestjs/common';
import request from 'supertest';

export const deleteAllData = async (app: INestApplication, prefix: string) => {
    return request(app.getHttpServer()).delete(prefix + `/testing/all-data`);
};