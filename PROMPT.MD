# Tasks
## Migrate location of new Sanity / ESLint / TSConfig files
- [x] Do not remove any TypeScript/Node scripts from /bin
- [x] Move TS files from /bin/migrations/src to /bin/migrations.
    - [x] Update any references to these files in npm scripts, README, etc.
- [x] Have a single tsconfig.json at the root of the project. This might mean combining tsconfig.eslint.json and tsconfig.sanity.json.
- [x] Fix import paths in /studio directory.
- [x] Use instructions at https://www.sanity.io/docs/apis-and-sdks/cli#k4baf8325e0e3 to avoid using `cd studio && ` in all of our NPM scripts.
- [x] Make sure TSConfig and ESLint are applicable to all TypeScript files in our project. JS files in the legacy source code, /src, should be omitted.
- [x] Fix all ES Lint / TS compilation problems in the project.
