import { getFunction } from '@google-cloud/functions-framework/build/src/testing'
import { CloudEvent } from 'cloudevents'
import * as Main from './main'

describe('HelloCloudEvent', () => {
  beforeAll(async () => {
    // load the module that defines HelloCloudEvent
    await import('./main')
  })

  it('uses getName', () => {
    const getName = jest.spyOn(Main, 'getName')

    const helloPubSub = getFunction('helloPubSub') as any
    helloPubSub(
      new CloudEvent({
        type: 'com.google.cloud.functions.test',
        source: 'https://github.com/GoogleCloudPlatform/functions-framework-nodejs',
        data: {
          message: {
            data: 'V29ybGQ=',
          },
        },
      }),
    )
    // assert that the cloud function invoked `getName()`
    expect(getName).toHaveBeenCalled()
    expect(getName).toHaveReturned()
    expect(getName).toHaveNthReturnedWith(1, 'World')
  })
})
