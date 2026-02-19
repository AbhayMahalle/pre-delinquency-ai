# PreDelinq AI

PreDelinq AI is an advanced financial risk monitoring and intervention dashboard designed to empower financial institutions to proactively identify and manage customer delinquency risks. By leveraging real-time data and predictive analytics, PreDelinq AI helps risk management teams take timely, data-driven actions to mitigate potential defaults.

## Key Features

- **Predictive Risk Scoring**: sophisticated algorithms that assess customer behavior to generate accurate risk scores and default probabilities.
- **Real-time Alert System**: Instant notifications for critical risk threshold breaches, ensuring no high-risk event goes unnoticed.
- **Intelligent Intervention Logging**: Automated suggestions for intervention strategies (Tier 1-3) tailored to specific risk profiles.
- **Comprehensive Customer 360**: Detailed customer profiles visualizing financial health, spending patterns, and behavioral signals.
- **Audit Trails**: Robust logging of all system activities, risk assessments, and intervention triggers for compliance and review.

## Technology Stack

This project is built using a modern, high-performance technology stack:

- **Frontend Framework**: [React](https://react.dev/)
- **Language**: [TypeScript](https://www.typescriptlang.org/)
- **Build Tool**: [Vite](https://vitejs.dev/)
- **Styling**: [Tailwind CSS](https://tailwindcss.com/)
- **UI Components**: [shadcn/ui](https://ui.shadcn.com/)
- **Data Visualization**: [Recharts](https://recharts.org/)
- **State Management**: [TanStack Query](https://tanstack.com/query/latest)

## Getting Started

Follow these instructions to set up the project locally for development and testing.

### Prerequisites

- [Node.js](https://nodejs.org/) (LTS version recommended)
- npm (comes with Node.js) or your preferred package manager (yarn, pnpm)

### Installation

1. **Clone the repository**
   ```bash
   git clone <YOUR_GIT_URL>
   cd predelinq-ai
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Start the development server**
   ```bash
   npm run dev
   ```
   The application will start, and the terminal will display the local URL (typically `http://localhost:8080` or `http://localhost:5173`).

### Building for Production

To build the application for production deployment:

```bash
npm run build
```

This command generates a highly optimized build in the `dist` folder.

## Project Structure

- `src/components`: Reusable UI components and specific feature modules.
- `src/hooks`: Custom React hooks for logic reuse.
- `src/pages`: Main application views/routes.
- `src/types`: TypeScript type definitions.
- `src/utils`: Utility functions and seed data.

## Contributing

1. Fork the repository.
2. Create a new branch for your feature (`git checkout -b feature/amazing-feature`).
3. Commit your changes (`git commit -m 'Add some amazing feature'`).
4. Push to the branch (`git push origin feature/amazing-feature`).
5. Open a Pull Request.
