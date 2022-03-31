import { http } from '@google-cloud/functions-framework'

const universal = require(`${process.cwd()}/dist/apps/ng-ssr/assets/portfolio/server`).app

console.log(process.cwd())
http('app', universal)
