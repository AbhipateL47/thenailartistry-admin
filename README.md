# The Nail Artistry - Admin Panel

Admin frontend for The Nail Artistry e-commerce platform.

## Tech Stack

- **React** 18.3.1
- **TypeScript** 5.8.3
- **Vite** 5.4.19
- **Tailwind CSS** 3.4.17
- **shadcn/ui** - Component library
- **React Router** 6.30.1
- **TanStack Query** 5.83.0
- **Axios** 1.13.1

## Getting Started

### Prerequisites

- Node.js 18.x or higher
- npm 9.x or higher

### Installation

```bash
npm install
```

### Development

```bash
npm run dev
```

The app will be available at `http://localhost:8081`

### Build

```bash
npm run build
```

Build output will be in the `dist/` directory.

### Preview Production Build

```bash
npm run preview
```

## Environment Variables

Create a `.env` file in the root directory:

```env
VITE_API_URL=https://api.thenailartistry.store
```

## Project Structure

```
thenailartistry-admin/
├── src/
│   ├── api/              # API client configuration
│   ├── components/       # React components
│   │   └── ui/          # shadcn/ui components
│   ├── contexts/        # React contexts
│   ├── hooks/           # Custom hooks
│   ├── lib/             # Utility functions
│   ├── pages/           # Page components
│   ├── services/        # API service layer
│   ├── utils/           # Utility functions
│   ├── App.tsx          # Main app component
│   ├── main.tsx         # Entry point
│   └── index.css        # Global styles
├── public/               # Static assets
└── dist/                # Build output
```

## Configuration

- **TypeScript**: Relaxed strictness (matching client frontend)
- **Path Aliases**: `@/*` → `./src/*`
- **Authentication**: Cookie-based (httpOnly JWT)
- **API Client**: Axios with `withCredentials: true`

## License

Proprietary - All rights reserved.

