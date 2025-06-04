import React, { useEffect, useState } from 'react';

function ThemeToggle() {
  const [dark, setDark] = useState(false);

  useEffect(() => {
    if (dark) {
      document.body.classList.add('dark');
      document.body.classList.remove('light');
    } else {
      document.body.classList.add('light');
      document.body.classList.remove('dark');
    }
  }, [dark]);

  return (
    <button className="p-2 text-sm border rounded" onClick={() => setDark(!dark)}>
      {dark ? 'Tema claro' : 'Tema escuro'}
    </button>
  );
}

export default ThemeToggle;
