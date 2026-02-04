# Contributing to Autobot

Thank you for your interest in contributing to Autobot! This is a pedagogical project designed to help developers learn about LLM application architecture.

## 🎯 Project Goals

Autobot aims to:

1. **Educate**: Teach developers how LLM applications work
2. **Demonstrate**: Show best practices for fullstack TypeScript
3. **Clarify**: Make the AG-UI protocol understandable
4. **Inspire**: Encourage learning and experimentation

## 🤝 How to Contribute

### Areas We Welcome Contributions In

1. **Documentation**
   - Improve explanations
   - Add more examples
   - Fix typos or unclear wording
   - Add translations

2. **Code Quality**
   - Improve code clarity
   - Add helpful comments
   - Refactor for better understanding
   - Fix bugs

3. **Educational Value**
   - Add tutorial content
   - Create video walkthroughs
   - Write blog posts
   - Add diagrams

4. **Features** (that enhance learning)
   - Better visualization
   - More debug information
   - Tool/function calling examples
   - Streaming response support

### What We're NOT Looking For

- Performance optimizations that obscure code clarity
- Complex features that make it harder to understand
- Production-ready features (this is a learning tool)
- Breaking the simple architecture

## 🚀 Getting Started

### Prerequisites

- Node.js 18 or higher
- npm
- OpenAI API key (for testing)

### Setup

1. Fork the repository
2. Clone your fork:
   ```bash
   git clone https://github.com/YOUR-USERNAME/autobot.git
   cd autobot
   ```

3. Install dependencies:
   ```bash
   npm install
   ```

4. Start development servers:
   ```bash
   npm run dev
   ```

5. Open http://localhost:3000 in your browser

### Project Structure

```
autobot/
├── packages/
│   ├── backend/          # Express server
│   │   └── src/
│   │       ├── index.ts        # Main server
│   │       ├── services/       # LLM integration
│   │       ├── storage/        # File storage
│   │       └── types/          # TypeScript types
│   │
│   └── frontend/         # React app
│       └── src/
│           ├── App.tsx         # Main component
│           ├── components/     # UI components
│           ├── hooks/          # React hooks
│           └── types/          # TypeScript types
│
└── docs/                # Documentation
```

## 📝 Code Style

### General Principles

1. **Clarity over cleverness**: Write code that's easy to understand
2. **Comment generously**: Explain WHY, not just WHAT
3. **TypeScript strict mode**: Use types everywhere
4. **Descriptive names**: Use clear, self-documenting names

### TypeScript

```typescript
// Good: Clear type definitions with comments
interface Message {
  id: string;          // Unique identifier
  role: 'user' | 'assistant' | 'system';  // Message sender
  content: string;     // Message text
  timestamp: number;   // Unix timestamp in milliseconds
}

// Good: Explicit return types
function formatTimestamp(timestamp: number): string {
  return new Date(timestamp).toLocaleTimeString();
}
```

### React Components

```typescript
// Good: Descriptive component with JSDoc
/**
 * Debug Panel Component
 * 
 * Displays real-time debug events showing communication between
 * frontend, backend, and LLM.
 */
export function DebugPanel({ events, connected }: DebugPanelProps) {
  // Implementation...
}
```

### Comments

```typescript
// Good: Explain the reasoning
// Create debug event for incoming message.
// This helps users see when the backend receives their message.
const incomingDebugEvent: DebugEvent = {
  id: uuidv4(),
  timestamp: Date.now(),
  type: 'request',
  source: 'frontend',
  data: { message },
  description: 'User message received',
};
```

## 🔄 Pull Request Process

1. **Create a branch**: `git checkout -b feature/your-feature-name`

2. **Make your changes**:
   - Follow the code style
   - Add comments explaining your changes
   - Update documentation if needed

3. **Test your changes**:
   ```bash
   # Build both packages
   cd packages/backend && npm run build
   cd ../frontend && npm run build
   
   # Test manually
   npm run dev
   ```

4. **Commit your changes**:
   ```bash
   git add .
   git commit -m "Clear description of your changes"
   ```

5. **Push to your fork**:
   ```bash
   git push origin feature/your-feature-name
   ```

6. **Create a Pull Request**:
   - Go to the original repository
   - Click "New Pull Request"
   - Select your branch
   - Fill out the PR template

### PR Template

```markdown
## Description
Brief description of your changes

## Type of Change
- [ ] Documentation improvement
- [ ] Bug fix
- [ ] New feature
- [ ] Code clarity improvement

## Educational Impact
How does this improve the learning experience?

## Testing
How did you test these changes?

## Screenshots (if applicable)
Add screenshots for UI changes
```

## 🐛 Reporting Bugs

### Before Reporting

1. Check existing issues
2. Verify it's not a configuration problem
3. Test with latest code

### Bug Report Template

```markdown
**Describe the bug**
A clear description of what the bug is.

**To Reproduce**
Steps to reproduce the behavior:
1. Go to '...'
2. Click on '...'
3. See error

**Expected behavior**
What you expected to happen.

**Screenshots**
If applicable, add screenshots.

**Environment:**
- OS: [e.g. macOS, Windows, Linux]
- Node version: [e.g. 18.0.0]
- Browser: [e.g. Chrome, Firefox]

**Additional context**
Any other context about the problem.
```

## 💡 Suggesting Enhancements

We love ideas that improve the educational value!

### Enhancement Template

```markdown
**Is your feature request related to learning? Please describe.**
A clear description of what you want to learn or teach.

**Describe the solution you'd like**
How would this feature improve understanding?

**Describe alternatives you've considered**
Other ways to achieve the same educational goal.

**Additional context**
Any mockups, examples, or references.
```

## 📚 Documentation Guidelines

### Writing Style

- Use clear, simple language
- Explain technical terms
- Include examples
- Add diagrams when helpful

### Documentation Structure

```markdown
# Title

Brief overview (1-2 sentences)

## What This Does

Explain the purpose

## How It Works

Explain the implementation

## Example

Show concrete usage

## Why It Matters

Explain the educational value
```

## 🧪 Testing

### Manual Testing Checklist

- [ ] Configuration form works
- [ ] Chat interface accepts messages
- [ ] Debug panel shows events
- [ ] WebSocket connection succeeds
- [ ] Messages persist across reloads
- [ ] Error handling works

### Future: Automated Tests

We welcome contributions to add:
- Unit tests
- Integration tests
- E2E tests

## 📞 Getting Help

- **Questions**: Open a GitHub issue with the "question" label
- **Discussions**: Use GitHub Discussions
- **Problems**: Check existing issues first

## 🌟 Recognition

Contributors will be:
- Listed in README.md
- Mentioned in release notes
- Credited in documentation

## 📜 Code of Conduct

### Our Standards

- Be respectful and inclusive
- Focus on learning and teaching
- Provide constructive feedback
- Be patient with beginners

### Unacceptable Behavior

- Harassment or discrimination
- Trolling or insulting comments
- Publishing others' private information
- Other unprofessional conduct

## 📄 License

By contributing, you agree that your contributions will be licensed under the MIT License.

## 🙏 Thank You!

Every contribution, no matter how small, helps make this project better for learners everywhere.

Happy learning and coding! 🚀
