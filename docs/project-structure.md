# Project Structure

Reference from https://nx.dev/guides/monorepo-nx-enterprise & https://nx.dev/structure/applications-and-libraries#applications-and-libraries

Having a dedicated library project is a much stronger boundary compared to just separating code into folders, though. Each Nx library has a so-called "public API", represented by an index.ts barrel file. This forces developers into an "API thinking" of what should be exposed and thus be made available for others to consume, and what on the others side should remain private within the library itself.

Example structure for a portfolio Angular webapp

```
.
└── root
    ├── apps
    │   └── portfolio
    |
    └── libs
        └── portfolio
        |    ├── shell (dir)
        |    │   └── feature (angular:lib) - forRoot modules
        |    |
        |    └── home (dir)
        |    |   ├── feature (angular:lib) - smart UIs
        |    |   ├── ui (dir) - presentation components (standalone)
        |    |   └── utils (dir) - common services
        |    |
        |    └── shared (dir) - assets / images...
        |
        └── angular (dir) - angular libs for angular apps
        |   ├── ui (dir)
        |   ├── pipes (dir)
        |   ├── directives (dir)
        |   └── utils (angular:lib - shared Services, Guards, Interceptors, Validators...)
        |
        └── web - libs that can be consumed by web apps
        |
        └── shared (dir) - pure functions that shares across apps & libs

```
