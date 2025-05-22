# PizzaDAO Molto Bene Telegram Bot

A Telegram bot built with NestJS for managing PizzaDAO's Global Pizza Party event registrations and community interactions.

## 🍕 About

This bot serves as the registration and management system for PizzaDAO's telegram groups. It helps manage user registrations across multiple cities worldwide, handles user verification, and facilitates community engagement through post broadcasting.

## 🚀 Features

- **User Registration & Verification**
  - Automated user verification for new group members
  - Custom pizza name generation using AI

- **Profile Management**
  - Customizable user profiles
  - Multiple city participation tracking
  - Favorite pizza toppings
  - Ninja Turtle character selection
  - Mafia movie preferences

- **Group Management**
  - Broadcast messages
  - Automated welcome messages
  - User permission management
  - Multi-city group support
  - Message cleanup and organization

## 🛠 Tech Stack

- NestJS
- Telegraf (Telegram Bot Framework)
- PostgreSQL with Knex.js
- OpenAI Integration
- Docker Support

## 📋 Prerequisites

- Node.js v22
- Docker
- Telegram Bot Token
- OpenAI API Key

## 🔧 Environment Variables

Create a `.env` file in the root directory with the following variables:

```env
# Bot Configuration
TELEGRAM_BOT_TOKEN=your_telegram_bot_token
BOT_USERNAME=your_bot_username
ENABLE_WEBHOOK=true/false
WEBHOOK_DOMAIN=your_webhook_domain
ADMIN_IDS=admin_ids_seperated_by_commas

# Database Configuration
PG_HOST=your_postgres_host
PG_PORT=your_postgres_port
PG_DB=your_database_name
PG_USER=your_database_user
PG_PW=your_database_password

# OpenAI Configuration
OPENAI_API_KEY=your_openai_api_key
```

## 🚀 Installation

1. Clone the repository:
```bash
git clone https://github.com/yourusername/PizzaDao-MoltoBene-TGBot-BE.git
cd PizzaDao-MoltoBene-TGBot-BE
```

2. Install dependencies:
```bash
npm install
```

3. Start the PostgreSQL database using Docker:
```bash
docker-compose up -d
```

4. Run database migrations:
```bash
npm run migrate
npm run fixtures
```

4. Sync unlock events:
```bash
npm run unlock:sync
```

5. Start the development server:
```bash
npm run serve:local
```
