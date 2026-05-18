import { DomainExceptionCode } from '@core/exceptions/domain.exception.code';

export class DomainException extends Error {
    message: string;
    code: DomainExceptionCode;
    extension: Extension[];

    constructor(ErrorInfo   :{
        message     : string,
        code: DomainExceptionCode,
        extension?: Extension[],
    }) {
        super(ErrorInfo.message)
        this.code = ErrorInfo.code;
        this.extension = ErrorInfo.extension || [];
    }
}

export class Extension {
    constructor(
        public message: string,
        public field: string,
    ) {}
}