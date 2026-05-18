import bcrypt from 'bcrypt'

export class PasswordHashService {

    async createHash(password: string, saltRounds:number):Promise<string>{
        const salt: string = await bcrypt.genSalt(saltRounds)
        const hash: string = await bcrypt.hash(password, salt)

        return hash;
    }

    async checkHash(password: string, hash: string):Promise<boolean>{

        return await bcrypt.compare(password, hash)
    }
}