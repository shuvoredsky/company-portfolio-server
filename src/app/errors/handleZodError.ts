import status from 'http-status';
import { ZodError } from 'zod';
import { TErrorSource, TGenericErrorResponse } from './AppError';

const handleZodError = (err: ZodError): TGenericErrorResponse => {
  const errorSources: TErrorSource[] = err.issues.map((issue) => {
    const lastSegment = issue.path[issue.path.length - 1];
    return {
      path: lastSegment !== undefined ? String(lastSegment) : '',
      message: issue.message,
    };
  });

  return {
    statusCode: status.BAD_REQUEST,
    message: 'Validation Error',
    errorSources,
  };
};

export default handleZodError;

