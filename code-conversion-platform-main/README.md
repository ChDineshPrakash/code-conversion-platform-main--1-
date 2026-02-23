# CodePolyglot

⚡ **Offline Code Translation Engine** - Convert code between programming languages with AI-powered accuracy

[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![React](https://img.shields.io/badge/React-20232A?logo=react&logoColor=61DAFB)](https://reactjs.org/)
[![Vite](https://img.shields.io/badge/Vite-646CFF?logo=vite&logoColor=white)](https://vitejs.dev/)

## 📋 Table of Contents

- [🎯 Overview](#-overview)
- [✨ Features](#-features)
- [🛠 Tech Stack](#-tech-stack)
- [📦 Installation](#-installation)
- [🚀 Quick Start](#-quick-start)
- [📖 Usage](#-usage)
- [🏗 Project Structure](#-project-structure)
- [🔨 Development](#-development)
- [🤝 Contributing](#-contributing)
- [📄 License](#-license)

## 🎯 Overview

CodePolyglot is a modern web application that enables offline code translation between programming languages. Built with cutting-edge web technologies, it provides an intuitive interface for converting code snippets while maintaining semantic accuracy and providing detailed explanations.

**Key Goals:**
- **Offline-First**: No internet connection required - all processing happens locally
- **Multi-Language Support**: Convert between Python, JavaScript, TypeScript, and more
- **AST-Based Translation**: Uses abstract syntax tree analysis for accurate conversions
- **Educational**: Learn how different programming languages express similar concepts
- **Developer-Friendly**: Clean UI with real-time feedback and explanations

## ✨ Features

✅ **Multi-Language Code Conversion**
- Python ↔ JavaScript ↔ TypeScript
- Extensible architecture for adding more languages

✅ **Conversion Modes**
- **Idiomatic**: Natural, language-specific patterns
- **Strict**: Direct syntax mapping with warnings

✅ **Real-Time Code Editing**
- Syntax highlighting for all supported languages
- Live preview of converted code
- Copy-to-clipboard functionality

✅ **Intelligent Explanations**
- Detailed conversion explanations
- Warning system for potential issues
- Educational insights into language differences

✅ **Offline Operation**
- 100% client-side processing
- No API keys or external services required
- Fast, instant conversions

✅ **Modern UI/UX**
- Responsive design with dark/light themes
- Smooth animations and transitions
- Accessible components with Shadcn UI

## 🛠 Tech Stack

**Frontend Framework:**
- React 18 with TypeScript
- Vite for fast development and building
- React Router for client-side routing

**UI Components & Styling:**
- Shadcn UI component library
- Tailwind CSS for styling
- Radix UI primitives
- Lucide React icons

**State Management & Data:**
- TanStack Query for server state
- React Hook Form for form handling
- Zod for schema validation

**Development Tools:**
- ESLint for code linting
- TypeScript for type safety
- PostCSS with Autoprefixer
- Bun package manager

## 📦 Installation

### Prerequisites

- Node.js 18+ or Bun
- Git

### Clone and Setup

```bash
# Clone the repository
git clone https://github.com/SARATH4546/code-conversion-platform.git
cd code-polyglot

# Install dependencies
npm install
# or
bun install
```

### Development Server

```bash
# Start development server
npm run dev
# or
bun run dev
```

The application will be available at `http://localhost:5173`

## 🚀 Quick Start

1. **Select Languages**: Choose source and target programming languages
2. **Choose Mode**: Select conversion mode (Idiomatic or Strict)
3. **Enter Code**: Paste or type your source code
4. **Convert**: Click the convert button for instant translation
5. **Review**: Check the converted code, explanation, and any warnings
6. **Copy**: Use the copy button to get your converted code

### Example Conversion

**Python to JavaScript:**
```python
def greet(name):
    print(f"Hello, {name}!")
    return True
```

**Converted to JavaScript:**
```javascript
function greet(name) {
    console.log(`Hello, ${name}!`);
    return true;
}
```

## 📖 Usage

### Basic Conversion

1. Select your source language from the dropdown
2. Choose your target language
3. Optionally swap languages using the arrow button
4. Select conversion mode (Idiomatic for natural code, Strict for direct mapping)
5. Enter or paste your code in the source editor
6. Click "Convert Code" to see the result

### Advanced Features

- **Language Swap**: Quickly swap source and target languages
- **Clear Code**: Reset both editors with the clear button
- **Copy Results**: Copy converted code to clipboard
- **Real-time Feedback**: See explanations and warnings for each conversion

### Supported Conversions

| From/To | Python | JavaScript | TypeScript |
|---------|--------|------------|------------|
| Python  | -      | ✅         | ✅         |
| JavaScript | ✅    | -          | ✅         |
| TypeScript | 🚧    | 🚧         | -          |

*✅ = Fully supported, 🚧 = In development*

## 🏗 Project Structure

```
code-polyglot/
├── public/                 # Static assets
│   ├── placeholder.svg
│   └── robots.txt
├── src/
│   ├── components/         # Reusable UI components
│   │   ├── ui/            # Shadcn UI components
│   │   ├── CodeEditor.tsx
│   │   ├── LanguageSelector.tsx
│   │   └── ...
│   ├── hooks/             # Custom React hooks
│   ├── lib/               # Utility functions
│   │   ├── codeConverter.ts
│   │   └── utils.ts
│   ├── pages/             # Route components
│   │   ├── Index.tsx
│   │   └── NotFound.tsx
│   ├── App.tsx            # Main app component
│   └── main.tsx           # App entry point
├── package.json
├── vite.config.ts
├── tailwind.config.ts
└── README.md
```

## 🔨 Development

### Available Scripts

```bash
# Development server
npm run dev

# Build for production
npm run build

# Preview production build
npm run preview

# Lint code
npm run lint
```

### Adding New Languages

1. Extend the `sampleConversions` object in `src/lib/codeConverter.ts`
2. Add language-specific conversion rules
3. Update the `LanguageSelector` component
4. Add syntax highlighting support

### Code Style

This project uses ESLint and TypeScript for code quality. Follow these guidelines:

- Use TypeScript for all new code
- Follow React best practices
- Use functional components with hooks
- Maintain consistent naming conventions
- Add proper TypeScript types

### Testing

```bash
# Run tests (when implemented)
npm run test
```

## 🤝 Contributing

Contributions are welcome! Here's how you can help:

### Ways to Contribute

- **🐛 Bug Reports**: Found a bug? Open an issue
- **✨ Feature Requests**: Have an idea? Create a feature request
- **🔧 Code Contributions**: Fix bugs or add features
- **📚 Documentation**: Improve docs or add examples
- **🌍 Translations**: Help translate the interface

### Development Workflow

1. Fork the repository
2. Create a feature branch: `git checkout -b feature/your-feature`
3. Make your changes and commit: `git commit -m 'Add some feature'`
4. Push to the branch: `git push origin feature/your-feature`
5. Open a Pull Request

### Guidelines

- Follow the existing code style
- Add tests for new features
- Update documentation as needed
- Ensure all tests pass
- Keep PRs focused on a single feature/fix

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

<div align="center">
Made with ❤️ for developers who love learning new languages

🔒 **100% Offline** • ⚡ **Instant Conversion** • 🎯 **AST-Based Translation**

[⬆ Back to top](#codepolyglot)
</div>
