# Mvision Template

React TS template support [Typescript](https://www.typescriptlang.org), [ESLint](https://eslint.org), [Prettier](https://prettier.io) and based on [Vite](https://vitejs.dev) bundler.

## Installation

```
$ npx degit Vitaliy-GFL/vite-ts-vanilla-moodmedia/react project-name
$ cd project-name
$ npm install
```

## Utils
Check the `./utils/index.ts` file to see the built-in utils.

## Development
```
$ vite dev
```

## Build
```
//For Windows OS
$ npm run build:windows

//For other
$ npm run build
```

## Other commands
1. Run ESLint to find problems in code
```
$ npm run lint:style
```
2. Run prettier for reformatting code
```
$ npm run lint:formatting
```
3. Run both actions above in 1 command
```
$ npm run lint
```
4. Create *.zip file with previously builded project files.
  - For Windows OS:
```
$ npm run compile:windows
```
  - For other
```
$ npm run compile
```