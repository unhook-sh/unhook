# Unhook Deployment Guide

This guide provides detailed instructions for deploying Unhook in both self-hosted and cloud environments.

## Table of Contents

- [Overview](#overview)
- [Prerequisites](#prerequisites)
- [Self-Hosted Deployment](#self-hosted-deployment)
  - [Using Docker Compose](#using-docker-compose)
  - [Manual Docker Setup](#manual-docker-setup)
- [Cloud Deployment](#cloud-deployment)
  - [Kubernetes Deployment](#kubernetes-deployment)
  - [Managed Cloud Services](#managed-cloud-services)
- [Configuration](#configuration)
- [SSL/TLS Setup](#ssltls-setup)
- [Monitoring and Maintenance](#monitoring-and-maintenance)
- [Troubleshooting](#troubleshooting)

## Overview

Unhook can be deployed in two primary modes:

1. **Self-Hosted**: Deploy on your own infrastructure using Docker Compose
2. **Cloud**: Deploy on Kubernetes clusters or managed cloud platforms

Both deployment modes use the same core components:
- Web Application (Next.js)
- Webhook Router Service
- PostgreSQL Database
- Redis Cache
- Nginx Reverse Proxy (optional)

## Prerequisites

### For Self-Hosted Deployment
- Docker Engine v20.10+
- Docker Compose v2.0+
- 2GB RAM minimum (4GB recommended)
- 10GB disk space
- Domain name (for production)
- SSL certificates (for production)

### For Cloud Deployment
- Kubernetes cluster (v1.21+)
- kubectl configured
- Container registry access
- Ingress controller installed
- cert-manager (for automatic SSL)

### Required External Services
- [Clerk](https://clerk.com) account for authentication
- PostHog account (optional, for analytics)

## Self-Hosted Deployment

### Using Docker Compose

1. **Clone the repository**
   ```bash
   git clone https://github.com/yourusername/unhook.git
   cd unhook
   ```

2. **Configure environment**
   ```bash
   cp .env.example .env
   ```

3. **Edit `.env` file**
   Update the following required values:
   ```env
   # Security - Generate with: openssl rand -base64 32
   NEXTAUTH_SECRET=your_generated_secret
   WEBHOOK_ENCRYPTION_KEY=your_generated_key
   
   # Clerk Authentication
   CLERK_SECRET_KEY=sk_test_your_clerk_secret
   NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY=pk_test_your_clerk_key
   CLERK_WEBHOOK_SECRET=whsec_your_webhook_secret
   
   # URLs
   WEBHOOK_BASE_URL=https://your-domain.com
   NEXT_PUBLIC_API_URL=https://your-domain.com
   ```

4. **Deploy using the script**
   ```bash
   # Development deployment
   ./deploy/scripts/deploy-docker.sh --build
   
   # Production deployment with nginx
   ./deploy/scripts/deploy-docker.sh --build --production
   ```

5. **Verify deployment**
   - Web app: http://localhost:3000
   - Webhook router: http://localhost:8080

### Manual Docker Setup

If you prefer manual control:

```bash
# Build images
docker-compose build

# Start services (development)
docker-compose up -d

# Start services (production with nginx)
docker-compose --profile production up -d

# View logs
docker-compose logs -f

# Stop services
docker-compose down
```

## Cloud Deployment

### Kubernetes Deployment

1. **Prepare images**
   ```bash
   # Build and push images to your registry
   docker build -f Dockerfile.web -t your-registry/unhook/web:latest .
   docker build -f Dockerfile.router -t your-registry/unhook/router:latest .
   
   docker push your-registry/unhook/web:latest
   docker push your-registry/unhook/router:latest
   ```

2. **Configure Kubernetes resources**
   ```bash
   # Update secrets
   cp deploy/kubernetes/secret.yaml deploy/kubernetes/secret-prod.yaml
   # Edit deploy/kubernetes/secret-prod.yaml with your values
   
   # Update ingress domain
   sed -i 's/your-domain.com/actual-domain.com/g' deploy/kubernetes/ingress.yaml
   ```

3. **Deploy to Kubernetes**
   ```bash
   ./deploy/scripts/deploy-kubernetes.sh \
     --registry your-registry \
     --image-tag latest
   ```

4. **Manual Kubernetes deployment**
   ```bash
   # Create namespace
   kubectl apply -f deploy/kubernetes/namespace.yaml
   
   # Apply configurations
   kubectl apply -f deploy/kubernetes/configmap.yaml
   kubectl apply -f deploy/kubernetes/secret-prod.yaml
   
   # Deploy services
   kubectl apply -f deploy/kubernetes/
   ```

### Managed Cloud Services

#### AWS ECS/Fargate

1. **Push images to ECR**
   ```bash
   aws ecr get-login-password | docker login --username AWS --password-stdin $ECR_URL
   docker tag unhook/web:latest $ECR_URL/unhook/web:latest
   docker push $ECR_URL/unhook/web:latest
   ```

2. **Create task definitions** using the provided Dockerfiles
3. **Set up RDS PostgreSQL** and **ElastiCache Redis**
4. **Configure Application Load Balancer** for routing

#### Google Cloud Run

1. **Build and push to GCR**
   ```bash
   gcloud builds submit --tag gcr.io/PROJECT_ID/unhook-web
   ```

2. **Deploy services**
   ```bash
   gcloud run deploy unhook-web \
     --image gcr.io/PROJECT_ID/unhook-web \
     --platform managed \
     --allow-unauthenticated
   ```

#### Azure Container Instances

Similar process using Azure Container Registry and Azure Database for PostgreSQL.

## Configuration

### Environment Variables

#### Required Variables

| Variable | Description | Example |
|----------|-------------|---------|
| `POSTGRES_URL` | PostgreSQL connection string | `postgresql://user:pass@host:5432/db` |
| `REDIS_URL` | Redis connection string | `redis://:password@host:6379` |
| `CLERK_SECRET_KEY` | Clerk secret key | `sk_test_...` |
| `NEXT_PUBLIC_CLERK_PUBLISHABLE_KEY` | Clerk publishable key | `pk_test_...` |
| `CLERK_WEBHOOK_SECRET` | Clerk webhook secret | `whsec_...` |
| `NEXTAUTH_SECRET` | NextAuth secret | Generated 32-byte string |
| `WEBHOOK_ENCRYPTION_KEY` | Webhook encryption key | Generated 32-byte string |
| `NEXT_PUBLIC_API_URL` | API URL for self-hosted | `https://your-domain.com` |
| `NEXT_PUBLIC_WEBHOOK_BASE_URL` | Webhook base URL | `https://your-domain.com` |
| `NEXT_PUBLIC_IS_SELF_HOSTED` | Mark as self-hosted | `true` |

#### Optional Variables

| Variable | Description | Default |
|----------|-------------|---------|
| `POSTHOG_KEY` | PostHog API key | Empty (disabled) |
| `LOG_LEVEL` | Logging level | `info` |
| `NODE_ENV` | Environment | `production` |

### Configuring CLI and VS Code Extension

After deploying your self-hosted instance, you need to configure your development tools to connect to it:

1. **Create Configuration File**: In your project root, create an `unhook.yaml` file:
   ```yaml
   webhookId: 'wh_your_webhook_id'
   server:
     apiUrl: 'https://your-domain.com'
   destination:
     - name: 'local'
       url: 'http://localhost:3000/api/webhooks'
   delivery:
     - destination: 'local'
   ```

2. **CLI**: The CLI will automatically use this configuration when you run it.

3. **VS Code Extension**: The extension will detect the configuration file in your workspace.

For detailed configuration instructions, see the [Self-Hosted Configuration Guide](SELF_HOSTED_CONFIG.md).

### Database Setup

The application will automatically run migrations on startup. For manual setup:

```bash
# Docker Compose
docker-compose exec web bun run db:migrate

# Kubernetes
kubectl exec -n unhook deployment/unhook-web -- bun run db:migrate
```

## SSL/TLS Setup

### Self-Hosted with Let's Encrypt

1. **Install certbot**
   ```bash
   sudo apt-get update
   sudo apt-get install certbot
   ```

2. **Generate certificates**
   ```bash
   sudo certbot certonly --standalone -d your-domain.com
   ```

3. **Update nginx configuration**
   ```nginx
   ssl_certificate /etc/letsencrypt/live/your-domain.com/fullchain.pem;
   ssl_certificate_key /etc/letsencrypt/live/your-domain.com/privkey.pem;
   ```

### Kubernetes with cert-manager

1. **Install cert-manager**
   ```bash
   kubectl apply -f https://github.com/cert-manager/cert-manager/releases/download/v1.12.0/cert-manager.yaml
   ```

2. **Create ClusterIssuer**
   ```yaml
   apiVersion: cert-manager.io/v1
   kind: ClusterIssuer
   metadata:
     name: letsencrypt-prod
   spec:
     acme:
       server: https://acme-v02.api.letsencrypt.org/directory
       email: your-email@example.com
       privateKeySecretRef:
         name: letsencrypt-prod
       solvers:
       - http01:
           ingress:
             class: nginx
   ```

3. **Update Ingress annotation**
   ```yaml
   annotations:
     cert-manager.io/cluster-issuer: "letsencrypt-prod"
   ```

## Monitoring and Maintenance

### Health Checks

- Web app health: `https://your-domain.com/api/health`
- Router health: `https://your-domain.com/health`

### Logs

#### Docker Compose
```bash
# All services
docker-compose logs -f

# Specific service
docker-compose logs -f web
```

#### Kubernetes
```bash
# All pods in namespace
kubectl logs -n unhook -f --selector app=unhook

# Specific deployment
kubectl logs -n unhook deployment/unhook-web -f
```

### Backup

#### Database Backup
```bash
# Docker Compose
docker-compose exec postgres pg_dump -U unhook unhook > backup.sql

# Kubernetes
kubectl exec -n unhook deployment/unhook-postgres -- pg_dump -U unhook unhook > backup.sql
```

#### Database Restore
```bash
# Docker Compose
docker-compose exec -T postgres psql -U unhook unhook < backup.sql

# Kubernetes
kubectl exec -i -n unhook deployment/unhook-postgres -- psql -U unhook unhook < backup.sql
```

## Troubleshooting

### Common Issues

#### Service won't start
- Check logs: `docker-compose logs [service]`
- Verify environment variables are set correctly
- Ensure required services (postgres, redis) are running

#### Database connection errors
- Verify `POSTGRES_URL` is correct
- Check if database is accepting connections
- Ensure database exists and migrations have run

#### Authentication issues
- Verify Clerk keys are correct
- Check Clerk webhook secret matches
- Ensure callback URLs are configured in Clerk dashboard

#### Webhook routing issues
- Verify encryption key matches between services
- Check router service is accessible
- Ensure correct webhook URL format

### Debug Mode

Enable debug logging:
```bash
# Docker Compose
LOG_LEVEL=debug docker-compose up

# Kubernetes
kubectl set env deployment/unhook-web LOG_LEVEL=debug -n unhook
```

### Support

For issues and questions:
- GitHub Issues: [github.com/yourusername/unhook/issues](https://github.com/yourusername/unhook/issues)
- Documentation: [unhook.sh/docs](https://unhook.sh/docs)
- Community Discord: [discord.gg/unhook](https://discord.gg/unhook)