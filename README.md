# 🏥 Healthcare AI Assistant

A sophisticated AI-powered healthcare diagnostic platform that provides intelligent medical consultation, symptom analysis, and clinical decision support using advanced Large Language Models.

![Healthcare AI](https://img.shields.io/badge/Healthcare-AI%20Platform-blue)
![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)
![React](https://img.shields.io/badge/React-20232A?style=flat&logo=react&logoColor=61DAFB)
![Node.js](https://img.shields.io/badge/Node.js-43853D?style=flat&logo=node.js&logoColor=white)
![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white)

## 🚀 Features

- **🤖 AI-Powered Analysis** - Uses Groq AI with DeepSeek R1 Distill Llama 70B for advanced medical reasoning
- **🏥 Multiple User Modes** - Optimized workflows for patients, healthcare professionals, and caregivers
- **📊 Intelligent Diagnostics** - Advanced differential diagnosis with confidence scoring
- **❓ Dynamic Question Generation** - Smart MCQ and follow-up question creation
- **🔬 Clinical Decision Support** - Treatment pathways, risk assessment, and drug interaction checking
- **🌐 Real-time Processing** - Fast AI analysis with progress tracking and live updates
- **📱 Responsive Design** - Seamless experience across desktop and mobile devices
- **🔒 Secure & Scalable** - Enterprise-grade security with comprehensive API testing

## 🛠️ Technology Stack

### Frontend
- **React 18** with TypeScript
- **Tailwind CSS** for styling
- **Radix UI** components
- **Vite** for development and building

### Backend
- **Node.js** with Express
- **TypeScript** for type safety
- **PostgreSQL** with Drizzle ORM
- **Groq SDK** for AI integration

### AI & Machine Learning
- **DeepSeek R1 Distill Llama 70B** (Medical Reasoning)
- **Llama 3.3 70B** (Conversational AI)
- **Custom Prompt Engineering** for medical contexts
- **Multi-model LLM Integration**

## 📋 Prerequisites

- **Node.js** >= 18.0.0
- **npm** >= 8.0.0
- **PostgreSQL** database (or Neon cloud database)
- **Groq API Keys** for AI functionality

## 🚀 Quick Start

### 1. Clone the Repository

```bash
git clone https://github.com/Pankajnegi356/Healthcare-AI-Assistent.git
cd healthcare-ai-assistant
```

### 2. Install Dependencies

```bash
npm install
```

### 3. Environment Setup

```bash
# Copy environment template
cp .env.example .env

# Edit .env with your credentials
nano .env
```

### 4. Configure Environment Variables

```bash
# Database Configuration
DATABASE_URL="postgresql://username:password@host:port/database?sslmode=require"

# AI Service Configuration  
GROQ_API_KEY_REASONER="your_groq_reasoner_api_key"
GROQ_API_KEY_CHAT="your_groq_chat_api_key"

# Server Configuration
NODE_ENV="development"
PORT=3000
```

### 5. Database Setup

```bash
# Generate database schema
npm run db:generate

# Push schema to database
npm run db:push
```

### 6. Start Development Server

```bash
npm run dev
```

The application will be available at:
- **Local**: `http://localhost:3000`
- **Network**: `http://[your-ip]:3000`

### 7. Verify Installation

```bash
# Test API endpoints
node --import tsx run-api-tests.js

# Check health status
curl "http://localhost:3000/api/health"
```

## 🏗️ Project Structure

```
healthcare-ai-assistant/
├── client/                 # Frontend React application
│   ├── src/
│   │   ├── components/     # React components
│   │   ├── lib/           # Utility libraries
│   │   ├── pages/         # Application pages
│   │   ├── services/      # API services
│   │   └── types/         # TypeScript definitions
│   └── public/            # Static assets
├── server/                # Backend Node.js application
│   ├── config/           # Configuration files
│   ├── services/         # Business logic services
│   └── routes.ts         # API routes
├── shared/               # Shared types and schemas
├── migrations/           # Database migrations
└── docs/                # Documentation
```

## 🧪 API Testing

The project includes comprehensive API testing:

```bash
# Run all API tests
node --import tsx run-api-tests.js

# Run specific test suites
node test-api-direct.js
node test-mcq-simple.js
node test-enhanced-features.js
```

## 🌐 Deployment

### Development
```bash
npm run dev
```

### Production
```bash
# Build the application
npm run build

# Start production server
npm start
```

### Docker Deployment
```bash
# Build Docker image
docker build -t healthcare-ai .

# Run container
docker run -p 3000:3000 healthcare-ai
```

### Environment Variables for Production

Set the following environment variables in your deployment platform:

- `DATABASE_URL` - PostgreSQL connection string
- `GROQ_API_KEY_REASONER` - Groq API key for reasoning model
- `GROQ_API_KEY_CHAT` - Groq API key for chat model
- `NODE_ENV=production`
- `PORT=3000`

## 🔧 Development Commands

```bash
# Development
npm run dev              # Start development server
npm run check           # TypeScript type checking
npm run check:watch     # Watch mode type checking

# Building
npm run build           # Build for production
npm run preview         # Preview production build

# Code Quality
npm run lint            # ESLint checking
npm run lint:fix        # Fix ESLint issues
npm run format          # Format code with Prettier
npm run format:check    # Check code formatting

# Database
npm run db:generate     # Generate migrations
npm run db:push         # Push schema to database
npm run db:migrate      # Run migrations

# Testing
npm run test            # Run tests
npm run health-check    # Check application health
```

## 🚀 Key Features

### AI-Powered Medical Analysis
- Advanced symptom analysis with confidence scoring
- Differential diagnosis generation
- Clinical decision support
- Treatment pathway recommendations

### Intelligent Question Generation
- Dynamic MCQ creation based on symptoms
- Context-aware follow-up questions
- Adaptive difficulty levels
- Educational content generation

### Multi-User Support
- **Patient Mode**: Simplified interface for patients
- **Doctor Mode**: Clinical terminology and advanced features
- **Unified Mode**: Balanced approach for general use

### Advanced API Features
- Request caching and optimization
- Retry logic with exponential backoff
- Performance monitoring
- Comprehensive error handling

## 🔒 Security Features

- Environment variable protection
- CORS configuration for secure access
- Rate limiting and request validation
- Secure session handling
- Input sanitization and validation

## 📚 Documentation

- [Running this project.md](./Running%20this%20project.md) - Detailed setup guide
- [API_TESTING_IMPLEMENTATION.md](./API_TESTING_IMPLEMENTATION.md) - API testing documentation
- [DEPLOYMENT.md](./DEPLOYMENT.md) - Deployment instructions

## 🤝 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request

## 📄 License

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

## 🆘 Support

If you encounter any issues:

1. Check the [Running this project.md](./Running%20this%20project.md) guide
2. Run the API tests: `node --import tsx run-api-tests.js`
3. Check the health endpoint: `curl http://localhost:3000/api/health`
4. Open an issue on GitHub

## 🙏 Acknowledgments

- Built with [Groq](https://groq.com/) for lightning-fast AI inference
- Powered by [DeepSeek](https://deepseek.com/) and [Llama](https://llama.meta.com/) models
- UI components from [Radix UI](https://www.radix-ui.com/)
- Database hosting by [Neon](https://neon.tech/)

---

**⚠️ Disclaimer**: This application is for educational and research purposes. Always consult qualified healthcare professionals for medical advice.

