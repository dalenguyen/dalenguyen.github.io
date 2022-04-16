import { cloudEvent, http } from '@google-cloud/functions-framework'
import 'tslib' // needed until importHelpers is set to false

http('helloGET', (req, res) => {
  res.send(`Hello ${req.query.name || req.body.name || 'World'}!`)
})

// Register a CloudEvent callback with the Functions Framework that will
// be executed when the Pub/Sub trigger topic receives a message.
cloudEvent<{ message: { data: string } }>('helloPubSub', (event) => {
  // The Pub/Sub message is passed as the CloudEvent's data payload.
  const name = getName(event)
  console.log(`Hello, ${name}!`)
})

export const getName = (event: any) => {
  const base64name = event.data.message.data
  return base64name ? Buffer.from(base64name, 'base64').toString() : 'World'
}
