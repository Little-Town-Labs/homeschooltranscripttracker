# 🎓 HomeschoolTracker

> **A comprehensive SaaS platform for homeschooling families to track student progress, manage courses, and generate official transcripts.**

[![Deploy to Netlify](https://www.netlify.com/img/deploy/button.svg)](https://app.netlify.com/start/deploy?repository=https://github.com/Little-Town-Labs/homeschooltranscripttracker)
[![License: MIT](https://img.shields.io/badge/License-MIT-yellow.svg)](https://opensource.org/licenses/MIT)
[![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white)](https://www.typescriptlang.org/)
[![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white)](https://nextjs.org/)

---

## 🌟 **Features**

### 📚 **Academic Management**
- **Student Management** - Add multiple students with detailed profiles
- **Course Creation** - Comprehensive course management with grades and credits
- **Grade Tracking** - Record and monitor academic progress over time
- **Test Score Management** - Track standardized test results and assessments

### 📜 **Official Documentation**
- **Transcript Generation** - Create professional, printable transcripts
- **GPA Calculation** - Automatic weighted and unweighted GPA computation
- **Academic Reports** - Detailed progress reports and analytics
- **Export Options** - PDF generation for official documentation

### 💼 **SaaS Features**
- **Multi-Tenant Architecture** - Secure family data isolation
- **Subscription Management** - Stripe-powered billing system
- **User Authentication** - Secure login with NextAuth.js
- **Responsive Design** - Mobile-first, beautiful UI

### 🛡️ **Security & Compliance**
- **Data Privacy** - FERPA-compliant student record management
- **Secure Storage** - Encrypted data with PostgreSQL + Supabase
- **Row-Level Security** - Advanced database-level permissions
- **HTTPS Enforced** - Production-ready security headers

---

## 🚀 **Live Demo**

🔗 **[View Live Application](https://homeschooltracker.netlify.app)** *(Coming Soon)*

---

## 🛠️ **Tech Stack**

### **Frontend**
- ![Next.js](https://img.shields.io/badge/Next.js-000000?style=flat&logo=next.js&logoColor=white) **Next.js 14** - React framework with App Router
- ![TypeScript](https://img.shields.io/badge/TypeScript-007ACC?style=flat&logo=typescript&logoColor=white) **TypeScript** - Type-safe development
- ![Tailwind CSS](https://img.shields.io/badge/Tailwind_CSS-38B2AC?style=flat&logo=tailwind-css&logoColor=white) **Tailwind CSS** - Utility-first styling
- ![Shadcn/ui](https://img.shields.io/badge/shadcn%2Fui-000000?style=flat&logo=shadcnui&logoColor=white) **shadcn/ui** - Modern component library

### **Backend**
- ![tRPC](https://img.shields.io/badge/tRPC-398CCB?style=flat&logo=trpc&logoColor=white) **tRPC** - End-to-end typesafe APIs
- ![NextAuth.js](https://img.shields.io/badge/NextAuth.js-000000?style=flat&logo=next.js&logoColor=white) **NextAuth.js** - Authentication solution
- ![Drizzle](https://img.shields.io/badge/Drizzle-C5F74F?style=flat&logo=drizzle&logoColor=black) **Drizzle ORM** - Type-safe database operations

### **Database & Infrastructure**
- ![PostgreSQL](https://img.shields.io/badge/PostgreSQL-316192?style=flat&logo=postgresql&logoColor=white) **PostgreSQL** - Primary database
- ![Supabase](https://img.shields.io/badge/Supabase-3ECF8E?style=flat&logo=supabase&logoColor=white) **Supabase** - Database hosting & real-time features
- ![Netlify](https://img.shields.io/badge/Netlify-00C7B7?style=flat&logo=netlify&logoColor=white) **Netlify** - Deployment & hosting

### **Payment & Analytics**
- ![Stripe](https://img.shields.io/badge/Stripe-008CDD?style=flat&logo=stripe&logoColor=white) **Stripe** - Payment processing
- **React Hook Form** - Form validation & management

---

## 📦 **Quick Start**

### **Prerequisites**
- Node.js 18+ 
- npm/yarn/pnpm
- PostgreSQL database (or Supabase account)

### **1. Clone Repository**
```bash
git clone https://github.com/Little-Town-Labs/homeschooltranscripttracker.git
cd homeschooltranscripttracker
```

### **2. Install Dependencies**
```bash
npm install
# or
yarn install
# or
pnpm install
```

### **3. Environment Setup**
Copy the example environment file and configure your variables:

```bash
cp .env.example .env
```

**Required Environment Variables:**
```env
# Database
DATABASE_URL="postgresql://username:password@localhost:5432/homeschooltracker"

# NextAuth.js
NEXTAUTH_SECRET="your-secret-here"
NEXTAUTH_URL="http://localhost:3000"

# OAuth Providers (optional)
GOOGLE_CLIENT_ID="your-google-client-id"
GOOGLE_CLIENT_SECRET="your-google-client-secret"

# Stripe (for payments)
STRIPE_SECRET_KEY="sk_test_..."
STRIPE_WEBHOOK_SECRET="whsec_..."
NEXT_PUBLIC_STRIPE_PUBLISHABLE_KEY="pk_test_..."

# Email (optional)
EMAIL_SERVER_HOST="smtp.example.com"
EMAIL_SERVER_PORT=587
EMAIL_SERVER_USER="username"
EMAIL_SERVER_PASSWORD="password"
EMAIL_FROM="noreply@yourdomain.com"
```

### **4. Database Setup**
```bash
# Run database migrations
npm run db:push

# (Optional) Seed with sample data
npm run db:seed
```

### **5. Start Development Server**
```bash
npm run dev
```

Visit [http://localhost:3000](http://localhost:3000) to see your application! 🎉

---

## 🏗️ **Project Structure**

```
src/
├── app/                    # Next.js App Router
│   ├── _components/        # Reusable React components
│   ├── api/               # API routes (tRPC, NextAuth, webhooks)
│   ├── (auth)/            # Authentication pages
│   └── (dashboard)/       # Protected dashboard pages
├── server/                # Backend logic
│   ├── api/               # tRPC routers
│   ├── auth/              # NextAuth configuration
│   └── db/                # Database schema & connection
└── trpc/                  # tRPC client configuration

drizzle/                   # Database migrations
scripts/                   # Utility scripts
docs/                      # Project documentation
```

---

## 🚀 **Deployment**

### **Deploy to Netlify (Recommended)**

1. **Fork this repository** to your GitHub account

2. **Connect to Netlify:**
   - Go to [Netlify](https://netlify.com)
   - Click "New site from Git"
   - Select your forked repository

3. **Configure Environment Variables** in Netlify dashboard

4. **Deploy!** - The `netlify.toml` is already configured for optimal performance

### **Alternative Deployments**
- **Vercel**: Full Next.js support with edge functions
- **Railway**: Simple database + app hosting
- **DigitalOcean App Platform**: Container-based deployment

> 📋 See detailed deployment guides in [`DEPLOYMENT_CHECKLIST.md`](./DEPLOYMENT_CHECKLIST.md)

---

## 📖 **Usage**

### **Getting Started**
1. **Sign Up/Login** - Create your family account
2. **Onboarding** - Complete the setup wizard
3. **Add Students** - Register your homeschooled children
4. **Create Courses** - Set up academic courses with grades and credits
5. **Track Progress** - Record grades, assignments, and test scores
6. **Generate Transcripts** - Create official academic records

### **Key Features**
- **Dashboard**: Overview of all students and recent activity
- **Student Profiles**: Individual academic records and progress
- **Course Management**: Comprehensive curriculum tracking
- **Grade Book**: Assignment and assessment recording
- **Transcript Generator**: Professional academic documentation
- **Billing**: Subscription management and payment history

---

## 🤝 **Contributing**

We welcome contributions from the homeschooling community! Here's how you can help:

### **Development Setup**
1. Fork the repository
2. Create a feature branch: `git checkout -b feature/amazing-feature`
3. Make your changes
4. Run tests: `npm run test`
5. Commit: `git commit -m 'Add amazing feature'`
6. Push: `git push origin feature/amazing-feature`
7. Open a Pull Request

### **Contribution Guidelines**
- **Code Style**: We use ESLint and Prettier
- **Testing**: Add tests for new features (104 tests currently passing)
- **Documentation**: Update docs for API changes
- **Type Safety**: Maintain TypeScript coverage

### **Testing Coverage**
✅ **Complete Test Suite** (93 tests passing):
- API Router Business Logic (54 tests)
- Academic Calculations (18 tests) 
- Multi-tenant Security (10 tests)
- Authentication Flow (11 tests)

Run tests: `npm run test` | Coverage: `npm run test:coverage`

### **Areas for Contribution**
- 🐛 Bug fixes and error handling
- ✨ New features and enhancements
- 📚 Documentation improvements
- 🎨 UI/UX design enhancements
- 🧪 Test coverage expansion

---

## 📄 **License**

This project is licensed under the MIT License - see the [LICENSE](LICENSE) file for details.

---

## 🏢 **About Little Town Labs**

**HomeschoolTracker** is developed by [Little Town Labs](https://github.com/Little-Town-Labs), a software development company focused on creating tools for education and family management.

### **Contact & Support**
- 📧 **Email**: support@littletownlabs.com
- 🐛 **Issues**: [GitHub Issues](https://github.com/Little-Town-Labs/homeschooltranscripttracker/issues)
- 💬 **Discussions**: [GitHub Discussions](https://github.com/Little-Town-Labs/homeschooltranscripttracker/discussions)

---

## 🙏 **Acknowledgments**

- **T3 Stack** - For the amazing development foundation
- **Vercel Team** - For Next.js and deployment platform
- **Supabase** - For the excellent database platform
- **Homeschooling Community** - For feedback and inspiration

---

## 📊 **Project Status**

![GitHub last commit](https://img.shields.io/github/last-commit/Little-Town-Labs/homeschooltranscripttracker)
![GitHub issues](https://img.shields.io/github/issues/Little-Town-Labs/homeschooltranscripttracker)
![GitHub pull requests](https://img.shields.io/github/issues-pr/Little-Town-Labs/homeschooltranscripttracker)

**Current Version**: 1.0.0  
**Status**: ✅ Production Ready  
**Last Updated**: December 2024

---

<div align="center">

**Made with ❤️ for homeschooling families**

[⭐ Star this project](https://github.com/Little-Town-Labs/homeschooltranscripttracker) if you find it helpful!

</div>
