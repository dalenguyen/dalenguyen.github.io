---
title: 'Angular End To End (e2e) Testing With Cypress.io'
slug: '2020-01-18-angular-end-to-end-e2e-testing-with-cypressio'
description: "An End to End Test is a methodology used to test an application from a user's perspective. It ensures that the application behaves as expected from the beginning to the end."
categories: ['angular', 'testing', 'cypress', 'tutorial', 'webdev']
coverImage: 'https://cdn.buttercms.com/cYd5lSDMRBmI6tCiPTbh'
profileImage: 'assets/images/dale-nguyen-avatar.jpeg'
published: '2020-01-18'
author: Dale Nguyen
---

<img src="https://cdn.buttercms.com/cYd5lSDMRBmI6tCiPTbh" width="100%" alt="Angular End To End (e2e) Testing With Cypress.io" />

An End to End Test is a methodology used to test an application from a user's perspective. It ensures that the application behaves as expected from the beginning to the end. I usually run it after fixing a bug or adding new features to ensure that nothing breaks.

## What is Cypress.io?

Cypress is a next generation front end testing tool built for the modern web. It addresses the key pain points developers and QA engineers face when testing modern applications.

Cypress is most often compared to Selenium; however, Cypress is both fundamentally and architecturally different. Cypress is not constrained by the same restrictions as Selenium.

This enables you to write faster, easier and more reliable tests.

## Install Cypress

First, you need to install Cypress as a dev dependency in your project.

```bash
npm install cypress --save-dev
```

After installing, you need to add a script to your package.json file to run Cypress.

```json
"scripts": {
  "cypress:open": "cypress open"
}
```

## Create a Test File

Now, let's create a test file. Create a new file in the `cypress/integration` folder. For example, `home.spec.js`.

```javascript
describe('Home Page', () => {
  it('should visit the home page', () => {
    cy.visit('http://localhost:4200')
  })

  it('should contain welcome message', () => {
    cy.visit('http://localhost:4200')
    cy.contains('Welcome')
    cy.contains('Welcome')
  })
})
```

```diff
- This is a sentence.
+ This is a longer sentence.
```

```diff-typescript
- const foo = 'bar';
+ const foo = 'baz';
```

## Run the Test

Before running the test, make sure your Angular application is running on `http://localhost:4200`.

```bash
npm run cypress:open
```

This will open the Cypress Test Runner. Click on the `home.spec.js` file to run the test.

## Advanced Testing

Let's create a more advanced test. We'll test a login form.

```javascript
describe('Login Form', () => {
  beforeEach(() => {
    cy.visit('http://localhost:4200/login')
  })

  it('should display login form', () => {
    cy.get('form').should('be.visible')
  })

  it('should require email', () => {
    cy.get('input[type="submit"]').click()
    cy.get('.error-message').should('contain', 'Email is required')
  })

  it('should require password', () => {
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[type="submit"]').click()
    cy.get('.error-message').should('contain', 'Password is required')
  })

  it('should login successfully', () => {
    cy.get('input[name="email"]').type('test@example.com')
    cy.get('input[name="password"]').type('password123')
    cy.get('input[type="submit"]').click()
    cy.url().should('include', '/dashboard')
  })
})
```

## Cypress Configuration

You can configure Cypress by creating a `cypress.json` file in the root of your project.

```json
{
  "baseUrl": "http://localhost:4200",
  "viewportWidth": 1280,
  "viewportHeight": 720
}
```

With this configuration, you can simplify your tests:

```javascript
describe('Home Page', () => {
  it('should visit the home page', () => {
    cy.visit('/')
  })
})
```

## Example: Testing a Todo App

Let's look at a real-world example of testing a Todo application:

```javascript
describe('Todo App', () => {
  beforeEach(() => {
    cy.visit('/')
  })

  it('should add a new todo', () => {
    const todoText = 'Buy groceries'
    cy.get('input.new-todo').type(`${todoText}{enter}`)
    cy.get('.todo-list li').should('have.length', 1)
    cy.get('.todo-list li').first().should('contain', todoText)
  })

  it('should toggle a todo', () => {
    const todoText = 'Buy groceries'
    cy.get('input.new-todo').type(`${todoText}{enter}`)
    cy.get('.todo-list li .toggle').click()
    cy.get('.todo-list li').should('have.class', 'completed')
  })

  it('should clear completed todos', () => {
    const todoText = 'Buy groceries'
    cy.get('input.new-todo').type(`${todoText}{enter}`)
    cy.get('.todo-list li .toggle').click()
    cy.get('.clear-completed').click()
    cy.get('.todo-list li').should('have.length', 0)
  })
})
```

## Cypress vs Protractor

Angular comes with Protractor for e2e testing, but Cypress offers several advantages:

1. **Easier setup and configuration**
2. **Real-time reloading** - Tests reload automatically when you make changes
3. **Time travel** - Cypress takes snapshots as your tests run, allowing you to see exactly what happened at each step
4. **Debugging** - Cypress provides better error messages and debugging capabilities
5. **Automatic waiting** - Cypress automatically waits for commands and assertions before moving on

<img src="https://cdn.buttercms.com/Fca7jZuD12WBjML7ucCOJ" width="100%" alt="Cypress Test Runner" />

Now you know how to write a simple test script for an Angular project with Cypress. You can check my [commit from GitHub](https://github.com/dalenguyen/dalenguyen.github.io/commit/d944ea11b03cd8e4c654c8e7c2cb3d9f8e0695bf#diff-01b2c16fa8dbd554bf70d9c179609c03).

Hope this helps 🙂
