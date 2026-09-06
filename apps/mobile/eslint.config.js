const expoConfig = require('eslint-config-expo/flat');

/**
 * The layering rules below are the architectural guard described in CLAUDE.md:
 * the domain layer stays pure so it can be tested without a device, and screens
 * reach storage only through repositories.
 */
module.exports = [
  ...expoConfig,
  {
    ignores: [
      'node_modules/*',
      '.expo/*',
      'dist/*',
      'coverage/*',
      'android/*',
      'ios/*',
    ],
  },
  {
    files: ['src/domain/**/*.ts'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: [
                'react',
                'react-dom',
                'react-native',
                'react-native/**',
                'react-native-*',
                'expo',
                'expo-*',
                'nativewind',
                'zustand',
                '@/db',
                '@/db/**',
                '@/ui',
                '@/ui/**',
                '@/notifications/**',
                '../db/**',
                '../notifications/**',
                '../ui/**',
              ],
              message:
                'The domain layer must stay pure. No React, React Native, Expo, storage or UI imports: it is tested without an emulator.',
            },
          ],
        },
      ],
    },
  },
  {
    files: ['app/**/*.ts', 'app/**/*.tsx'],
    rules: {
      'no-restricted-imports': [
        'error',
        {
          patterns: [
            {
              group: ['@/db/client', '@/db/key', '@/db/migrations/**'],
              message:
                'Screens must not touch the database directly. Go through src/db/repositories.',
            },
          ],
        },
      ],
    },
  },
];
