export function createLoadingSpinner(className = '') {
  const spinner = document.createElement('div');
  spinner.className = `animate-spin rounded-full border-4 border-t-transparent border-gray-200 ${className}`;
  spinner.style.width = '2rem';
  spinner.style.height = '2rem';
  return spinner;
}
