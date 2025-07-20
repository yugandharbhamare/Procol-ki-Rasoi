# Procol ki Rasoi - Food Ordering App

A mobile-first food ordering application built with React and Tailwind CSS. Features a beautiful menu interface with cart functionality and a floating cart summary.

## Features

- 🔐 **Google Authentication** - Secure sign-in with Google
- 🍽️ **Mobile-first design** - Optimized for mobile devices
- 🛒 **Interactive cart** - Add items with quantity stepper
- 💰 **Real-time pricing** - Live total calculation
- 📱 **Floating cart summary** - Always visible at bottom
- 🎨 **Modern UI** - Clean, responsive design with Tailwind CSS
- 🍕 **Categorized menu** - Items organized by category
- 👤 **User profiles** - Personalized experience with profile pictures
- 📋 **Order tracking** - Complete order history with user details
- 💳 **Payment integration** - UPI payment with QR codes

## Tech Stack

- **React 18** - Modern React with hooks
- **Tailwind CSS** - Utility-first CSS framework
- **Vite** - Fast build tool and dev server
- **Firebase** - Authentication and backend services
- **PostCSS** - CSS processing

## Getting Started

### Prerequisites

- Node.js (version 16 or higher)
- npm or yarn
- Firebase project (for authentication)

### Installation

1. Clone the repository or navigate to the project directory
2. Install dependencies:
   ```bash
   npm install
   ```

### Firebase Setup

1. **Create a Firebase Project**:
   - Go to [Firebase Console](https://console.firebase.google.com/)
   - Create a new project or use an existing one
   - Enable Google Authentication in Authentication → Sign-in method

2. **Configure Environment Variables**:
   - Copy `env.example` to `.env`
   - Fill in your Firebase configuration values:
   ```bash
   cp env.example .env
   ```

3. **Get Firebase Config**:
   - In Firebase Console → Project Settings → Your Apps
   - Add a web app and copy the configuration
   - Update your `.env` file with the real values

4. **Authorized Domains**:
   - Go to Authentication → Settings → Authorized domains
   - Add `localhost` for development
   - Add your production domain when deploying

For detailed Firebase setup instructions, see [FIREBASE_SETUP.md](FIREBASE_SETUP.md).

### Running the Application

1. Start the development server:
   ```bash
   npm run dev
   ```

2. Open your browser and navigate to `http://localhost:3000`

### Building for Production

```bash
npm run build
```

## Usage

1. **Browse the Menu**: Scroll through different food categories
2. **Add Items**: Click "Add to Cart" on any item
3. **Adjust Quantities**: Use the +/- buttons to change quantities
4. **View Cart**: See your items in the floating cart summary at the bottom
5. **Place Order**: Click "Place Order" to complete your purchase

## Project Structure

```
src/
├── components/
│   ├── Header.jsx          # App header with branding
│   ├── Menu.jsx            # Main menu component
│   ├── MenuItem.jsx        # Individual menu item
│   └── CartSummary.jsx     # Floating cart summary
├── App.jsx                 # Main app component
├── main.jsx               # React entry point
└── index.css              # Global styles and Tailwind imports
```

## Customization

### Adding New Menu Items

Edit the `menuItems` array in `src/components/Menu.jsx`:

```javascript
{
  id: 9,
  name: "Your Dish Name",
  price: 150,
  description: "Description of your dish",
  category: "Category Name",
  image: "🍽️"
}
```

### Styling

The app uses Tailwind CSS with custom primary colors. Modify `tailwind.config.js` to change the color scheme.

## 🚀 Deployment & CI/CD

This project includes comprehensive GitHub Actions workflows for automated testing, building, and deployment.

### Workflows Included:
- **CI/CD Pipeline**: Automated testing and deployment to production
- **Development Workflow**: Preview deployments for pull requests
- **Security Checks**: Dependency scanning and code quality checks
- **Release Management**: Automated versioning and changelog generation

### Quick Deploy:
1. Fork this repository
2. Set up required secrets in GitHub repository settings
3. Push to `main` branch for automatic deployment

For detailed workflow documentation, see [docs/GITHUB_WORKFLOWS.md](docs/GITHUB_WORKFLOWS.md).

## 📋 Contributing

1. Fork the repository
2. Create a feature branch (`git checkout -b feature/amazing-feature`)
3. Commit your changes (`git commit -m 'Add amazing feature'`)
4. Push to the branch (`git push origin feature/amazing-feature`)
5. Open a Pull Request using the provided template

## 📝 Issue Reporting

Use the provided issue templates for:
- 🐛 Bug reports
- ✨ Feature requests

## 🔒 Security

### Environment Variables
- **Never commit your `.env` file** - It contains sensitive Firebase credentials
- The `.env` file is already in `.gitignore` to prevent accidental commits
- Each developer/fork needs their own Firebase project and credentials
- Use `env.example` as a template for your own configuration

### Firebase Security
- Each fork should create their own Firebase project
- Firebase credentials are tied to specific domains and projects
- Your credentials won't work for other developers' forks
- Follow Firebase security best practices for production deployment

## License

This project is open source and available under the MIT License. 

Perfect! ✅ **Your Local Development Server is Live!**

## 🎯 **Server Status:**

### **✅ Vite Server Running:**
- **Process ID**: 32918
- **Port**: 3000 (hbci = port 3000)
- **Status**: Active and listening
- **Network**: Available on localhost and network

### **✅ Access URLs:**
- **Local**: `http://localhost:3000`
- **Network**: `http://192.168.1.3:3000` (for mobile testing)

## 📱 **Testing Options:**

### **✅ Desktop Testing:**
```
http://localhost:3000
```

### **✅ Mobile Testing:**
```
http://192.168.1.3:3000
```

## 🎉 **Current Features Available:**

### **✅ Authentication:**
- Google Sign-In (if Firebase is configured)
- User profile with photo/initials
- Mobile drawer for user details

### **✅ Food Ordering:**
- Menu browsing
- Cart functionality
- Payment integration
- Receipt generation

### **✅ Mobile Optimization:**
- Responsive design
- Touch-friendly interface
- Mobile-optimized header

## 🚀 **Next Steps:**

### **✅ For Testing:**
1. **Open Browser**: Go to `http://localhost:3000`
2. **Mobile Testing**: Use `http://192.168.1.3:3000` on your phone
3. **Firebase Setup**: Make sure your `.env` file is configured

### **✅ For Firebase:**
- Create `.env` file with your Firebase credentials
- Enable Google Authentication in Firebase Console
- Add `localhost` and `192.168.1.3` to authorized domains

Your local development server is running and ready for testing! 🎉✨ 