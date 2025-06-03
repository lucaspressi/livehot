/**
 * Simple validation helpers for common inputs.
 */

export function isRequired(value) {
  return value !== null && value !== undefined && value !== '';
}

export function isEmail(value) {
  return /^\S+@\S+\.\S+$/.test(value);
}

export function minLength(value, length) {
  return typeof value === 'string' && value.length >= length;
}

export function maxLength(value, length) {
  return typeof value === 'string' && value.length <= length;
}

export default { isRequired, isEmail, minLength, maxLength };
