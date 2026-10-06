import { ApiError, flattenError } from '../../api/client.js';

const FIELD_LABELS = {
  username: 'Username',
  email: 'Email',
  first_name: 'First name',
  last_name: 'Last name',
  password: 'Password',
  password_confirm: 'Password confirmation',
  non_field_errors: '',
  credentials: '',
};

export function fieldErrorsFrom(error) {
  if (!(error instanceof ApiError)) {
    return { form: 'Something went wrong. Please try again.' };
  }
  const source = error.body?.error ?? error.body;
  if (!source || typeof source !== 'object' || Array.isArray(source)) {
    return { form: flattenError(source) || error.message };
  }
  const entries = Object.entries(source).map(([field, messages]) => [
    field,
    Array.isArray(messages) ? messages.join(' ') : String(messages),
  ]);
  const nonField = entries.filter(([field]) => !(field in FIELD_LABELS));
  if (nonField.length === 1) {
    return { form: nonField[0][1] };
  }
  const formError = flattenError(nonField) || null;
  return {
    ...(formError ? { form: formError } : {}),
    ...Object.fromEntries(entries.filter(([field]) => field in FIELD_LABELS)),
  };
}

export function labelFor(field) {
  return FIELD_LABELS[field] ?? field;
}
