import { Contains, IsEmail, IsIn, IsInt, IsOptional, Length, Max, Min, } from 'class-validator';
export class Post {
    @Length(10, 20)
    title: string = "";

    @Contains('hello')
    @IsOptional()
    text: string = "";

    @IsInt()
    @Min(0)
    @Max(10)
    rating: number = 0;
}

export class User {
    @Length(5, 20)
    userName: string = ""

    @IsEmail()
    email: string = ""

    @IsIn(["user", "admin"])
    role: string = ""
}