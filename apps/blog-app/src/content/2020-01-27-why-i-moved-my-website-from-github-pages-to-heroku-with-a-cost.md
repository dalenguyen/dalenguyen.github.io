---
title: Why I Moved My Website From Github Pages to Heroku - with a Cost
slug: 2020-01-27-why-i-moved-my-website-from-github-pages-to-heroku-with-a-cost
description: As you may or may not know, I built my personal website as a Single Page Application (SPA) with the Angular framework and hosted on Github Pages. Everything works great until I integrated a Blog feature on my personal website. Things were getting ugly for search engine optimization (SEO) and social media preview.
categories: ['angular', 'heroku', 'github', 'tutorial', 'webdev']
coverImage: https://cdn.buttercms.com/Fca7jZuD12WBjML7ucCOJ
profileImage: https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/e3c37839-e11d-44f4-97e2-6a9d3ad580fc
published: 2020-01-27
author: Dale Nguyen
---

<img src="https://cdn.buttercms.com/Fca7jZuD12WBjML7ucCOJ" alt="Why I Moved My Website From Github Pages to Heroku - with a Cost" width="100%" />

As you may or may not know, I built my personal website as a Single Page Application (SPA) with the Angular framework and hosted on Github Pages. Everything works great until I integrated a Blog feature on my personal website. Things were getting ugly for search engine optimization (SEO) and social media preview.

### Login to Heroku

```
╰─ heroku login

heroku: Press any key to open up the browser to login or q to exit:

Opening browser to https://cli-auth.heroku.com/...

Logging in... done

Logged in as xxx@dalenguyen.me
```

### Add project to Heroku

```
╰─ heroku git:remote -a dalenguyen-me

set git remote heroku to https://git.heroku.com/dalenguyen-me.git
```

I push the project from dev to Heroku. Because my master branch is for Github pages.

```
╰─ git push heroku dev:master

Enumerating objects: 704, done.

Counting objects: 100% (704/704), done.

Delta compression using up to 8 threads

Compressing objects: 100% (550/550), done.

…
```

### Check for SEO tags on the Heroku app

<img src="https://cdn.buttercms.com/7d8faf88f415fdc5b5fbf58986c9f282" alt="SEO tags on Heroku app" width="100%" />

### <span>The reference</span>

Here are links to check your website's SEO tags:

<a href="https://developers.facebook.com/tools/debug/sharing/" target="_blank" rel="follow noopener">https://developers.facebook.com/tools/debug/sharing/</a>

<a href="https://www.linkedin.com/post-inspector/inspect/" target="_blank" rel="follow noopener">https://www.linkedin.com/post-inspector/inspect/</a>
