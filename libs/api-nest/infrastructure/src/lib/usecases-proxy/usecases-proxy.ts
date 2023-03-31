export class UseCasesProxy<T> {
  constructor(private readonly useCase: T) {}

  getInstance(): T {
    return this.useCase
  }
}
