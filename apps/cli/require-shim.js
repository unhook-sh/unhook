// ESM require shim for compatibility with CommonJS modules
import { createRequire } from 'node:module';
import { fileURLToPath } from 'node:url';

const require = createRequire(import.meta.url);
const __filename = fileURLToPath(import.meta.url);
const __dirname = fileURLToPath(new URL('.', import.meta.url));

globalThis.require = require;
globalThis.__filename = __filename;
globalThis.__dirname = __dirname;
