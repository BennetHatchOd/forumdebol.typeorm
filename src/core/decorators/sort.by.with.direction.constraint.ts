import {
    ValidatorConstraint,
    ValidatorConstraintInterface,
    ValidationArguments,
} from 'class-validator';
import { GamesUsersTopSortBy } from '@modules/quiz/dto/input/get.all.statistics.query.params';
import { SortDirection } from '@core/dto/base.query.params.input.dto';

@ValidatorConstraint({ name: 'SortByWithDirection', async: false })
export class SortByWithDirectionConstraint implements ValidatorConstraintInterface {
    validate(value: unknown, _args: ValidationArguments): boolean {
        if (typeof value === 'string') {
            return this.isValidItem(value);
        }

        if (Array.isArray(value)) {
            return value.every((item) => typeof item === 'string' && this.isValidItem(item));
        }

        return false;
    }

    defaultMessage(): string {
        return 'sortBy must be a string or array of strings in format "[GamesUsersTopSortBy] [SortDirection]".';
    }

    private isValidItem(value: string): boolean {
        const [sortBy, sortDirection, ...rest] = value.trim().split(/\s+/);

        if (!sortBy || !sortDirection || rest.length > 0) return false;

        return (
            Object.values(GamesUsersTopSortBy).includes(sortBy as GamesUsersTopSortBy) &&
            Object.values(SortDirection).includes(sortDirection as SortDirection)
        );
    }
}