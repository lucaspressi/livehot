/**
 * Functions for formatting common data types.
 */

export function formatDate(date, locale = 'pt-BR') {
  return new Date(date).toLocaleDateString(locale);
}

export function formatNumber(number, locale = 'pt-BR') {
  return new Intl.NumberFormat(locale).format(number);
}

export function formatCurrency(value, locale = 'pt-BR', currency = 'BRL') {
  return new Intl.NumberFormat(locale, { style: 'currency', currency }).format(value);
}

export function truncate(text, length = 50) {
  return typeof text === 'string' && text.length > length
    ? `${text.slice(0, length)}...`
    : text;
}

export default { formatDate, formatNumber, formatCurrency, truncate };
