import { Injectable } from '@nestjs/common';
import { CoreConfig } from '@core/configs/core.config';

@Injectable()
export class AppService {
    constructor(private readonly coreConfig: CoreConfig) {
    }

    getVersion(): string {
        return this.coreConfig.versionApp;
    }
}
