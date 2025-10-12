import { render } from '@analogjs/router/server'
import '@angular/platform-server/init'
import 'zone.js/node'

import { AppComponent } from '@dalenguyen/portfolio/shell/feature'
import { config } from './app/app.config.server'

export default render(AppComponent, config)
