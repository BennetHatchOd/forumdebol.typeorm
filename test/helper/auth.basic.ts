import { UserConfig } from '@src/modules/users-system/config/user.config';
import { copyPathResolve } from '@nestjs/cli/lib/compiler/helpers/copy-path-resolve';

export class AuthBasic{
    login: string;
    password: string;

    constructor(private userConfig: UserConfig) {
        this.login = userConfig.adminNameBasicAuth;
        this.password = userConfig.adminPasswordBasicAuth;
    }
    static createAuthHeader(userConfig: UserConfig): string{
        const authBasic = new this(userConfig)
        const buff = Buffer.from(`${authBasic.login}:${authBasic.password}`, 'utf-8');
        const base64 = buff.toString('base64');
        const authheader: string = `Basic ${base64}`;
        return authheader;
    }
}