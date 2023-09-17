# Contributing to ParlWatch

Thank you for considering contributing to ParlWatch. It's people like you that make ParlWatch a great tool.

## Using Angular and Ionic

As the project is developed using Angular and Ionic, it would be beneficial if you have experience with these technologies.

1. **Angular**: Familiarize yourself with the [Angular documentation](https://angular.io/docs).
2. **Ionic**: Learn about [Ionic framework](https://ionicframework.com/docs) for building cross-platform applications.

## Setting up VSCode

For this project, we are using VSCode as the preferred IDE. Make sure to configure Prettier as your default formatter to maintain code consistency. Here is a recommended configuration that you can include in your settings:

```json
{
  "editor.defaultFormatter": "esbenp.prettier-vscode",
  "editor.formatOnPaste": false,
  "editor.formatOnType": false,
  "editor.formatOnSave": true,
  "editor.formatOnSaveMode": "file",
  "files.autoSave": "onFocusChange",
  "prettier.singleQuote": true
}
```

## How to Contribute

### Reporting Bugs

1. Before creating a new issue, do a quick search to see if the issue has already been reported. If it has, add a comment to the existing issue instead of opening a new one.
2. Create a new issue, providing a descriptive title and a clear description of the issue. Include as much relevant information as possible and a code sample if applicable.
3. Label the issue appropriately.

### Suggesting Enhancements

1. Create a new issue, providing a descriptive title and a detailed description of the suggested enhancement.
2. Label the issue as a feature request.
3. Be sure to include any relevant documentation or references to support your suggestion.

### Your First Code Contribution

1. Find an issue to work on, or create a new issue to identify the bug or feature you want to work on.
2. Fork the repository and create a new branch for your work.
3. Make your changes in your new branch. Be sure to test your changes!
4. Commit your changes, making sure to write a good commit message.
5. Open a Pull Request with a clear title and description.

## Code Style and Commit Convention

### Code Style

1. Please adhere to the coding style established in the project.
2. Make sure to document your code where necessary.
3. Write tests for your code to ensure stability and prevent regressions.

### Conventional Commits

We follow the [Conventional Commits specification](https://www.conventionalcommits.org/) to ensure consistency and readability of the commit history. Before making a commit, please ensure that your messages follow this convention.

Additionally, we have configured Husky to validate commits. To set it up, you need to install Husky by running the command `npx husky install`. Husky will then automatically run the validation script on every commit.

## Submitting a Pull Request

1. Create a new Pull Request against the master branch.
2. Provide a descriptive title and clear description of the changes.
3. Link the issue that your Pull Request resolves.
4. Request a review from maintainers.
