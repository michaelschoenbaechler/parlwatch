describe('Navigation', () => {
  beforeEach(() => {
    cy.visit('http://localhost:8100');
  });

  it('title votes should be visible', () => {
    cy.get('ion-title').should('contain', 'Votes');
  });

  it('navigate to council-member page', () => {
    cy.get('ion-tab-button').eq(1).click();
    cy.get('ion-title').should('contain', 'council-member');
  });
});
