# Unhook Deployment Quick Start

This guide provides the fastest way to get Unhook running in different environments.

## 🚀 Self-Hosted with Docker (5 minutes)

### Prerequisites
- Docker and Docker Compose installed
- [Clerk](https://clerk.com) account

### Steps

1. **Clone and configure**
   ```bash
   git clone https://github.com/yourusername/unhook.git
   cd unhook
   cp .env.example .env
   ```

2. **Edit `.env`** with your Clerk credentials:
   ```env
   CLERK_SECRET_KEY=sk_test_your_key
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_key
   CLERK_WEBHOOK_SECRET=whsec_your_secret
   ```

3. **Deploy**
   ```bash
   make deploy-local
   ```

4. **Access**
   - Web Dashboard: http://localhost:3000
   - Webhook Router: http://localhost:8080

## ☁️ Cloud Deployment with Kubernetes

### Prerequisites
- Kubernetes cluster
- kubectl configured
- Docker registry access

### Steps

1. **Build and push images**
   ```bash
   ./deploy/scripts/build-images.sh \
     --push \
     --registry your-registry.com/unhook \
     --tag latest
   ```

2. **Configure secrets**
   ```bash
   cp deploy/kubernetes/secret.yaml deploy/kubernetes/secret-prod.yaml
   # Edit secret-prod.yaml with your values
   ```

3. **Deploy**
   ```bash
   ./deploy/scripts/deploy-kubernetes.sh \
     --registry your-registry.com/unhook
   ```

## 🎯 One-Click Deployments

### Deploy to Heroku
[![Deploy to Heroku](https://www.herokucdn.com/deploy/button.svg)](https://heroku.com/deploy?template=https://github.com/yourusername/unhook)

### Deploy to Railway
[![Deploy on Railway](https://railway.app/button.svg)](https://railway.app/new/template?template=https://github.com/yourusername/unhook)

### Deploy to Render
[![Deploy to Render](https://render.com/images/deploy-to-render-button.svg)](https://render.com/deploy?repo=https://github.com/yourusername/unhook)

## 🔧 Environment Variables

### Required
- `CLERK_SECRET_KEY` - From Clerk dashboard
- `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` - From Clerk dashboard
- `CLERK_WEBHOOK_SECRET` - From Clerk webhook settings

### Generated (use `openssl rand -base64 32`)
- `NEXTAUTH_SECRET` - Session encryption
- `WEBHOOK_ENCRYPTION_KEY` - Webhook encryption

### Optional
- `POSTHOG_KEY` - Analytics (leave empty to disable)

## 📚 Next Steps

- [Full Deployment Guide](DEPLOYMENT.md) - Detailed instructions
- [SSL/TLS Setup](DEPLOYMENT.md#ssltls-setup) - Secure your deployment
- [Monitoring Guide](DEPLOYMENT.md#monitoring-and-maintenance) - Keep your instance healthy

## 🆘 Common Issues

### Database connection failed
```bash
# Check if PostgreSQL is running
docker-compose ps postgres

# View logs
docker-compose logs postgres
```

### Clerk authentication not working
- Verify API keys in `.env`
- Check callback URLs in Clerk dashboard match your domain

### Need help?
- [GitHub Issues](https://github.com/yourusername/unhook/issues)
- [Discord Community](https://discord.gg/unhook)