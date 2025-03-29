# Solana Explorer for Raycast

A powerful Raycast extension that brings Solana blockchain exploration directly to your fingertips. Search and explore Solana addresses, transactions, blocks, and tokens with ease.

![Extension Icon](extension-icon.png)

## Features

### 🔍 Smart Search
- **Address Lookup**: Search for any Solana wallet address
- **Transaction Search**: Find transaction details by signature
- **Block Explorer**: Look up block information by block number
- **Token Discovery**: Search for token accounts and view detailed token information

### 📊 Comprehensive Information
- **Account Details**:
  - SOL balance
  - Lamports
  - Account size
  - Owner program
  - Rent epoch
  - Slot information

- **Transaction Details**:
  - Block time
  - Transaction fee
  - Status (Success/Failed)
  - Block hash
  - Instructions
  - Program interactions

- **Token Information**:
  - Token name and symbol
  - Decimals
  - Total supply
  - Fully diluted value
  - Token logo
  - Account details
  - Metadata

### 🔗 Multiple Explorer Support
- Solana Explorer
- Solscan
- SolanaFM

### 📱 User-Friendly Interface
- Clean, organized display of information
- Markdown-formatted results
- Quick access to external explorers
- Copy-to-clipboard functionality
- Search history tracking

## Installation

1. Install Raycast from the [Mac App Store](https://apps.apple.com/app/raycast/id1548341683)
2. Open Raycast and press `⌘ + Space`
3. Type "Extensions" and select "Browse Extensions"
4. Search for "Solana Explorer"
5. Click "Install"

## Usage

1. Open Raycast (`⌘ + Space`)
2. Type "Search Explorer" or use the keyboard shortcut
3. Enter your search query:
   - Solana address (base58 encoded)
   - Transaction signature (88 characters)
   - Block number
   - Token account address

## Preferences

1. Open Raycast
2. Go to Extensions
3. Find "Solana Explorer"
4. Click the gear icon to open preferences
5. Configure:
   - Default Explorer: Choose your preferred Solana block explorer
   - Moralis API Key: Your API key for token metadata

## Development

### Prerequisites
- Node.js 16 or later
- npm or yarn
- Raycast

### Setup
1. Clone the repository
```bash
git clone https://github.com/yourusername/solana-explorer.git
cd solana-explorer
```

2. Install dependencies
```bash
npm install
# or
yarn install
```

3. Start development server
```bash
npm run dev
# or
yarn dev
```

### Building
```bash
npm run build
# or
yarn build
```

### Publishing
```bash
npm run publish
# or
yarn publish
```

## Contributing

Contributions are welcome! Please feel free to submit a Pull Request.

1. Fork the repository
2. Create your feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add some amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## Acknowledgments

- [Raycast](https://raycast.com/) for the amazing platform
- [Solana](https://solana.com/) for the blockchain
- [Helius](https://helius.xyz/) for the RPC endpoint
- [Moralis](https://moralis.io/) for token metadata

## Support

If you encounter any issues or have suggestions, please [open an issue](https://github.com/yourusername/solana-explorer/issues).