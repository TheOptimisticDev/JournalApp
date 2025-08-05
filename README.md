# Journal App - Ionic Framework

![App Preview](/public/chimp.png)

## Overview

The Journal App is a mobile application built with Ionic Framework that allows users to:

* Record daily journal entries
* Track moods and emotions
* Add multimedia content (photos, videos, audio)
* Search past entries
* Reflect on past experiences with AI-powered insights

## Features

### Core Functionality

* 📝 **Journal Entries**: Create, edit, and delete journal entries with rich text
* 🌈 **Mood Tracking**: Select from various moods with color-coded visual indicators
* 📅 **Timeline View**: Browse entries chronologically with intuitive filtering
* 🔍 **Smart Search**: Find entries using natural language queries
* 📊 **Reflection Tools**: View past entries from the same date in previous years

### Technical Highlights

* ⚛️ Built with [Ionic React](https://ionicframework.com/react) and [Capacitor](https://capacitorjs.com/)
* 📱 Cross-platform: iOS, Android, and PWA support
* 🔒 Local storage with [Capacitor Preferences](https://capacitorjs.com/docs/apis/preferences)
* 🤖 Optional AI integration for search and insights

## Installation

### Prerequisites

* Node.js (v14 or later)
* npm (v6 or later) or yarn
* Ionic CLI (`npm install -g @ionic/cli`)

### Setup

1.  **Clone the repository:**
    ```bash
    git clone [https://github.com/yourusername/journal-app.git](https://github.com/yourusername/journal-app.git)
    cd journal-app
    ```
2.  **Install dependencies:**
    ```bash
    npm install
    # or
    yarn install
    ```
3.  **Run the development server:**
    ```bash
    ionic serve
    ```

## Building for Platforms

### Android

```bash
ionic cap add android
ionic cap sync android
ionic cap open android
```

### iOS

```bash
ionic cap add ios
ionic cap sync ios
ionic cap open ios
```

### Progressive Web App

```bash
ionic build --prod
```

## Project Structure

```
src/
├── assets/               # Static assets
├── components/           # Reusable components
├── hooks/                # Custom React hooks
├── pages/                # App screens
│   ├── Home/             # Main journal interface
│   ├── History/          # Entry Browse
│   └── ...               # Other pages
├── services/             # Business logic
│   ├── ai/               # AI integration
│   └── storage/          # Data persistence
├── theme/                # Global styles
└── utils/                # Utility functions
```

## Configuration

Create a .env file in the root directory for environment variables:
# Optional AI service keys
AI_API_KEY=your_api_key_here
AI_ENDPOINT=[https://api.example.com](https://api.example.com)

## Contributing

We welcome contributions! Please follow these steps:

- Fork the repository

- Create a feature branch (git checkout -b feature/your-feature)

- Commit your changes (git commit -m 'Add some feature')

- Push to the branch (git push origin feature/your-feature)

- Open a Pull Request

## License

- This project is licensed under the MIT License - see the LICENSE file for details.

## 📸 Screenshots

### 🏠 Home Screen  
![Home Screen](/public/home-list.png)

---

### 📓 Journals  
![Journals Screen](/public/journals.png)

---

### 👤 Profile  
![Profile Screen](/public/profile.png)

---

### 📝 Entry Modal  
![Entry Modal](/public/entry.png)


## Roadmap

- Cloud sync functionality

- Data export options

- Enhanced analytics dashboard

- Voice-to-text entry creation

## Support
For issues or questions, please open an issue on GitHub.