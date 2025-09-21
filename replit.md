# DataFlow - Product Manager Data Tool

## Overview

DataFlow is a comprehensive data analytics platform designed for product managers, featuring web scraping automation, social media sentiment analysis, and natural language to SQL query translation. The application provides a unified interface for collecting, analyzing, and exporting data from various sources to support data-driven decision making.

## User Preferences

Preferred communication style: Simple, everyday language.

## System Architecture

### Frontend Architecture
- **Framework**: React with TypeScript using Vite as the build tool
- **UI Library**: Radix UI components with shadcn/ui design system
- **Styling**: Tailwind CSS with CSS variables for theming (supports dark/light modes)
- **State Management**: TanStack Query for server state and React hooks for local state
- **Routing**: Wouter for client-side routing
- **Form Handling**: React Hook Form with Zod validation

### Backend Architecture
- **Runtime**: Node.js with Express.js server
- **Language**: TypeScript with ES modules
- **API Design**: RESTful API endpoints organized by feature
- **Data Validation**: Zod schemas shared between client and server
- **Error Handling**: Centralized error middleware with structured responses

### Data Storage Solutions
- **Database**: PostgreSQL with Drizzle ORM
- **Connection**: Neon Database serverless connection with connection pooling
- **Schema Management**: Code-first approach with Drizzle migrations
- **Query Builder**: Type-safe queries using Drizzle ORM with shared TypeScript types

### Database Schema Design
- **scraped_data**: Stores web scraping results with JSON content and metadata
- **scrapers**: Configuration for automated web scraping jobs
- **queries**: Natural language and SQL query history with cached results
- **social_media_data**: Social media posts with sentiment analysis and metrics
- **exports**: Data export jobs and file management
- **activities**: Activity logging for user actions and system events

### Authentication and Authorization
- Session-based authentication using express-session
- PostgreSQL session store for persistence
- No complex role-based access control (single-user focused)

### API Integration Architecture
- **OpenAI Integration**: Natural language to SQL conversion and sentiment analysis
- **Web Scraping**: Python subprocess integration for complex scraping tasks
- **Modular Services**: Separate service layer for external API calls

### Development and Deployment
- **Development**: Hot reload with Vite middleware integration
- **Build Process**: Separate client (Vite) and server (esbuild) builds
- **Asset Management**: Vite handles static assets and bundling
- **Error Handling**: Runtime error overlay for development debugging

## External Dependencies

### Database Services
- **Neon Database**: Serverless PostgreSQL hosting with WebSocket connections
- **Drizzle ORM**: Type-safe database queries and schema management
- **connect-pg-simple**: PostgreSQL session store for Express sessions

### AI and ML Services
- **OpenAI API**: GPT model integration for natural language processing
  - Natural language to SQL query generation
  - Social media sentiment analysis
  - Query explanation and validation

### UI and Component Libraries
- **Radix UI**: Headless, accessible component primitives
- **shadcn/ui**: Pre-built component library built on Radix UI
- **Tailwind CSS**: Utility-first CSS framework with custom design tokens
- **React Hook Form**: Performant form handling with validation
- **TanStack Query**: Server state management and caching

### Development Tools
- **Vite**: Fast build tool with hot module replacement
- **TypeScript**: Type safety across the entire application
- **Wouter**: Lightweight client-side routing
- **esbuild**: Fast JavaScript bundler for server-side builds

### Web Scraping Infrastructure
- **Python Scripts**: External Python processes for web scraping
- **BeautifulSoup**: HTML parsing and data extraction
- **Requests**: HTTP client for web scraping operations

### Data Processing
- **Zod**: Runtime type validation and schema definition
- **date-fns**: Date manipulation and formatting utilities
- **JSON Storage**: Flexible data storage for scraped content and metadata