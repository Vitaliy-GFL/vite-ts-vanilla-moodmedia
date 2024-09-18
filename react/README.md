# Mvision Template

React TS template support [Typescript](https://www.typescriptlang.org), [ESLint](https://eslint.org), [Prettier](https://prettier.io) and based on [Vite](https://vitejs.dev) bundler.

## Instalation

```
$ npx degit Vitaliy-GFL/vite-ts-vanilla-moodmedia/react project-name
$ cd project-name
$ npm install
```

## Develop
```
$ vite dev
```

## Build
For OS Windows:
```
$ npm run build:windows
```
For others:
```
$ npm run build
```

## Other commands
1. Run ESLint to find problems in code
```
$ npm run lint:style //run checking errors
```
2. Run prettier for reformatting code
```
$ npm run lint:formatting
```
3. Run both actions above in 1 conmmand
```
$ npm run lint
```

Create *.zip file with previously builded project files.
```
//for Windows OS
$ npm run compile:windows

//for other OS
$ npm run compile
```