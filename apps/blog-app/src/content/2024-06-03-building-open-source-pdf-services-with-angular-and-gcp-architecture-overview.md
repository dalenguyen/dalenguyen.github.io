---
title: Building PDF Open Source Services with Angular & GCP — Architecture Overview
slug: 2024-06-03-building-open-source-pdf-services-with-angular-and-gcp-architecture-overview
description: Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.
categories: ['angular', 'tutorial', 'gcp']
coverImage: https://dalenguyen.me/assets/images/blog/angular-pdf-service.webp
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2024-06-03T15:17:31.359Z
author: Dale Nguyen
---

<figure>
  <img src="assets/images/blog/angular-pdf-service.webp" alt="PDFun — Open Source PDF Services" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>PDFun — Open Source PDF Services</figcaption>
</figure>

Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.

- Part 1: **[Architecture Overview](blog/2024-06-03-building-open-source-pdf-services-with-angular-and-gcp-architecture-overview)**
- Part 2: [Deploy services to Cloud Run](blog/2024-06-08-building-open-source-pdf-services-with-angular-and-gcp-deploy-services-to-cloud-run)
- Part 3: [Handling long processing tasks](blog/2024-07-06-building-open-source-pdf-services-with-angular-and-gcp-handling-long-processing-tasks)
- Part 4: [PDF AI Chat](blog/2025-03-10-building-open-source-pdf-services-with-angular-and-gcp-pdf-ai-chat)

Demo: <https://pdfun.xyz>

GitHub - [dalenguyen/pdfun](https://github.com/dalenguyen/pdfun)

## The First Feature: Upload and Resize PDF Files (Unsecured — kind of)

Our first feature is all about simplicity and functionality. It allows you to upload and resize PDF files. This feature is designed with a user-friendly interface that makes it easy for anyone to use, regardless of their technical background.

<figure>
  <img src="assets/images/blog/render-pdf-ui.webp" alt="Resize PDF file UI" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>Resize PDF file UI</figcaption>
</figure>
There is no security in place if you don’t log in the application. Anyone know how Firebase works, can access the file that you uploaded. The only security measure for publicly is that all files will be deleted in 1 day.

## Technology Stack

The technology stack we’ve chosen for this project includes Angular (Analgojs), Firestore, Cloud Storage, and CloudRun. These technologies were chosen for their robustness, scalability, and ease of use. They work together seamlessly to provide a smooth user experience.

Here is the flow:

<figure>
  <img src="assets/images/blog/pdf-resize-architecture-overview.webp" alt="PDF processing event flow" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>PDF processing event flow</figcaption>
</figure>

- First, you upload their PDF file
- The UI will upload their file to Cloud Storage + a record in Firestore
- Created event from Firestore will trigger a service from Cloud Run
- Cloud Run retrieve data from Firestore & file from Cloud Storage
- Cloud Run start to resize the PDF, then upload it back to Cloud Storage and Firestore
- The updated record will reflect on the UI with link for users to download the resized file
- All PDF files / records will be delete after 1 day based on the TTL policy

## Try It Out

I encourage you to try out our service. You can support me by starring the GitHub repository or sponsoring the project. Your support helps the project continue to improve and add new features.

## Questions?

If you have any questions or run into any issues, please don’t hesitate to [create an issue](https://github.com/dalenguyen/pdfun/issues) on our GitHub repository. Alternatively, you can chat with me. I’m here to help and would love to hear your feedback.

Stay tuned for the next part. Until then, happy coding!
