# Dale Nguyen Portfolio Website - TEST 2

This Monorepo project was generated with Angular 12, Nx Workspace and published to Github Pages.

This project will host on two places:

- Github Pages: https://dalenguyen.github.io
- Heroku: http://dalenguyen.me (Server Side Rendering & SEO support)

## Project Structure

- [Portfolio](/docs/project-structure.md)

## Development server

Run `npm run dev` for a dev server. Navigate to `http://localhost:4200/`. The app will automatically reload if you change any of the source files.

## Generate a new app / library

```
nx generate @nx/angular:app myApp
nx generate @nx/angular:library mylibrary --buildable --publishable
nx generate @nx/express:application <express-app>

# sub modules
nx g m --name=parent --module=app-routing --route=parent --routing
nx g m --name=parent/child --module=parent/parent-routing --route=child --routing

# NPM package
nx generate @nx/node:library name --importPath @dalenguyen/name --publishable

```

## NestJS commands

```
npx nx g @nx/nest:module path/module-name
npx nx g @nx/nest:service path/service-name
npx nx g @nx/nest:filter path/filter-name
npx nx g @nx/nest:interceptor path/interceptor-name
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
