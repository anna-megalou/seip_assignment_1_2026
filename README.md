# Software Engineering in Practice — Assignment 1 (2026)
## Advanced DevOps: Production-Grade CI/CD, External Configuration, and Orchestration

| Metadata | Details |
| :--- | :--- |
| **Estimated Time to Complete** | 15 hours |
| **Deadline for Submission** | 3rd June |
| **Total Points** | 100 Points |

---

## 🎯 Objective

In this assignment, you will build a complete, automated deployment pipeline for a cloud-native web application. You will containerize the application, automate the delivery via GitHub Actions to the GitHub Container Registry (GHCR), and orchestrate it inside a local Kubernetes (Minikube) cluster. 

This assignment bridges the gap between writing code and shipping it by replicating the industry-standard automation, security, and scalability patterns used in enterprise cloud deployments. In large-scale professional projects, mastering automated CI/CD pipelines and declarative orchestration is what prevents configuration drift, isolates sensitive credentials, and ensures continuous, zero-downtime delivery to production infrastructure.

To align with **12-Factor App** principles, you will completely decouple the application's configuration and sensitive data using Kubernetes **ConfigMaps** and **Secrets**.

---

## 🛠️ Prerequisites

Before you begin, ensure you have the following tools installed and configured on your local machine:
* **Git** & a verified **GitHub Account**
* **Docker Desktop** / Docker Engine (https://docs.docker.com/desktop/setup/install/windows-install/)
* **Minikube** & **kubectl** (https://minikube.sigs.k8s.io/docs/start/?arch=%2Fwindows%2Fx86-64%2Fstable%2F.exe+download, https://kubernetes.io/docs/tasks/tools/install-kubectl-windows/)

> 📋 **Note:** You are provided with a Node.js Express application that dynamically alters its behavior based on environment variables. **Do not modify this source code.** Your job is to build the infrastructure that safely injects these variables at runtime.

---

## 📝 Assignment Tasks

### Task 1: Containerization (15 Points) based on material taught in the lab `Introduction to Docker`
1. **Repository Setup:** Fork this GitHub repository
2. **Write the Container Blueprint:** Write a production-optimized `Dockerfile` at the root of your repository.
    * **Base Image:** Use a lightweight base image (e.g., `node:18-alpine`).
    * **Caching Optimization:** Leverage Docker layer caching correctly by copying dependency files (`package.json`) and executing `npm install` *before* copying the remaining source code.
    * **Port Documentation:** Document the intended container port by using the `EXPOSE` instruction for port `3000`.

### Task 2: Automated CI/CD via GitHub Actions (25 Points) based on material taught in the lab `Working-with-Git-and-Github`
Create a workflow that automates the build and publishing pipeline.
1. Create a workflow file at `.github/workflows/ci-cd.yaml`.
2. Configure it to trigger **only** on a `push` to the `main` branch.
3. The workflow pipeline must successfully execute the following steps:
    * Check out the repository code.
    * Authenticate securely against the **GitHub Container Registry (GHCR)** using the built-in `${{ secrets.GITHUB_TOKEN }}`.
    * Build and tag the image as `ghcr.io/<your-github-username>/echo-api:latest`.
    * Push the final image to GHCR.

### Task 3: Cloud-Native Architecture & Orchestration (40 Points) based on material taught in the lab `DevOps`
You will now construct the declarative infrastructure manifests required to deploy your application to Minikube. 

Create a directory named `k8s/` in your repository. All manifests must be written such that they can be applied successfully using a single command: `kubectl apply -f k8s/`.

#### 1. External Configuration (`configmap.yaml`)
Create a Kubernetes ConfigMap that defines the non-sensitive configuration parameters.
* Set `WELCOME_MESSAGE` to a custom greeting of your choice (e.g., `"Welcome to the Software Engineering in Practice Assignment Cluster!"`).
* Set `NODE_ENV` to `"production"`.

#### 2. Secret Management (`secret.yaml`)
Create a Kubernetes Secret component to store sensitive credentials securely.
* Define a key named `API_SECRET_KEY`.
* > ⚠️ **Crucial:** The value inside the YAML file must be manually **Base64 encoded**. Ensure you handle hidden newline elements (`\n`) during terminal encoding so the raw string matches perfectly upon container injection.

#### 3. Workload Definition (`deployment.yaml`)
Create a Deployment manifest that orchestrates your application using the image pulled from GHCR.
* **Scale:** Set `replicas` to exactly `3`.
* **Resource Management:** Enforce strict resource constraints. 
    * *Requests:* `100m CPU / 128Mi RAM`
    * *Limits:* `250m CPU / 256Mi RAM`
* **Environment Injection:** Map the variables from your ConfigMap and Secret into the container's environment definitions so `server.js` can read them at boot.
* **Self-Healing:** Implement a `livenessProbe` and a `readinessProbe` targeted at the `/health` endpoint on port `3000`.

#### 4. Service Networking (`service.yaml`)
Expose your deployment internally within the cluster control plane.
* Define a Service of type `ClusterIP`.
* Map incoming cluster traffic on port `80` to target the container's internal port `3000`.

### Task 4: Validation & Technical Documentation (20 Points) based on material taught in the lab `DevOps`
1. **Documentation:** Author a comprehensive `README.md` at the root of your repository detailing how to clone, spin up Minikube, apply the manifests sequentially, and interact with the endpoints.
2. **Port Forwarding:** Use `kubectl port-forward` to map the internal `ClusterIP` service interface to your local machine network loopback.
3. **AI Usage & Future Engineering Report:** Include a dedicated section in your final report addressing your engineering process, AI interaction, and architectural future outlook. You must explicitly answer:
    * **AI Integration:** How did you utilize Generative AI tools (e.g., ChatGPT, Claude, GitHub Copilot) to assist you during this assignment? 
    * **Utility Analysis:** What aspects of the AI assistance did you find most useful (e.g., syntax debugging, understanding Kubernetes manifest structures, explaining Base64 mechanics)?
    * **Friction Points:** Where did the AI tools fail, provide hallucinated/outdated configurations, or leave you stuck? How did you manually troubleshoot past these dead-ends (e.g., local network routing issues, Minikube VM context errors)?
    * **Future Architectural Outlook:** If you had an extra week, or were tasked with scaling this pipeline for a real-world enterprise system in the future, what steps would you take next? *(Think about production upgrades like replacing port-forwarding with an Ingress Controller, establishing a true GitOps workflow with ArgoCD, adding Prometheus monitoring, or securing image scanning inside the CI pipeline).*

---

## 📥 Deliverables & Submission Guidelines

Submit a single aggregated **PDF document** containing the following evidence to the university portal:

1.  **GitHub Repository Link:** Must be public and contain all application code, the GitHub Action workflow file, and the complete `k8s/` directory.
2.  **CI/CD Proof:** A screenshot of your GitHub Actions dashboard showing a successful build and push pipeline completion.
3.  **Cluster State Proof:** A terminal screenshot showing the clean output of:
    * `kubectl get all -n default` *(Must show 3 healthy running pods, the deployment status, and the ClusterIP service)*
    * `kubectl get configmap,secret`
4.  **Application Verification Proof:** Screenshots of your browser engine or `curl` terminal responses showing successful data fetching from:
    * `http://localhost:<port>/` *(Showing your custom ConfigMap greeting)*
    * `http://localhost:<port>/secure-config` *(Showing status "Authorized" and the masked string suffix of your secret)*
5. **AI Reflection & Future Outlook:** Your written responses to the questions outlined in **Task 4.3**.

---

## Contact Details

If anything in the assignment is unclear or you are stuck and need help moving forward please email me at gtheodorou@aueb.gr
