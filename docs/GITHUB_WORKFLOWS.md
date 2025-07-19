# GitHub Actions Workflows

This document describes the GitHub Actions workflows configured for the Procol ki Rasoi project.

## 🚀 Workflow Overview

### 1. CI/CD Pipeline (`.github/workflows/ci.yml`)
**Triggers**: Push to `main`/`develop`, Pull Requests to `main`

**Jobs**:
- **Build and Test**: Installs dependencies, runs linting, tests, and builds the application
- **Deploy to GitHub Pages**: Deploys to GitHub Pages on main branch
- **Deploy to Vercel**: Deploys to Vercel production environment

### 2. Development Workflow (`.github/workflows/development.yml`)
**Triggers**: Push to feature branches, Pull Requests to `main`/`develop`

**Jobs**:
- **Development Build**: Builds and tests feature branches
- **Preview Deployment**: Creates preview deployments for Pull Requests
- **PR Comments**: Automatically comments with preview URLs

### 3. Security & Quality Checks (`.github/workflows/security.yml`)
**Triggers**: Push to `main`/`develop`, Pull Requests, Weekly schedule

**Jobs**:
- **Security Scan**: Runs npm audit and Snyk security scans
- **Code Quality**: Runs ESLint and bundle size checks
- **Dependency Updates**: Weekly check for outdated dependencies

### 4. Release Management (`.github/workflows/release.yml`)
**Triggers**: Push of version tags (e.g., `v1.0.0`)

**Jobs**:
- **Release**: Creates GitHub releases with changelog
- **Asset Upload**: Uploads build artifacts
- **Production Deploy**: Deploys to production environment

## 🔧 Required Secrets

Set up the following secrets in your GitHub repository:

### For Vercel Deployment
- `VERCEL_TOKEN`: Your Vercel API token
- `VERCEL_ORG_ID`: Your Vercel organization ID
- `VERCEL_PROJECT_ID`: Your Vercel project ID

### For Security Scanning
- `SNYK_TOKEN`: Your Snyk API token (optional)

### For Notifications
- `SLACK_WEBHOOK_URL`: Slack webhook URL for notifications (optional)

## 📋 Branch Protection Rules

### Main Branch
- Requires status checks to pass
- Requires pull request reviews
- No force pushes allowed
- No deletions allowed

### Develop Branch
- Requires status checks to pass
- Requires pull request reviews
- Force pushes allowed (for hotfixes)

## 🎯 Environment URLs

- **Development**: `https://dev-procol-ki-rasoi.vercel.app`
- **Staging**: `https://staging-procol-ki-rasoi.vercel.app`
- **Production**: `https://procol-ki-rasoi.vercel.app`

## 📝 Issue Templates

### Bug Report Template
- Standardized bug reporting format
- Environment information collection
- Reproduction steps checklist

### Feature Request Template
- Feature description and use cases
- Acceptance criteria
- Technical considerations

## 🔄 Pull Request Template

Standardized PR template with:
- Change type classification
- Testing checklist
- Screenshot requirements
- Related issues linking

## 🚀 Getting Started

1. **Fork/Clone** the repository
2. **Set up secrets** in GitHub repository settings
3. **Create feature branch** from `develop`
4. **Make changes** and commit
5. **Create Pull Request** using the template
6. **Review and merge** after approval

## 📊 Workflow Status

Monitor workflow status in the GitHub Actions tab:
- Green: All checks passed
- Yellow: Some checks failed (non-blocking)
- Red: Critical checks failed (blocking)

## 🔧 Customization

### Adding New Workflows
1. Create new `.yml` file in `.github/workflows/`
2. Define triggers and jobs
3. Test locally with `act` (optional)

### Modifying Existing Workflows
1. Update the workflow file
2. Test changes in a feature branch
3. Monitor workflow execution
4. Merge after successful testing

## 📚 Resources

- [GitHub Actions Documentation](https://docs.github.com/en/actions)
- [Vercel GitHub Integration](https://vercel.com/docs/git/vercel-for-github)
- [Snyk GitHub Actions](https://docs.snyk.io/integrations/ci-cd-integrations/github-actions-integration) 