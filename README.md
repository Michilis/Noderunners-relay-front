# Noderunners Relay

A high-performance Nostr relay built by Bitcoiners, for Bitcoiners. This project provides a web interface for managing access to the Noderunners relay service.

![Noderunners Relay](https://cdn.azzamo.net/5cc03420a18166ef7a20b1e6b7dad240ad7d634824649643c80d74a924062258.png)

## Features

- 🚀 Lightning-fast relay performance with strfry v1.0.3
- ⚡ Lightning Network integration for payments
- 🔒 Secure authentication with Nostr
- 💻 Modern, responsive web interface
- 📊 Real-time relay statistics
- 🔍 Uptime monitoring
- 🖼️ Iframe support for embedding
- 🔑 Multiple login methods (Extension, Manual, URL-based)

## Tech Stack

- **Frontend**: React + TypeScript + Vite
- **Styling**: Tailwind CSS
- **Icons**: Lucide React
- **Payment**: LNbits Integration
- **Authentication**: Nostr Protocol
- **State Management**: Zustand

## Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# LNbits Configuration
VITE_LNBITS_URL="your-lnbits-url"
VITE_LNBITS_API_KEY="your-api-key"

# App Settings
VITE_APP_NAME="Noderunners Relay"
VITE_APP_DESCRIPTION="A high-performance Nostr relay built by Bitcoiners, for Bitcoiners"
VITE_LOGO_URL="your-logo-url"
VITE_GITHUB_URL="your-github-url"

# Nostr Settings
VITE_NOSTR_RELAY_URL="wss://your-relay-url"
VITE_API_URL="your-api-url"
VITE_SUPPORTED_NIPS="1,2,4,9,11,22,28,40,70,77"
VITE_RELAY_SOFTWARE="strfry v1.0.3"

# Payment Settings
VITE_MIN_PAYMENT_AMOUNT=10000
VITE_PAYMENT_MEMO="Noderunners Relay Access"
VITE_PAYMENT_CURRENCY="sat"
VITE_WEBHOOK_URL="your-webhook-url"

# Feature Flags
VITE_ENABLE_WHITELIST=true
VITE_ENABLE_PAYMENT_VERIFICATION=true
VITE_ENABLE_DEMO=false

# Uptime Monitoring
VITE_UPTIME_KUMA_URL="your-uptime-kuma-url"
VITE_UPTIME_KUMA_ID="1"
```

## Development

1. Install dependencies:
```bash
npm install
```

2. Start the development server:
```bash
npm run dev
```

3. Build for production:
```bash
npm run build
```

## Authentication Methods

The application supports multiple authentication methods:

1. **Nostr Extension**
   - Uses browser extensions like Alby for seamless authentication
   - Automatically retrieves the user's public key

2. **Manual Entry**
   - Users can manually input their npub or hex public key
   - Supports both formats for maximum flexibility

3. **URL-based Authentication**
   - Automatically logs in using URL parameters
   - Supports both `npub` and `pubkey` parameters
   - Example URLs:
     ```
     https://your-domain.com?npub=npub1...
     https://your-domain.com?pubkey=abc123...
     ```

## Iframe Integration

The application supports iframe embedding with a clean interface. Add `?iframe=1` to the URL to:
- Hide header and footer
- Show a logout button on the dashboard
- Maintain a minimal interface

Example:
```html
<iframe src="https://your-relay-domain.com?iframe=1" width="100%" height="600px"></iframe>
```

You can combine iframe mode with URL-based authentication:
```html
<iframe src="https://your-relay-domain.com?iframe=1&npub=npub1..." width="100%" height="600px"></iframe>
```

## API Services

### LNbits Integration
- Invoice creation
- Payment verification
- Exchange rate conversion
- Wallet information

### Relay API
- User information
- Whitelist management
- Payment processing
- Status monitoring

## Contributing

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- Built by the Noderunners community
- Powered by [strfry](https://github.com/hoytech/strfry)
- Lightning Network integration via [LNbits](https://lnbits.com)
