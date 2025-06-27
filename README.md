# 🐕 WatchDogs NFT Marketplace

<p align="center">
    <strong>Decentralized NFT Marketplace for Digital Collectibles</strong>
</p>

## 🚀 Features

- **INK Network**: Native marketplace built on INK blockchain
- **Multiple Collections**: Support for various NFT collections on INK
- **ETH Payments**: Seamless transactions with ETH on INK network
- **User Profiles**: Personalized profiles for collectors and creators
- **Staking System**: Stake $WATCH tokens and earn rewards
- **AI Agents**: Interactive AI-powered features
- **Modern UI**: Beautiful and responsive user interface
- **Real-time Analytics**: Track marketplace statistics and trends

## 🛠️ Tech Stack

- **Frontend**: Next.js 14 with TypeScript
- **Styling**: Chakra UI
- **Blockchain**: Web3 integration with INK network
- **Database**: MongoDB
- **State Management**: Custom hooks and stores

## 📋 Getting Started

### Prerequisites

- Node.js 18+
- npm, yarn, or pnpm
- Git

### Installation

1. **Clone the repository**

```bash
git clone https://github.com/watchdogsonink/marketplacev3.git
cd marketplacev3
```

2. **Install dependencies**

```bash
npm install
# or
yarn install
# or
pnpm install
```

3. **Set up environment variables**

Create a `.env.local` file in the root directory:

```env
# Add your environment variables here
MONGODB_URI=your_mongodb_connection_string
NEXT_PUBLIC_MARKETPLACE_CONTRACT=your_marketplace_contract_address
```

4. **Run the development server**

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
```

Open [http://localhost:3000](http://localhost:3000) to view the marketplace.

## 🔧 Configuration

### INK Network Setup

Configure INK blockchain settings in `/src/consts/chains.ts`

### NFT Collections

Add your NFT contract addresses in `/src/consts/nft_contracts.ts`

### Marketplace Contracts

Set up marketplace contract addresses in `/src/consts/marketplace_contract.ts`

## 📁 Project Structure

```
src/
├── app/                 # Next.js app directory
├── components/          # React components
├── consts/             # Configuration constants
├── hooks/              # Custom React hooks
├── lib/                # Utility libraries
├── store/              # State management
├── types/              # TypeScript type definitions
└── utils/              # Utility functions
```

## 🎨 Key Features

### NFT Trading

- Buy and sell NFTs with ETH payments
- Create and manage listings
- Browse collections and individual tokens

### User Profiles

- View user collections and trading history
- ENS name resolution support
- Personalized dashboards

### Staking System

- Stake $WATCH to earn rewards
- Track staking statistics and history

### AI Integration

- AI-powered chat features
- Intelligent recommendations

## 🚀 Deployment

### Build for Production

```bash
npm run build
```

### Deploy to Vercel

```bash
npx vercel
```

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 🔗 Links

- [Web](https://watchdogs.ink)
- [Twitter](https://twitter.com/watchdogsonink)

## ⚡ Performance

- Built with performance in mind
- Optimized for mobile and desktop
- Fast loading times and smooth interactions

## 🛡️ Security

- Smart contract audits
- Secure wallet connections
- Best practices for Web3 security

---

**Made with ❤️ by the WatchDogs team**
