
import { defineConfig } from 'vite';

export default defineConfig({
  // Compatible avec GitHub Pages et les dépôts hébergés en sous-dossier.
  base: './',

  // Utilise le nouveau runtime JSX de React.
  // Évite d'avoir besoin d'un import React global dans cachalot.jsx.
  esbuild: {
    jsx: 'automatic',
  },
});
