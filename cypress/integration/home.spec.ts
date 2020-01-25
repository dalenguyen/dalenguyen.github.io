describe('Home Page', () => {
  before(() => {
    cy.visit('https://localhost:4200')
  })

  it('check the title', () => {
    cy.get('#title')
      .invoke('text')
      .should('equal', 'Dale Nguyen')
  })
})
