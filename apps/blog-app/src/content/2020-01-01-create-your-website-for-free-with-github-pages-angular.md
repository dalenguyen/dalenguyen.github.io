---
title: Create Your Website For FREE with Github Pages — Angular
slug: 2020-01-01-create-your-website-for-free-with-github-pages-angular
description: In the previous post, I show you how to do some research in order to have a glimpse of how to research for your own website - such as a portfolio website. Today, you will know to create a sample Angular site and host in on Github Pages.
categories: ['webdev', 'tutorial', 'angular', 'github']
coverImage: https://cdn.buttercms.com/0vHe9sB4SxdVtmbqqOml
profileImage: assets/images/dale-nguyen-avatar.webp
published: 2020-01-01
author: Dale Nguyen
---

<img src="https://cdn.buttercms.com/0vHe9sB4SxdVtmbqqOml" alt="Create Your Website For FREE with Github Pages — Angular" width="100%" />

In the previous post, I show you how to do some research in order to have a glimpse of how to research for your own website - such as a portfolio website. Today, you will know to create a sample Angular site and host in on Github Pages.

Github is great for storing and sharing projects. And if you may not know, Github can also host your websites — for FREE with some limitations. That's why you shouldn't use it to run online business or e-commerce site.

- GitHub Pages source repositories have a recommended limit of 1GB.
- Published GitHub Pages sites may be no larger than 1 GB.
- GitHub Pages sites have a soft bandwidth limit of 100GB per month.
- GitHub Pages sites have a soft limit of 10 builds per hour.

It's a platform to build a static website with HTML, CSS & JavaScript, so I will create my personal website (Angular, Firebase, Github pages) starting from this simple post.

## Create a New Repository

![Create a New Repository.png](https://cdn.buttercms.com/KHE3wRKcQh2PQbmOX1vv)

After that, you can push a simple index.html to your master branch.

```bash
git clone https://github.com/username/username.github.io
cd username.github.io
echo "Hello World!!!" > index.html
// Push your file to github
git add --all
git commit -m "Initial commit"
git push -u origin master
```

## Check Your Project Setting

![Check Your Project Setting.png](https://cdn.buttercms.com/MN7M97KsQBOGCvwmwm2C)

Form now, you can access your website. Is it fascinating!!!

![github pages works.png](https://cdn.buttercms.com/v4FS2DI0Q5mPeCsZT21O)

After this moment, it's totally depends on your imagination and skills — modify index.html file and push it back to master → DONE.

## Building Github Pages with Angular Project

Now, we will take advantage of Angular to build our website on Github pages. angular-cli-ghpages is needed for deploying to Github.

```bash
npm install -g angular-cli-ghpages
```

The website is on master, so we need to create a dev branch for the development process.

```bash
git checkout -b dev
```

Create a new Angular project, make sure that the project is in the root folder of your git.

```bash
ng new username-github-io
```

Remember to edit angular.json file, so the build will be under dist folder rather than dist/app.

## Prepare for deployment

```bash
ng build --prod --base-href 'https://username.github.io/'
Deploy project to master
 ✔  ngh --message="Commit message"
 ✔  ngh —branch=master
 ✔  ngh --dry-run
 ✔  ngh
> app@0.0.0 deploy
🚀 Successfully published via angular-cli-ghpages! Have a nice day!
```

Yay, my angular project is being deployed to Github pages!!!

![github angular works.png](https://cdn.buttercms.com/0vHe9sB4SxdVtmbqqOml)

This is the final step, we need to update the default branch to dev because the master branch will have production files. Dev branch will give you a better understanding of the project.

You may take a look at my [Github](https://github.com/dalenguyen/dalenguyen.github.io) — the real project may not be updated yet :)
