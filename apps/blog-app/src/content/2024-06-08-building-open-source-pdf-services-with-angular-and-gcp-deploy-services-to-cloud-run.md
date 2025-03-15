---
title: Building PDF Open Source Services with Angular & GCP — Deploy Services to Cloud Run
slug: 2024-06-08-building-open-source-pdf-services-with-angular-and-gcp-deploy-services-to-cloud-run
description: Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.
categories: ['angular', 'tutorial', 'gcp']
coverImage: assets/images/blog/angular-pdf-service.webp
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2024-06-08T15:17:31.359Z
author: Dale Nguyen
---

<figure>
  <img src="assets/images/blog/angular-pdf-service.webp" alt="PDFun — Open Source PDF Services" width="100%" height="auto" style="aspect-ratio: 16/9;" />
  <figcaption>PDFun — Open Source PDF Services</figcaption>
</figure>

Welcome to the first part of the journey in building open source PDF service using Angular (Analogjs), Firestore, Cloud Storage, and CloudRun. This project serves as a platform for sharing my knowledge, continually learning best practices, and simultaneously contributing to the community.

- Part 1: [Architecture Overview](blog/2024-06-03-building-open-source-pdf-services-with-angular-and-gcp-architecture-overview)
- Part 2: **[Deploy services to Cloud Run](blog/2024-06-08-building-open-source-pdf-services-with-angular-and-gcp-deploy-services-to-cloud-run)**
- Part 3: [Handling long processing tasks]()
- Part 4: [PDF AI Chat]()

Demo: <https://pdfun.xyz>

GitHub - [dalenguyen/pdfun](https://github.com/dalenguyen/pdfun)

The solution is built around GCP ecosystem, it’s better to deploy the project on GCP, so it can access their services. There are two parts of the solution:

- Web UI (Analogjs — Angular): handle user interaction
- Backend (Node — Express): process PDF files

## Why Deploy to Cloud Run?

Cloud Run is a fully managed compute platform by Google Cloud Platform (GCP) that automatically scales your stateless containers. But why should we choose Cloud Run for deploying our services? Here are some reasons:

- Cloud Run is an excellent choice for deploying services due to its support for long-running tasks. Services can run for up to 60 minutes, accommodating tasks that require significant computation time.
- In addition to this, Cloud Run offers benefits such as automatic scaling, a developer-friendly environment, integrated logging and monitoring, a pay-per-use pricing model, and portability across different platforms. This makes it a versatile and cost-effective solution for deploying our PDF service.

## Deploying to Google Cloud Run using Docker

Cloud Run using a docker image to deploy its service, so what we need to do is to wrap our applications into a image.

### Prerequisites

Before we begin, make sure you have the following:

- A Google Cloud project with billing enabled.
- Docker installed on your local machine.
- The Google Cloud SDK installed and initialized.

Please follow the [Deploying to Cloud Run](https://cloud.google.com/run/docs/deploying#command-line) documentation for further instruction.

### Build Your Docker Image

Next, you will need to build your project and the Docker image. This can be done using the docker build command. Make sure to tag your image with the registry name. For example:

```bash
// build-new-image.sh

imageTag=${REGION}-docker.pkg.dev/$GCLOUD_PROJECT/$REPO/$image

docker build -t $imageTag -f Dockerfile --platform linux/x86_64 .
```

Replace `REGIONS`, `GCLOUD_PROJECT`, `REPO` and `image` with your Google Cloud project ID, your image name, and your image tag, respectively.

### Push Your Image to the Artifact Registry

Once your image is built, you can push it to the Artifact Registry using the docker push command:

```bash
docker push $imageTag
```

### Create a New Service in Cloud Run

With your image now in the Artifact Registry, you can create a new service in Cloud Run. You can run the following command to deploy the PDF service:

```bash
gcloud run deploy pdfun \
 --image=us-central1-docker.pkg.dev/pdfun-prod/pdf/pdfun \
 --platform=managed --project=pdfun-prod --region=us-central1 \
 --allow-unauthenticated
```

This command will deploy the Web UI with service name pdfun to Cloud Run and allows every one to access the website (`--allow-unauthenticated`).

## Bonus: Utilizing Nx to deploy services

> [Nx](https://nx.dev/) is a development framework designed for building applications inside monorepos. Monorepos contain multiple apps inside a single Git repository, allowing organizations to share code, such as components and utility libraries, across apps and teams. Nx handles many monorepo use cases like build systems, inbuilt tools, and smart caching.

When it comes to deploying services, Nx offers a streamlined process. After configuration, all I need to do is to run `yarn deploy` in order deploy only affected apps. For example, if I only update the frontend, then the frontend is the only app that will be built and deployed.

Here is what happens under the hood after I run the deploying command:

```bash
npx nx affected -t deploy --base=main~1 --head=main
```

This command will run the `deploy` target under `project.json` for affected projects by comparing the commit and the latest commit on main branch.

Let’s have a look at the `project.json` for the `pdfun` application:

```json
// project.json

...

"deploy": {
  "executor": "nx:run-commands",
  "options": {
    "commands": ["nx deploy-docker pdf", "nx deploy-cloudrun pdf"],
    "color": true,
    "parallel": false
  },
  "dependsOn": [
    {
      "target": "build"
    }
  ]
  },
  "deploy-cloudrun": {
    "command": "gcloud run deploy pdfun --image=us-central1-docker.pkg.dev/pdfun-prod/pdf/pdfun --platform=managed --project=pdfun-prod --region=us-central1 --allow-unauthenticated"
  },
  "deploy-docker": {
    "command": "./build-new-image.sh --dir dist/pdf/analog --image pdfun",
    "parallel": false,
    "dependsOn": [
      {
      "target": "copy"
      }
    ]
},
```

So, when the `deploy` target runs, it will trigger two other commands:

```bash
npx nx deploy-docker pdf
npx nx deploy-cloudrun pdf
```

These commands in turn will build the docker image, push the image and deploy the Cloud Run service based on the uploaded image on Artifact Registry.

Here is the result:

```
dalenguyen$ yarn deploy

yarn run v1.22.19
$ npx nx affected -t deploy --base=main~1 --head=main

NX Running target deploy for 2 projects and 3
NX Running target deploy for 2 projects and 3 tasks they depend on

✔ nx run domain:build (6s)
———————————————————————————————————————————————
✔ nx run pdf:build:production (17s)
———————————————————————————————————————————————
✔ nx run pdf:deploy (17s)
✔ nx run pdf-on-create:deploy (29s)
———————————————————————————————————————————————
```

NX Successfully ran target deploy for 2 projects and 3 tasks they depend on (37s)
You can see that the by utilizing the build cache, two services were build and deploy in about 1 minute locally!

## Questions?

If you have any questions or run into any issues, please don’t hesitate to [create an issue](https://github.com/dalenguyen/pdfun/issues) on our GitHub repository. Alternatively, you can chat with me. I’m here to help and would love to hear your feedback.

Stay tuned for the next part. Until then, happy coding!
