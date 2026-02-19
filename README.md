# PreDelinq AI

[![Live Demo](https://img.shields.io/badge/Live%20Demo-Visit%20Site-blue)](https://pre-delinquency-ai.vercel.app/)

PreDelinq AI is an advanced financial risk monitoring and intervention dashboard designed to empower financial institutions to proactively identify and manage customer delinquency risks. By leveraging real-time data and predictive analytics, PreDelinq AI helps risk management teams take timely, data-driven actions to mitigate potential defaults.

## 🚀 Live Demo

Experience the application live at: [https://pre-delinquency-ai.vercel.app/](https://pre-delinquency-ai.vercel.app/)

## ✨ Key Features

- **Predictive Risk Scoring**: Sophisticated algorithms that assess customer behavior to generate accurate risk scores and default probabilities.
- **Real-time Alert System**: Instant notifications for critical risk threshold breaches, ensuring no high-risk event goes unnoticed.
- **Intelligent Intervention Logging**: Automated suggestions for intervention strategies (Tier 1-3) tailored to specific risk profiles.
- **Comprehensive Customer 360**: Detailed customer profiles visualizing financial health, spending patterns, and behavioral signals.
- **Audit Trails**: Robust logging of all system activities, risk assessments, and intervention triggers for compliance and review.
- **Data Upload & Processing**: Support for CSV uploads to analyze customer data and generate insights.
- **Responsive Design**: Built with modern UI components for seamless experience across devices.

## 🛠 Technology Stack

This project is built using a modern, high-performance technology stack:

- **Frontend Framework**: [React](https://react.dev/) with [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/) for fast development and optimized builds
- **Styling**: [Tailwind CSS](https://tailwindcss.com/) for utility-first CSS
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/) for beautiful, accessible components
- **Data Visualization**: [Recharts](https://recharts.org/) for interactive charts
- **State Management**: [TanStack Query](https://tanstack.com/query/latest) for server state management
- **Testing**: [Vitest](https://vitest.dev/) for fast unit testing
- **Linting**: ESLint for code quality

## 📋 Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended, v18+)
- npm, yarn, pnpm, or bun (package manager of your choice)

## 🚀 Getting Started

Follow these instructions to set up the project locally for development and testing.

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd predelinq-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   # or
   yarn install
   # or
   pnpm install
   # or
   bun install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   # or
   yarn dev
   # or
   pnpm dev
   # or
   bun dev
   ```

   The application will start, and the terminal will display the local URL (typically `http://localhost:5173`).

### Building for Production

To build the application for production deployment:

```bash
npm run build
# or
yarn build
# or
pnpm build
# or
bun run build
```

This command generates a highly optimized build in the `dist` folder.

### Running Tests

```bash
npm run test
# or
yarn test
# or
pnpm test
# or
bun run test
```

## 📁 Project Structure

```
src/
├── components/          # Reusable UI components and feature modules
│   ├── ui/             # shadcn/ui components
│   └── ...
├── hooks/              # Custom React hooks
├── pages/              # Main application views/routes
├── types/              # TypeScript type definitions
├── utils/              # Utility functions, engines, and seed data
│   ├── riskEngine.ts   # Risk assessment logic
│   ├── interventionEngine.ts  # Intervention strategies
│   └── ...
└── ...
```

## 🤝 Contributing

We welcome contributions! Please follow these steps:

1. Fork the repository.
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.


## 👤 Author

**Abhay**  
- LinkedIn: [Abhay ](https://www.linkedin.com/in/abhaymahalle/)
- Email: abhaymahalle0311@gmail.com

---

Built with ❤️ using React, TypeScript, and modern web technologies.
