import { registerDecorator, ValidationOptions } from 'class-validator';
import { SortByWithDirectionConstraint } from '@core/decorators/sort.by.with.direction.constraint';

export function IsSortByWithDirection(validationOptions?: ValidationOptions) {
    return function (object: Object, propertyName: string) {
        registerDecorator({
            name: 'IsSortByWithDirection',
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: SortByWithDirectionConstraint,
        });
    };
}