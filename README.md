# Dale Nguyen Portfolio Website

This Monorepo project was generated with Angular 12, Nx Workspace and published to Github Pages.

This project will host on two places:

- Github Pages: https://dalenguyen.github.io
- Heroku: http://dalenguyen.me (Server Side Rendering & SEO support)

## Development server

Run `npm run dev` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Generate a new app / library

```
nx generate @nrwl/angular:app myApp
nx generate @nrwl/angular:library mylibrary --buildable --publishable
nx generate @nrwl/express:application <express-app>

# NPM package
nx generate @nrwl/node:library name --importPath @dalenguyen/name --publishable 

```


## Update sentry

After deploying new feature or fix a bug. The Sentry release should be updated.

```sh
sh sentry-release.sh
```

## Angular Universal

For Development

```sh
npm run dev:ssr
```

For Production

```sh
npm run start:ssr
```

## TODO

- Using NX Cloud for Building with Github Actions

## Contribution

Any contribution to this project are welcome. Please read the [contribution guideline](https://github.com/dalenguyen/dalenguyen.github.io/blob/dev/CONTRIBUTING.md)
