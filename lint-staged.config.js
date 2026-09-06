module.exports = {
  '*.{ts,tsx,js,cjs,mjs,json,md,yml,yaml,css}': 'prettier --write',
  'apps/mobile/**/*.{ts,tsx}': () => 'pnpm --filter @yakir/mobile lint',
};
