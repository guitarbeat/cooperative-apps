module.exports = {
  extends: ['airbnb', 'airbnb/hooks', 'prettier'],
  env: {
    browser: true,
    node: true,
    es2022: true,
  },
  parserOptions: {
    ecmaVersion: 'latest',
    sourceType: 'module',
  },
  rules: {
    'react/prop-types': 'off',
    'import/extensions': 'off',
    'react/react-in-jsx-scope': 'off',
    'no-param-reassign': 'off',
    'no-nested-ternary': 'off',
    'no-restricted-syntax': 'off',
    'no-continue': 'off',
    'import/prefer-default-export': 'off',
    'react/function-component-definition': 'off',
    'react/no-array-index-key': 'off',
    'jsx-a11y/label-has-associated-control': 'off',
    'jsx-a11y/click-events-have-key-events': 'off',
    'jsx-a11y/no-static-element-interactions': 'off',
    'jsx-a11y/no-autofocus': 'off',
    'no-console': ['warn', { allow: ['warn', 'error'] }],
    'import/no-extraneous-dependencies': [
      'error',
      {
        devDependencies: [
          'vite.config.js',
          'postcss.config.js',
          'tailwind.config.js',
          '**/*.test.js',
          '**/*.spec.js',
          '**/*.test.jsx',
          '**/*.spec.jsx',
        ],
      },
    ],
  },
};
