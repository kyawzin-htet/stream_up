import { ArgumentsHost, ExceptionFilter, HttpException } from '@nestjs/common';
export declare class LocalizedHttpExceptionFilter implements ExceptionFilter {
    catch(exception: HttpException, host: ArgumentsHost): void;
}
