# Datanova Browser SDK

A lightweight browser SDK for event tracking and A/B testing.

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
import { createDatanova } from '@datanova/browser';

// Initialize with your SDK key
const datanova = createDatanova('dn_sdk_your_key_here');

// Track user interactions
datanova.trackClick('cta-button', {
  section: 'hero',
});

// Track page views
datanova.trackPageView('homepage', {
  title: document.title,
});

// Identify users
datanova.identify('user-123');

// Get experiment variant
const variant = await datanova.getVariant(123);
console.log(variant); // 'control' or 'variant'

// Reset user session
datanova.reset();
```

## Features

- 📊 **Event Tracking**: Track clicks, page views, impressions, form submissions, and custom events
- 🧪 **A/B Testing**: Run experiments with control/variant assignment
- 👤 **User Identification**: Associate events with identified users
- 🚀 **Lightweight**: Minimal bundle size with tree-shaking support
- 🎯 **TypeScript**: Full TypeScript support with type definitions

## API Reference

### Client Initialization

```javascript
// Simple initialization with SDK key
const datanova = createDatanova('dn_sdk_your_key_here');

// Advanced initialization with custom services
import { ConsoleEventsService, DatanovaExperimentsService } from '@datanova/browser';

const datanova = createDatanova({
  eventsService: new ConsoleEventsService(),
  experimentsService: new DatanovaExperimentsService('dn_sdk_your_key_here'),
});
```

### Event Tracking Methods

#### `trackClick(eventName, properties?)`

Track click events with optional properties.

#### `trackPageView(eventName, properties?)`

Track page view events.

#### `trackImpression(eventName, properties?)`

Track impression events (e.g., ads, content visibility).

#### `trackSubmit(eventName, properties?)`

Track form submission events.

#### `trackChange(eventName, properties?)`

Track form field change events.

### User Management

#### `identify(userId)`

Associate subsequent events with a user ID.

#### `reset()`

Clear the current user session and start fresh.

### Experiments

#### `getVariant(experimentId)` → `Promise<Variant>`

Get the assigned variant for an experiment. Returns `'control'` or `'variant'`.

## Event Types

The SDK supports the following event types:

- `click` - User clicks
- `pageView` - Page views
- `impression` - Content impressions
- `submit` - Form submissions
- `change` - Form field changes

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

- 🐛 Issues: [GitHub Issues](https://github.com/d0-datanova/browser-sdk/issues)
