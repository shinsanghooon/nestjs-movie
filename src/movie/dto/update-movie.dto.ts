import { IsNotEmpty, IsOptional, registerDecorator, ValidationArguments, ValidationOptions, ValidatorConstraint, ValidatorConstraintInterface } from "class-validator";



@ValidatorConstraint()
class PasswordValidator implements ValidatorConstraintInterface  {
    validate(value: any, validationArguments?: ValidationArguments): Promise<boolean> | boolean {
        return value.length > 4 && value.length < 8;
    }
    defaultMessage?(validationArguments?: ValidationArguments): string {
        return '비밀번호의 길이는 4~8자입니다.($value)'
    }
}

function IsPasswordValid(validationOptions?: ValidationOptions) {
    return function(object: Object, propertyName: string){
        registerDecorator({
            target: object.constructor,
            propertyName,
            options: validationOptions,
            validator: PasswordValidator,
        })
    }
}

export class UpdateMovieDto{
    
    @IsNotEmpty()
    @IsOptional()
    title?: string;
    
    @IsNotEmpty()
    @IsOptional()
    genre?: string;

    // @IsDefined() // null || undefined
    // test: string;

    // @Equals("factory")
    // ttt:  string;

    // @Validate(PasswordValidator)
    // @IsPasswordValid()
    // emptyText: string;
}