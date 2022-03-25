import { getFunction } from '@google-cloud/functions-framework/build/src/testing'

describe('Hello Tests', () => {
  beforeAll(async () => {
    // load the module and get the function
    await import('./main')
  })

  it('test helloGET', () => {
    // call the function
    const helloGET = getFunction('helloGET')

    const req = {
      query: {
        name: 'Dale',
      },
    } as any
    let result
    const res = {
      send: (x) => {
        result = x
      },
    } as any

    // invoke the function
    helloGET(req, res, () => {})

    // check the response
    expect(result).toEqual('Hello Dale!')
  })
})
