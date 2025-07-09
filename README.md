# Datanova Browser SDK

An open-source browser SDK for AI-powered data analytics. This SDK enables you to track user events, run experiments, and analyze user behavior in your web applications.

## Installation

```bash
npm install @datanova/browser
# or
yarn add @datanova/browser
# or
pnpm add @datanova/browser
```

## Quick Start

```javascript
import { createDatanovaClient } from '@datanova/browser';

// Initialize the client
const datanova = createDatanovaClient({
  apiKey: 'your-api-key',
  // Optional configuration
  apiUrl: 'https://api.datanova.sh',
  debug: true,
});

// Track an event
datanova.track('page_view', {
  page: window.location.pathname,
  title: document.title,
});

// Identify a user
datanova.identify('user-123', {
  email: 'user@example.com',
  name: 'John Doe',
});

// Run an experiment
const variant = datanova.experiment('homepage-cta', {
  variants: ['control', 'variant-a', 'variant-b'],
  defaultVariant: 'control',
});
```

## Features

- 📊 **Event Tracking**: Track user interactions and custom events
- 🧪 **A/B Testing**: Run experiments with multiple variants
- 👤 **User Identification**: Associate events with identified users
- 💾 **Flexible Storage**: Support for localStorage, sessionStorage, or custom storage
- 🔒 **Privacy-First**: Built with user privacy in mind
- 🚀 **Lightweight**: Minimal bundle size with tree-shaking support
- 🎯 **TypeScript**: Full TypeScript support with type definitions

## API Reference

### Client Initialization

```javascript
const datanova = createDatanovaClient(options);
```

Options:
- `apiKey` (required): Your Datanova API key
- `apiUrl` (optional): API endpoint URL (default: 'https://api.datanova.sh')
- `debug` (optional): Enable debug mode (default: false)
- `storage` (optional): Storage adapter (default: localStorage)
- `flushInterval` (optional): Event flush interval in ms (default: 5000)

### Methods

#### `track(eventName, properties?)`
Track a custom event with optional properties.

#### `identify(userId, traits?)`
Identify a user with optional traits.

#### `experiment(experimentId, options)`
Run an A/B test experiment.

#### `page(properties?)`
Track a page view event.

#### `reset()`
Reset the current user session.

## Development

```bash
# Install dependencies
npm install

# Run development build with watch mode
npm run dev

# Build for production
npm run build

# Run linter
npm run lint

# Run type checking
npm run tc

# Format code
npm run format
```

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

## License

MIT License - see [LICENSE](LICENSE) file for details.

## Support

- 📧 Email: support@datanova.sh
- 💬 Discord: [Join our community](https://discord.gg/datanova)
- 🐛 Issues: [GitHub Issues](https://github.com/yourusername/datanova-browser-sdk/issues)