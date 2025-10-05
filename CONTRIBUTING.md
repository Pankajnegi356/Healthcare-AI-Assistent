# Contributing to Healthcare AI Assistant

Thank you for considering contributing to Healthcare AI Assistant! We welcome contributions from the community.

## Getting Started

1. Fork the repository
2. Clone your fork locally
3. Create a new branch for your feature/fix
4. Make your changes
5. Test your changes
6. Submit a pull request

## Development Setup

```bash
# Clone your fork
git clone https://github.com/yourusername/healthcare-ai-assistant.git
cd healthcare-ai-assistant

# Install dependencies
npm install

# Copy environment template
cp .env.example .env

# Set up your development environment
npm run dev
```

## Code Style

We use the following tools to maintain code quality:

- **ESLint** for code linting
- **Prettier** for code formatting
- **TypeScript** for type safety

Before submitting, please run:

```bash
npm run lint:fix
npm run format
npm run check
```

## Testing

Make sure all tests pass before submitting:

```bash
# Run API tests
node --import tsx run-api-tests.js

# Run health check
npm run health-check
```

## Pull Request Process

1. **Update documentation** if your changes affect user-facing features
2. **Add tests** for new functionality
3. **Ensure all checks pass** in the CI pipeline
4. **Update the README** if necessary
5. **Write clear commit messages**

### Commit Message Format

Use conventional commits:

```
feat: add new medical analysis feature
fix: resolve CORS issue with tunneling
docs: update installation instructions
test: add unit tests for AI service
```

## Types of Contributions

### 🐛 Bug Reports

When filing a bug report, please include:

- Clear description of the issue
- Steps to reproduce
- Expected vs actual behavior
- Environment details (OS, Node.js version, etc.)
- Relevant logs or error messages

### 💡 Feature Requests

For feature requests, please provide:

- Clear description of the feature
- Use case and benefits
- Implementation suggestions (if any)
- Mockups or examples (if applicable)

### 🔧 Code Contributions

We welcome contributions in these areas:

- **AI/ML improvements**: Better prompt engineering, model integration
- **Frontend enhancements**: UI/UX improvements, new components
- **Backend features**: API enhancements, performance optimizations
- **Documentation**: Tutorials, guides, API documentation
- **Testing**: Unit tests, integration tests, API tests
- **Security**: Security improvements and best practices

## Code Review Process

1. **Automated checks** must pass (linting, type checking, tests)
2. **Manual review** by maintainers
3. **Testing** on different environments
4. **Documentation** review if applicable

## Development Guidelines

### Medical Information

- Always include disclaimers for medical content
- Follow healthcare industry best practices
- Ensure data privacy and security
- Test with diverse medical scenarios

### AI/ML Components

- Document prompt engineering decisions
- Test AI responses thoroughly
- Implement fallback mechanisms
- Monitor AI service performance

### Security

- Never commit sensitive data
- Follow secure coding practices
- Implement proper input validation
- Use environment variables for secrets

## Community Guidelines

- Be respectful and inclusive
- Provide constructive feedback
- Help others learn and grow
- Follow our Code of Conduct

## Questions?

- Create an issue for bugs or feature requests
- Join our discussions for general questions
- Check existing issues before creating new ones

## License

By contributing, you agree that your contributions will be licensed under the MIT License.

Thank you for contributing to Healthcare AI Assistant! 🚀
