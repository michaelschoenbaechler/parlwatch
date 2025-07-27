This is a Typescript-based repository using Angular and Ionic capacitor framework. 
The repository is structured to support a modular architecture, with components, pages, services and ngrx signal stores (https://ngrx.io/guide/signals/signal-store).
Please follow these guidelines when contributing:

## Code Standards

### Required Before Each Commit
- Run `npx husky install` before
- Use `npm run lint` to check for linting errors
- Use `npm run prettier` to format your code according to the project's style guide
- Validate commit messages using commitlint (see .husky/commit-msg for configuration)

### Development Flow
- Build: `npm run build`
- i18n: `npm run i18n:find` (to find new translations) and `npm run i18n:extract` (to extract translations)

## Repository Structure
- `ios/`: Contains iOS specific configurations and files
- `src/`: Contains the main application code
  - `app/`: The main application module and components
    - `business`: Components, pages and signal store related to businesses that are part of the council
    - `council-members/`: Components, pages and signal store related to council members'
    - `layout/`: Tab navigation components for the application
    - `settings/`: Application settings and configurations like language and donation
    - `shared/`: Shared components, directives, pipes and services
    - `votes/`: Components and pages related to voting on particular businesses
  - `assets/`: Static assets like images and stylesheets
  - `environments/`: Environment-specific configurations
  - `i18n/`: Internationalization files
  - `theme/`: Global styles and themes

## Key Guidelines
1. Follow Go best practices and idiomatic patterns
2. Maintain existing code structure and organization
3. Document public APIs and complex logic. Suggest changes to the `docs/` folder when appropriate
