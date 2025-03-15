---
title: Building PDF Open Source Services with Angular & GCP — Handling long processing tasks
slug: 2024-07-06-building-open-source-pdf-services-with-angular-and-gcp-handling-long-processing-tasks
description: Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.
categories: ['angular', 'tutorial', 'gcp']
coverImage: https://dalenguyen.me/assets/images/blog/angular-pdf-service.webp
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2024-07-06T15:17:31.359Z
author: Dale Nguyen
---

<figure>
  <img src="assets/images/blog/angular-pdf-service.webp" alt="PDFun — Open Source PDF Services" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>PDFun — Open Source PDF Services</figcaption>
</figure>

Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.

- Part 1: [Architecture Overview](blog/2024-06-03-building-open-source-pdf-services-with-angular-and-gcp-architecture-overview)
- Part 2: [Deploy services to Cloud Run](blog/2024-06-08-building-open-source-pdf-services-with-angular-and-gcp-deploy-services-to-cloud-run)
- Part 3: **[Handling long processing tasks](blog/2024-07-06-building-open-source-pdf-services-with-angular-and-gcp-handling-long-processing-tasks)**
- Part 4: [PDF AI Chat](blog/2025-03-10-building-open-source-pdf-services-with-angular-and-gcp-pdf-ai-chat)

Demo: <https://pdfun.xyz>

GitHub - [dalenguyen/pdfun](https://github.com/dalenguyen/pdfun)

The solution is built around GCP ecosystem, it’s better to deploy the project on GCP, so it can access their services. There are two parts of the solution:

- Web UI (Analogjs — Angular): handle user interaction
- Backend (Node — Express): process PDF files

Building PDF services involves uploading, downloading, and processing PDF files, which can take significant time. This article will explore methods for handling these long processing tasks efficiently.

## Normal API Requests and Their Pitfalls

Typically, when a client makes an API request, the server processes the request and sends back a response. This synchronous approach works well for short tasks. However, it has its pitfalls when it comes to long processing tasks.

The main issue is that the client has to wait for the server to complete the task before it can receive a response. This can lead to a poor user experience, especially if the task takes a long time to complete.

Additionally, most browsers and client-side libraries have a timeout limit for API requests. If the server doesn’t respond within this limit, the request is automatically cancelled.

## Maximum Timeout from the Client Side

The maximum timeout for an API request varies depending on the client-side library or browser. For instance, the default timeout in Angular’s HttpClient is 0, which means it waits indefinitely for a response. However, [browsers like Chrome](https://source.chromium.org/chromium/chromium/src/+/main:net/socket/client_socket_pool.cc;l=41) and Firefox have a maximum timeout of around 300 seconds (5 minutes). If the server doesn’t respond within this timeframe, the request is terminated.

## Common Methods to Handle Long Requests from Client Side

There are several methods to handle long requests from the client side:

1. Polling: The client makes a request to the server and then periodically sends follow-up requests to check if the task is complete.
2. Long Polling: The client makes a request to the server, which holds the request open until the task is complete or a timeout occurs.
3. WebSockets: A persistent, two-way communication channel is established between the client and server, allowing the server to send a response when the task is complete.
4. Server-Sent Events: The server sends updates to the client over a single, long-lived connection.

While these methods can be effective, they also have their drawbacks, such as increased complexity and potential for resource inefficiency.

### Example of Polling

Here is an example of implementing polling in Angular.

```typescript
// polling.component.ts

INTERVAL = 2000 // 2 seconds
data = signal({})

timer(0, this.INTERVAL)
  .pipe(
    // stop the API request
    takeUntil(this.stopTimer$),
    delay(1000),
    // function to get data from the server
    switchMap(() => this.getData()),
    // retry if error happened
    retry(),
  )
  .subscribe({
    next: (res: any) => {
      if (res.status === 'SUCCEED') {
        this.stopTimer$.next(true)
      }
      this.data.set(res)
    },
    error: (error: Error) => {
      this.errorMessage.set(error.message)
    },
  })
```

The function utilize timer operator from rxjs to run an interval (2s) to retrieve data from the server by using getData(). It can be stopped by emitting the stopTimer$ when the component is destroyed or the desired data is retrieved.

### Example of SSE (Server-sent events)

Here is an example of implementing SSE from the server:

```typescript
// server (Analogjs - Nitro server)

export default defineEventHandler(async (event) => {
  const eventStream = createEventStream(event)

  const interval = setInterval(async () => {
    await eventStream.push(`Message @ ${new Date().toLocaleTimeString()}`)
  }, 1000)

  eventStream.onClosed(async () => {
    clearInterval(interval)
    await eventStream.close()
  })

  return eventStream.send()
})
```

We utilizing createEventStream to create a stream and set an interval (1s) as example to stream string data from server to the client.

Let’s have a look at the client implementation:

```typescript
constructor() {
  // using afterNextRender to make sure the code is running from the browser
  afterNextRender(() => {
  this.eventSource = new EventSource('/api/v1/sse');

      this.eventSource.onmessage = (event) => {
        this.data.set(event.data);
      };

  });
}

ngOnDestroy() {
  this.eventSource?.close();
}
```

We create an event source using EventSource that points to our server. After that, we can listen to data from the server by using this.eventSource.onmessage callback method.

## Utilizing GCP Cloud Run and Firestore to Handle Long Requests

Google Cloud Platform (GCP) offers powerful tools to handle long processing tasks. Specifically, we can leverage Cloud Run and Firestore.

Here’s the architecture flow for the PDF resize service:

<figure>
  <img src="assets/images/blog/pdf-resize-architecture-overview.webp" alt="PDF resize service architecture" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>PDF resize service architecture</figcaption>
</figure>

You read the [first article](blog/2024-06-03-building-open-source-pdf-services-with-angular-and-gcp-architecture-overview) to understand more about this PDF resize service.

By utilizing Firestore, we don’t have implement polling or server-sent events ourself which is much more convenient. This is the beauty of Backend as service 😉.

From the frontend, we can observe data changes from the Firestore and allow user to download resized file when it’s ready. Let’s have a look at the example code:

```typescript
// the code is simplified for better understand.

docRef = doc(this.firestore, `${this.generateFilePath()}/${this.currentID()}`)

pdf = computed(() => {
  // return an observable of data
  return docData(this.docRef()) as Observable<UploadedFile>
})

downloadUrl$ = this.pdf().pipe(
  // only get data with taskReponse object
  filter((doc) => Object.keys(doc?.taskResponse ?? {}).length > 0),
  switchMap((doc) => {
    // handling & validate response data

    return this.getDownloadLink(`${doc.filePath}/${doc.taskResponse?.fileName}`)
  }),
)
```

All we need to do is to create a listener from our frontend code, and the server will send the data back to us when it’s ready! You can test it out at https://pdfun.xyz.

In conclusion, handling long processing tasks in web development can be challenging, but with the right tools and strategies, it’s definitely manageable. By leveraging the power of Angular and GCP, we can build robust PDF open source services that handle long processing tasks effectively and efficiently.

## Questions?

If you have any questions or run into any issues, please don’t hesitate to [create an issue](https://github.com/dalenguyen/pdfun/issues) on our GitHub repository. Alternatively, you can chat with me. I’m here to help and would love to hear your feedback.

Stay tuned for the next part. Until then, happy coding!
