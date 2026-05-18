import { IsString, Length } from 'class-validator';
import { applyDecorators } from '@nestjs/common';
import { Trim } from './trim';

export const TrimLength = (minLength: number, maxLength: number)=>{
    return applyDecorators(IsString(),Trim(),Length(minLength,maxLength));
}