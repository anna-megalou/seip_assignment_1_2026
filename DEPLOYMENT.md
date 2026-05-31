# Deployment Guide - echo-api

Operational documentation for deploying the **echo-api** Express application via Docker, GitHub Actions, and Kubernetes (Minikube). This document covers clone, setup, deploy, validation, and troubleshooting.

---

## Prerequisites

Install the following on your local machine before deploying:

| Tool | Purpose | macOS install |
| :--- | :--- | :--- |
| **Git** | Clone and fork the repository | [git-scm.com](https://git-scm.com/download/mac) or `xcode-select --install` |
| **Docker Desktop** | Build and run the container locally | [Docker Desktop for Mac](https://docs.docker.com/desktop/setup/install/mac-install/) |
| **Minikube** | Local Kubernetes cluster | [Minikube start guide](https://minikube.sigs.k8s.io/docs/start/?arch=%2Fmacos%2Farm64%2Fstable%2Fbinary+download) |
| **kubectl** | Kubernetes CLI | [Install kubectl on macOS](https://kubernetes.io/docs/tasks/tools/install-kubectl-macos/) |

You also need a **GitHub account** with access to the forked repository and permission to view GitHub Actions runs and container packages.

---

## Clone & Fork

1. Fork the upstream repository if you have not already.
2. Clone your fork:

```bash
git clone https://github.com/anna-megalou/seip_assignment_1_2026.git
cd seip_assignment_1_2026
```

Repository: [https://github.com/anna-megalou/seip_assignment_1_2026](https://github.com/anna-megalou/seip_assignment_1_2026)

---

## CI/CD Pipeline

Pushing to the `main` branch triggers the GitHub Actions workflow at [`.github/workflows/ci-cd.yaml`](.github/workflows/ci-cd.yaml).

The pipeline:

1. Checks out the repository
2. Authenticates to GitHub Container Registry (GHCR) using `${{ secrets.GITHUB_TOKEN }}`
3. Builds the Docker image from the root `Dockerfile`
4. Pushes `ghcr.io/anna-megalou/echo-api:latest`

**Verify the pipeline:** open the [Actions tab](https://github.com/anna-megalou/seip_assignment_1_2026/actions) and confirm the latest run on `main` completed successfully.

**Make the image pullable from Minikube:** go to your GitHub profile -> **Packages** -> select `echo-api` -> **Package settings** -> set visibility to **Public**. Without this, pods may fail with `ImagePullBackOff` unless you configure `imagePullSecrets`.

---

## Local Docker Smoke Test (Optional)

Before relying on CI/CD, you can validate the container locally:

```bash
docker build -t echo-api:local .
docker run -p 3000:3000 \
  -e WELCOME_MESSAGE="Test greeting" \
  -e NODE_ENV=production \
  -e API_SECRET_KEY=my-secret-key-1234 \
  echo-api:local
```

In another terminal:

```bash
curl http://localhost:3000/
curl http://localhost:3000/secure-config
curl http://localhost:3000/health
```

Stop the container with `Ctrl+C`.

---

## Minikube Setup

Start a local Kubernetes cluster:

```bash
minikube start
```

Optional but useful for resource visibility:

```bash
minikube addons enable metrics-server
```

If you are testing locally built images instead of pulling from GHCR, point Docker at Minikube's daemon:

```bash
eval $(minikube docker-env)
```

For this assignment, the deployment pulls `ghcr.io/anna-megalou/echo-api:latest` from GHCR, so the `docker-env` step is not required unless you change the image reference.

---

## Deploy to Kubernetes

Apply all manifests in a single command:

```bash
kubectl apply -f k8s/
```

Wait for the rollout to finish:

```bash
kubectl rollout status deployment/echo-api
```

Inspect cluster state:

```bash
kubectl get all
kubectl get configmap,secret
```

**Expected resources:**

| Resource | Name | Notes |
| :--- | :--- | :--- |
| ConfigMap | `echo-api-config` | `WELCOME_MESSAGE`, `NODE_ENV` |
| Secret | `echo-api-secret` | `API_SECRET_KEY` (base64-encoded) |
| Deployment | `echo-api` | 3 replicas, probes on `/health:3000` |
| Service | `echo-api` | ClusterIP, port 80 → targetPort 3000 |

---

## Port-Forward & Test

The service is type `ClusterIP` and is not reachable from your host without port forwarding:

```bash
kubectl port-forward svc/echo-api 8080:80
```

Keep this terminal open. In another terminal (or a browser):

```bash
curl http://localhost:8080/
curl http://localhost:8080/secure-config
curl http://localhost:8080/health
```

Or open `http://localhost:8080/` and `http://localhost:8080/secure-config` in a browser.

---

## Expected Responses

### `GET /`

Returns the ConfigMap greeting and environment:

```json
{
  "message": "Welcome to the Software Engineering in Practice Assignment Cluster!",
  "environment": "production"
}
```

### `GET /secure-config`

Confirms the Secret was injected (suffix masked, not the full key):

```json
{
  "status": "Authorized",
  "injected_secret_suffix": "************************2026"
}
```

The masked suffix should end in `2026` (last four characters of `super-secret-production-key-2026`). If you see a 500 error about the production secret not being injected, see [Troubleshooting](#troubleshooting).

### `GET /health`

```json
{
  "status": "Healthy"
}
```

HTTP status: **200 OK**

---

## Troubleshooting

| Symptom | Likely cause | Fix |
| :--- | :--- | :--- |
| `ImagePullBackOff` | GHCR package is private or image name is wrong | Set the package to **Public** on GitHub, or add `imagePullSecrets`. Confirm the image is `ghcr.io/anna-megalou/echo-api:latest`. |
| `CrashLoopBackOff` | App fails at startup | Run `kubectl logs deployment/echo-api` and check env injection. |
| `/secure-config` returns 500 - *"Production secret key was not injected!"* | Base64 encoding included a trailing newline | Re-encode with `echo -n 'your-secret' \| base64` and update `k8s/secret.yaml`. Verify: `echo 'c3Vw...' \| base64 -d \| xxd` - no `0a` byte at the end. |
| Pods not Ready | Probe failures | Probes must target port **3000** (container port), not service port 80. Check `kubectl describe pod -l app=echo-api`. |
| Service has no endpoints | Label mismatch | Ensure `service.spec.selector` matches pod labels (`app: echo-api`). |
| CI/CD push fails | Missing workflow permissions | Confirm `permissions.packages: write` is set in the workflow. |
| Port-forward connection refused | Forward not running or wrong port | Run `kubectl port-forward svc/echo-api 8080:80` and use port **8080** on localhost. |

Useful diagnostic commands:

```bash
kubectl get pods -l app=echo-api
kubectl describe deployment echo-api
kubectl logs -l app=echo-api --tail=50
kubectl get endpoints echo-api
```

---

## Validation Runbook (Submission Screenshots)

Capture clean terminal and browser output for the assignment PDF:

```bash
kubectl get all -n default
kubectl get configmap,secret
kubectl port-forward svc/echo-api 8080:80
```

Then screenshot:

- `kubectl get all -n default` - 3 Running pods, deployment ready, ClusterIP service
- `kubectl get configmap,secret` - `echo-api-config` and `echo-api-secret`
- `curl` or browser at `http://localhost:8080/` - custom greeting
- `curl` or browser at `http://localhost:8080/secure-config` - `"Authorized"` with masked suffix

---

## AI Usage & Future Engineering Report

### AI Integration

I used **ChatGPT** as my generative AI assistant during this assignment. I did not rely on it for every step - I worked through the Dockerfile, GitHub Actions workflow, and Kubernetes manifests myself first - but when I got **stuck**, I turned to ChatGPT for help. Typical situations included unclear YAML syntax (for example `configMapKeyRef` and `secretKeyRef`), understanding why a Secret needed base64 encoding without a trailing newline, and interpreting errors such as `ImagePullBackOff` or the `/secure-config` 500 response.

ChatGPT helped me draft starting points for manifests and explained concepts I was unsure about, but I always checked its answers against the assignment README, `server.js`, and my own test runs (`docker run`, `kubectl apply`, `curl`) before committing anything.


### Future Architectural Outlook

Given another week, I would focus on simpler production upgrades first:

1. **Ingress instead of port-forward** - expose the app with a proper URL inside the cluster instead of running `kubectl port-forward` manually.
2. **Image scanning in CI** - add a step in GitHub Actions (e.g. with Trivy) to check the Docker image for known vulnerabilities before pushing to GHCR.
3. **Horizontal Pod Autoscaler (HPA)** - scale the number of pods automatically when CPU usage goes up, instead of keeping a fixed count of 3.
4. **Staging environment** - use a separate namespace with its own ConfigMap and Secret, and deploy tagged image versions rather than always using `:latest`.

These changes would make the setup easier to access, safer to deploy, and closer to how a real team would run the application.
