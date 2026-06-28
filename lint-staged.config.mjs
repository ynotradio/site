const eslintCmd = (files) =>
  `eslint --fix --max-warnings=0 --ignore-pattern 'bin/check-test-story-files.ts' --ignore-pattern '.storybook/*' --ignore-pattern 'payload/migrations/*' ${files.join(' ')}`;

const filterLintIgnored = (files) =>
  files.filter(
    (f) =>
      !f.includes('/.storybook/') &&
      !f.endsWith('next-env.d.ts') &&
      !f.includes('/bin/migrations/'),
  );

export default {
  '!(*.test).{ts,tsx}': (files) => {
    const filtered = filterLintIgnored(files);
    if (!filtered.length) return [];
    return [`prettier --write ${filtered.join(' ')}`, eslintCmd(filtered)];
  },
  '*.test.{ts,tsx}': (files) => {
    const filtered = filterLintIgnored(files);
    if (!filtered.length) return [];
    return [`prettier --write ${filtered.join(' ')}`, eslintCmd(filtered)];
  },
  '*.{json,md}': (files) => [`prettier --write ${files.join(' ')}`],
};
