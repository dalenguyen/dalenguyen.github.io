// Interface segregation principle: https://en.wikipedia.org/wiki/Interface_segregation_principle
// Many client-specific interfaces are better than one general-purpose interface.

// Weather Content will utilize WidgetContent & Reloadable
// Meanwhile Velocity Content only utilizes WidgetContent

export interface WidgetContent {
  id: string
}

export interface Reloadable {
  loading: boolean
  reload(): void
}
