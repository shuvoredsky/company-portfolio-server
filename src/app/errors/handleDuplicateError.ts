import status from 'http-status';
import { TErrorSource, TGenericErrorResponse } from './AppError';

export interface DuplicateKeyError {
  code?: number;
  keyValue?: Record<string, unknown>;
  message: string;
}

const handleDuplicateError = (err: DuplicateKeyError): TGenericErrorResponse => {
  let path = '';
  let value = 'Resource';

  if (err.keyValue) {
    const firstEntry = Object.entries(err.keyValue)[0];
    if (firstEntry) {
      path = firstEntry[0];
      value = String(firstEntry[1]);
    }
  } else {
    const dupMatch = err.message.match(
      /dup key:\s*\{\s*([^:]+):\s*"?([^"}\s]+)"?\s*\}/i,
    );
    if (dupMatch && dupMatch[1] && dupMatch[2]) {
      path = dupMatch[1].trim();
      value = dupMatch[2].trim();
    } else {
      const quotedMatch = err.message.match(/"([^"]*)"/);
      if (quotedMatch && quotedMatch[1]) {
        value = quotedMatch[1];
      }
    }
  }

  const errorSources: TErrorSource[] = [
    {
      path,
      message: `${value} already exists`,
    },
  ];

  return {
    statusCode: status.CONFLICT,
    message: 'Duplicate Entry',
    errorSources,
  };
};

export default handleDuplicateError;

