---
title: Create Your Own Blog with DevTO API
slug: 2020-01-01-create-your-own-blog-with-devto-api
description: It's quite an interesting platform where programmers share ideas and help each other grow. It is an online community for sharing and discovering great ideas, having debates, and making friends. Anyone can share articles, questions, discussions, etc. as long as they have the rights to the words they are sharing. Cross-posting from your own blog is welcome - quote from the About page.
categories: ['webdev', 'tutorial', 'api']
coverImage: https://cdn.buttercms.com/Sz4nZne1Rky8h9H7qj0b
profileImage: https://d1ts43dypk8bqh.cloudfront.net/v1/avatars/e3c37839-e11d-44f4-97e2-6a9d3ad580fc
published: 2020-01-01
author: Dale Nguyen
---

<img src="https://cdn.buttercms.com/Sz4nZne1Rky8h9H7qj0b" alt="Create Your Own Blog with DevTO API" width="100%" />

I joined DevTO since June 2019. It's quite an interesting platform where programmers share ideas and help each other grow. It is an online community for sharing and discovering great ideas, having debates, and making friends. Anyone can share articles, questions, discussions, etc. as long as they have the rights to the words they are sharing. Cross-posting from your own blog is welcome - quote from the About page.

I wrote a few posts on the platform and I actually like it. And more intriguing, I discovered their API (beta version), which allows me to get the articles in JSON format.

I knew that I can to put all the posts from DevTO to my newly rebuilt website. And there are some challenges that need to be resolved:

- How should it look like on my website?
- How can I display the "all the post" page?
- How can I display the article page?

Fortunately, I have everything in mind, and I already put them into action. Here is how I did it with Angular, and you can do with any framework you prefer.

## How should it look like on my website?

I try to make it simple and readable on every different device. You can do some research and decide how do you want to style your own blog.

## How can I display the "all the post" page?

The endpoint where I can get all the articles is Published articles. With the parameter "username", I can return all the articles written by me.

```
https://dev.to/api/articles?username=dalenguyen
```

For the content, getting the JSON from the API is pretty easy with HttpClient.

```javascript
// blog.service.ts
try {
  articles = await this.http.get('https://dev.to/api/articles?username=dalenguyen').toPromise()
} catch (error) {
  console.error(error)
}
```

Then show it with Angular Material

```html
// blog.component.html
<div id="blog">
  <h1>Blog</h1>
  <section id="articles" *ngIf="articles.length > 0">
    <mat-card class="example-card" *ngFor="let article of articles">
      <mat-card-header>
        <mat-card-title>{{ article.title }}</mat-card-title>
      </mat-card-header>
      <img mat-card-image src="{{ article.cover_image }}" alt="{{ article.title }}" />
      <mat-card-content>
        <p>{{ article.description }}</p>
      </mat-card-content>
      <mat-card-actions>
        <button mat-button (click)="openPost(article)">READ MORE</button>
      </mat-card-actions>
    </mat-card>
  </section>
</div>
```

## How can I display the article page?

This is the tricky part because I will need to make another request in order to get the content of a single post - and the id is used for this purpose.

```javascript
// post.service.ts
try {
  article = await this.http.get('https://dev.to/api/articles/186759').toPromise()
} catch (error) {
  console.error(error)
}
```

and for the HTML part

```html
// post.component.html
<div id="post" *ngIf="article !== null">
  <header>
    <h1>{{ article.title }}</h1>
    <p>Written by {{ article.user.name }}</p>
    <p>{{ article.published_at | date }}</p>
  </header>
  <article [innerHTML]="articleBody"></article>
</div>
```

For embedded URLs from the article, how can I deal with it? If I just leave it, I will lead to DevTO website, and I really don't want that. So before serving the HTML to the front end, I have to replace the domain name from DevTo to my website.

```javascript
// post.component.ts
private cleanArticleContent(html: string): string {
    return html.replace(/https:\/\/dev.to\/dalenguyen/g, 'https://dalenguyen.me/blog')
}
```

From now, you can create your own blog which the content from DevTO - it will take a few hours until the article can be shown on your website. You can find the project from my [Github](https://github.com/dalenguyen/dalenguyen.github.io) account.
