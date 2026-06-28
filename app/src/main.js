import { createApp } from './app.js';

const root = document.getElementById('app');
if (!root) {
  console.error('Missing #app root element');
} else {
  createApp(root);
}
