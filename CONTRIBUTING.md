# Contributing to Drizzle Cube

Thank you for your interest in contributing to Drizzle Cube! This document provides guidelines and information for contributors.

## Getting Started

### Prerequisites

- Node.js 18+ and npm
- Docker (for running tests with PostgreSQL)
- Git

### Development Setup

1. **Clone the repository**
   ```bash
   git clone https://github.com/cliftonc/drizzle-cube.git
   cd drizzle-cube
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Set up the test database**
   ```bash
   npm run test:setup
   ```

4. **Run tests to verify setup**
   ```bash
   npm test
   ```

5. **Start development mode**
   ```bash
   npm run dev
   ```

## Development Workflow

### Code Quality

Before submitting changes, ensure your code passes all quality checks:

```bash
# Type checking
npm run typecheck

# Linting
npm run lint

# Run all tests
npm test

# Build all packages
npm run build
```

### Testing

- **Unit Tests**: Run `npm test` for all tests
- **PostgreSQL Tests**: Run `npm run test:postgres` for full database tests
- **Watch Mode**: Use `npm run test:watch` during development

Tests use Vitest with a real PostgreSQL database for accurate testing.

### Architecture Guidelines

**Drizzle-First Design**: This project is built around Drizzle ORM as the core:
- All SQL generation must use Drizzle query builder
- Never use string concatenation for SQL
- All database operations go through Drizzle
- Type safety is enforced through Drizzle schema definitions

**Security**: SQL injection prevention is paramount:
- Use parameterized queries only
- Leverage Drizzle's type safety
- Include security context in all cube definitions
- Test multi-tenant isolation

## Contributing Guidelines

### Submitting Issues

When reporting bugs or requesting features:

1. **Search existing issues** first
2. **Use issue templates** when available
3. **Provide minimal reproduction** for bugs
4. **Include version information** and environment details

### Pull Requests

1. **Fork the repository** and create a feature branch
2. **Write descriptive commit messages**
3. **Include tests** for new functionality
4. **Update documentation** if needed
5. **Ensure all checks pass** before submitting

#### PR Requirements

- [ ] All tests pass (`npm test`)
- [ ] Type checking passes (`npm run typecheck`)
- [ ] Linting passes (`npm run lint`)
- [ ] Build succeeds (`npm run build`)
- [ ] Changes are covered by tests
- [ ] Documentation updated if needed

### Code Style

- **TypeScript**: Strict mode enabled, full type safety required
- **ESLint**: Follow the existing ESLint configuration
- **Formatting**: Use consistent formatting (consider using Prettier)
- **Comments**: Only add comments when necessary to explain complex logic

### Commit Messages

Use clear, descriptive commit messages:

```
feat: add support for MySQL database executor
fix: resolve type safety issue in cube compilation
docs: update API examples in README
test: add integration tests for Hono adapter
```

## Project Structure

```
src/
├── server/          # Core semantic layer implementation
├── client/          # React components and hooks
├── adapters/        # Framework adapters (Hono, etc.)
└── types/           # Shared TypeScript definitions

tests/
├── helpers/         # Test utilities and database setup
└── *.test.ts        # Test files

docs/               # Documentation files
examples/           # Example applications
```

## Key Areas for Contribution

### High Priority
- **Framework Adapters**: Express, Fastify, Next.js adapters
- **Database Support**: Enhanced MySQL and SQLite support
- **Performance**: Query optimization and caching
- **Documentation**: API documentation and guides

### Medium Priority
- **Client Components**: Additional React dashboard components
- **Pre-aggregations**: Materialized view support
- **Real-time Features**: WebSocket integration
- **Testing**: More comprehensive test coverage

### Getting Help

- **GitHub Discussions**: For questions and design discussions
- **Issues**: For bug reports and feature requests
- **Documentation**: Check existing docs and CLAUDE.md for development guidance

## Code of Conduct

We are committed to providing a welcoming and inclusive environment. Please:

- Be respectful and constructive in discussions
- Focus on the technical merits of contributions
- Help others learn and grow
- Report any unacceptable behavior

## License

By contributing to Drizzle Cube, you agree that your contributions will be licensed under the MIT License.

---

Thank you for contributing to Drizzle Cube! 🐲