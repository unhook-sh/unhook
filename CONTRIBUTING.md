# Contributing to Unhook

First off, thank you for considering contributing to Unhook! It's people like you that make Unhook such a great tool.

## Code of Conduct

By participating in this project, you are expected to uphold our Code of Conduct. Please report unacceptable behavior to [chris.watts.t@gmail.com](mailto:chris.watts.t@gmail.com).

## Project Structure

This is a monorepo using [Turborepo](https://turbo.build/) and pnpm workspaces. The project is organized into several main components:

```
unhook/
├── apps/                   # Application packages
│   ├── cli/               # Command-line interface
│   ├── web-app/           # Main web application
│   └── marketing/         # Marketing website
├── packages/              # Shared packages
│   ├── analytics/         # Analytics utilities
│   ├── api/              # API layer
│   ├── db/               # Database utilities
│   ├── id/               # ID generation utilities
│   ├── tunnel/           # Tunnel implementation
│   ├── ui/               # Shared UI components
│   └── validators/       # Shared validation logic
├── tooling/              # Build and development tools
├── turbo/                # Turborepo configuration
└── patches/              # Package patches
```

## Development Setup

### Prerequisites

- [Node.js](https://nodejs.org/) (version specified in `.nvmrc`)
- [pnpm](https://pnpm.io/) (we use this instead of npm or yarn)
- [Git](https://git-scm.com/)

### Getting Started

1. Install pnpm if you haven't already:
   ```bash
   npm install -g pnpm
   ```

2. Clone the repository:
   ```bash
   git clone https://github.com/unhook-sh/unhook.git
   cd unhook
   ```

3. Install dependencies:
   ```bash
   pnpm install
   ```

4. Build all packages:
   ```bash
   pnpm build
   ```

5. Start development servers:
   ```bash
   pnpm dev
   ```

### Useful Commands

- `pnpm build` - Build all packages
- `pnpm dev` - Start all development servers
- `pnpm test` - Run tests across all packages
- `pnpm lint` - Lint all packages
- `pnpm clean` - Clean all build outputs
- `pnpm changeset` - Create a changeset for version management

### Working with Turborepo

We use Turborepo for managing our monorepo. Key concepts:

- Each package has its own `package.json` with its dependencies
- Shared configuration lives in the root `turbo.json`
- Build outputs are cached for faster subsequent builds
- Workspace dependencies are managed through `pnpm-workspace.yaml`

## How Can I Contribute?

### Reporting Bugs

Before creating bug reports, please check the existing issues as you might find out that you don't need to create one. When you are creating a bug report, please include as many details as possible:

* Use a clear and descriptive title
* Describe the exact steps which reproduce the problem
* Provide specific examples to demonstrate the steps
* Describe the behavior you observed after following the steps
* Explain which behavior you expected to see instead and why
* Include screenshots if possible
* Include your environment details (OS, Node.js version, etc.)

### Suggesting Enhancements

Enhancement suggestions are tracked as GitHub issues. When creating an enhancement suggestion, please include:

* A clear and descriptive title
* A detailed description of the proposed functionality
* Explain why this enhancement would be useful to most Unhook users
* List any additional context or screenshots

### Pull Requests

Please follow these steps to have your contribution considered:

1. Follow all instructions in the template
2. Follow the styleguides
3. After you submit your pull request, verify that all status checks are passing

#### Pull Request Process

1. Fork the repository
2. Create a new branch (`git checkout -b feature/amazing-feature`)
3. Make your changes
4. Run the tests (`pnpm test`)
5. Commit your changes (`git commit -m 'Add some amazing feature'`)
6. Push to the branch (`git push origin feature/amazing-feature`)
7. Open a Pull Request

## Styleguides

### Git Commit Messages

* Use the present tense ("Add feature" not "Added feature")
* Use the imperative mood ("Move cursor to..." not "Moves cursor to...")
* Limit the first line to 72 characters or less
* Reference issues and pull requests liberally after the first line

### TypeScript Styleguide

* Use TypeScript for all new code
* Follow the existing code style
* Include types for all variables and function parameters
* Write descriptive variable and function names
* Add JSDoc comments for public APIs
* Keep functions small and focused
* Use async/await over raw promises

### Documentation Styleguide

* Use [Markdown](https://guides.github.com/features/mastering-markdown/) for documentation
* Reference functions and classes with backticks: \`myFunction()\`
* Include code examples where appropriate
* Keep line length to a maximum of 80 characters
* Use descriptive link texts: prefer "[Contributing Guide](#)" over "[click here](#)"

## Testing

* Write unit tests for all new code using Vitest
* Ensure all tests pass before submitting a PR (`pnpm test`)
* Include integration tests for new features
* Follow the existing testing patterns
* Use meaningful test descriptions

## Code Style

* We use [Biome](https://biomejs.dev/) for formatting and linting
* Configuration is in the root `biome.json`
* Run `pnpm format` to format code
* Run `pnpm lint` to check for style issues

## Version Management

We use [Changesets](https://github.com/changesets/changesets) for version management:

1. Make your changes
2. Run `pnpm changeset` to create a changeset
3. Follow the prompts to describe your changes
4. Commit the generated changeset file
5. Submit your PR

## Git Hooks

We use [lefthook](https://github.com/evilmartians/lefthook) for git hooks:
* Pre-commit: Linting, formatting, and type checking
* Pre-push: Running tests

Configuration is in `lefthook.yml`

## Security

* Never commit API keys or credentials
* Use environment variables for sensitive data
* Follow security best practices
* Report security vulnerabilities privately to [chris.watts.t@gmail.com](mailto:chris.watts.t@gmail.com)

## Questions?

Don't hesitate to ask questions by:
* Opening an issue
* Joining our [Discord community](https://discord.gg/unhook)
* Checking our [documentation](https://docs.unhook.sh)

## License

By contributing to Unhook, you agree that your contributions will be licensed under its MIT License.