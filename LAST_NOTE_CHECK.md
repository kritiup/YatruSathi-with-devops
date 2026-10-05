# YatruSathi — DevOps Presentation Notes

Simple notes for explaining the DevOps work in this project.
Each section has: **what it is → what we used → where it is → what to say.**

---

## The project in one line

> "YatruSathi is a **3-tier** travel platform. React frontend, Django REST API,
> PostgreSQL database — each in its own Docker container, deployed to Kubernetes
> with a fully automated pipeline."

**The 3 tiers:**

| Tier | Name | What it does | Technology |
| --- | --- | --- | --- |
| 1 | Presentation | What the user sees | React + TypeScript (nginx) |
| 2 | Application | Business logic, APIs | Django REST Framework |
| 3 | Data | Stores everything | PostgreSQL 16 |

Plus an **AI chatbot** (Flask + Socket.IO) as a helper service.

**Important point to mention:** the project used to run on SQLite (a single file).
We moved it to PostgreSQL because SQLite cannot be shared by multiple servers.
In Kubernetes we run many copies of the backend, and they all need **one shared
database**. Now the backend refuses to start without PostgreSQL — no silent fallback.

---

## 1. LINTING

### What it is
A linter reads your code **without running it** and reports mistakes: unused
imports, undefined variables, bad formatting.

> Say it like: *"Linting is an automatic code reviewer. It checks every line on
> every push, before the code even runs."*

### What we used

| Service | Tool | Checks |
| --- | --- | --- |
| Frontend | **ESLint** | React/TypeScript code quality |
| Frontend | **tsc** | TypeScript type errors |
| Backend | **flake8** | Python style + bugs |
| Chatbot | **flake8** | Syntax errors, undefined names |
| Dockerfiles | **hadolint** | Bad Docker practices |

Also configured: **black** and **isort** (Python auto-formatters), **Prettier**
(JS auto-formatter).

### Where it is
- Rules: `setup.cfg`, `pyproject.toml`, `eslint.config.js`, `.prettierrc`
- Runs automatically in `.github/workflows/ci.yml`

### Real example to give
Our seeding script had an unused import and a reference to a model that had been
**renamed** (`Event` → `Activity`). Linting flags this class of problem early.

### If asked "linter vs formatter?"
- **Linter** = *reports* problems (flake8, ESLint)
- **Formatter** = *fixes* formatting automatically (black, Prettier)

---

## 2. TESTING

### What it is
Tests **run** the code and check the output is correct.

> Say it like: *"Linting checks how the code looks. Testing checks what the code
> does."*

### What we have

| Service | Tool | Tests | Coverage |
| --- | --- | --- | --- |
| Backend | **pytest** | **77** | Strong |
| Frontend | **Vitest** | **18** | Basic |
| Chatbot | — | 0 | Only an import check |

**Backend test files** (in `-yatrubackend-/event/tests/`):

| File | What it tests |
| --- | --- |
| `test_api_smoke.py` | Main API endpoints + permissions |
| `test_password_reset.py` | Forgot-password flow, email lookup |
| `test_auth.py` | Signup, login, logout, OTP |
| `test_catalog.py` | Destinations, packages, bookings |
| `test_admin_kyc.py` | Admin KYC approval |
| `test_admin_login.py` | Admin JWT login |

Tests run against a **real PostgreSQL database**, not a fake one — so they catch
real database problems.

### Strong point to mention
We found a bug where **login** was checking password rules meant for signup.
Typing a wrong password showed *"Password must contain an uppercase letter"*
instead of *"wrong password"*. Linting could never catch this — the code was
valid Python doing the wrong thing. **Only a test catches that.**

We also verified the new tests are real: we put the old code back and **the tests
failed**. A test that never fails is useless.

---

## 3. CI / CD

### What it is
- **CI (Continuous Integration)** = every code push is automatically built,
  linted and tested.
- **CD (Continuous Deployment)** = code that passes is automatically packaged
  and deployed.

> Say it like: *"Nobody manually tests or deploys. Push the code, and the
> pipeline does everything."*

### Tool
**GitHub Actions** — files in `.github/workflows/`

### The pipeline

```
Developer pushes code
│
├── CI (runs on EVERY push and pull request, in parallel)
│   ├── Frontend   install → ESLint → type check → tests → build
│   ├── Backend    start Postgres → checks → flake8 → pytest
│   ├── Chatbot    lint → import test
│   ├── gitleaks   fails if a password/key is committed
│   ├── hadolint   Dockerfile check
│   └── Trivy      scans dependencies + Docker images for vulnerabilities
│
└── CD (ONLY for the main branch)
    ├── Push images to AWS ECR   (tagged with the commit ID)
    ├── Deploy to STAGING        (automatic)
    └── Deploy to PRODUCTION     (manual button press)
```

### Key points
- **Pull request** → only CI runs. Nothing deploys.
- **Push to main** → deploys to staging automatically.
- **Production** → needs a human to click "Run workflow". This is a safety gate.
- **No AWS passwords stored in GitHub.** We use **OIDC**: GitHub proves its
  identity to AWS and gets a temporary token that expires. This is the modern,
  secure way.
- **Dependabot** automatically opens pull requests to update old packages.

---

## 4. KUBERNETES (K8s)

### What it is
Kubernetes runs and manages containers for you: restarts them when they crash,
adds more when traffic rises, and replaces them with zero downtime.

> Say it like: *"Docker runs one container. Kubernetes manages hundreds of them
> automatically."*

### Where it is: `k8s/`

We use **Kustomize** — one shared base, then small changes per environment.

```
k8s/
├── base/                    shared by all environments
│   ├── backend.yaml         Deployment + Service + autoscaler
│   ├── frontend.yaml        Deployment + Service + autoscaler
│   ├── chatbot.yaml         Deployment + Service
│   ├── ingress.yaml         load balancer, routes by URL
│   ├── configmap.yaml       normal settings
│   └── externalsecret.yaml  pulls secrets from AWS
└── overlays/
    ├── staging/             1 copy of each, cheaper
    └── production/          2+ copies, autoscaling on
```

### Features to mention

| Feature | What it does |
| --- | --- |
| **Health probes** | K8s checks if a pod is alive; restarts it if not |
| **HPA (autoscaler)** | Backend grows 2 → 6 pods when CPU is high |
| **Resource limits** | Each pod has a CPU/memory cap, so one cannot eat the server |
| **Init container** | Runs database migrations *before* the app starts |
| **Ingress** | One load balancer sends `/api` to backend, `/` to frontend |

### Infrastructure as Code
`infra/terraform/` builds the **entire AWS setup in code**: VPC (network), EKS
(Kubernetes cluster), RDS (PostgreSQL), ECR (image storage), IAM roles.

> Say it like: *"We never click buttons in the AWS console. The whole
> infrastructure is written as code, so it can be rebuilt identically."*

---

## 5. SECURITY

### Layers we built

| Layer | What we did |
| --- | --- |
| **Secrets** | No passwords in code. Stored in **AWS Secrets Manager**, delivered to pods by **External Secrets Operator** |
| **CI login** | **OIDC** — no permanent AWS keys in GitHub |
| **Secret scanning** | **gitleaks** fails the build if a key is committed |
| **Dependency scanning** | **Trivy** + **Dependabot** find vulnerable packages |
| **Code scanning** | **CodeQL** finds security bugs in Python and JS |
| **Image scanning** | **Trivy** scans Docker images; a fixable HIGH/CRITICAL fails the build |
| **Container** | Backend runs as a **non-root user** |
| **Database** | Encrypted, in a **private subnet**, firewall allows only the cluster |
| **Django** | DEBUG off, HSTS, secure cookies, CORS allow-list |
| **Passwords** | Complexity rules enforced at signup and password reset |

### Good example to give
Password reset previously **never checked the new password**, so a user could
reset to a weak password like `abc` — weaker than signup allowed. We fixed it so
the rule applies wherever a password is *chosen*, but **not at login** (login
should only say "wrong password").

---

## 6. MONITORING

### What it is
Knowing what is happening inside the system while it runs.

> Say it like: *"Testing checks the code before release. Monitoring watches it
> after release."*

### What we set up

| Tool | What it watches |
| --- | --- |
| **Sentry** | Application errors in all 3 services, with full stack traces |
| **CloudWatch Container Insights** | Cluster CPU, memory, pod logs |
| **metrics-server** | Pod resource usage (the autoscaler needs this) |
| **Health probes** | Whether each pod is alive and ready |
| **Request logging** | Django logs every API request with its response time |

### The 3 pillars (good line for a viva)
1. **Logs** — what happened (CloudWatch, Django logging)
2. **Metrics** — how much / how fast (Container Insights, metrics-server)
3. **Traces / errors** — what broke and where (Sentry)

---

## HONEST STATUS — if they ask "is it live?"

Be honest. It shows maturity, and examiners respect it.

| Part | Status |
| --- | --- |
| Linting | ✅ Working, runs on every push |
| Testing | ✅ 77 backend + 18 frontend tests passing |
| CI | ✅ Working |
| CD pipeline | ✅ Written and complete |
| Docker Compose (local) | ✅ Full stack runs locally |
| Kubernetes manifests | ✅ Written, validated, run on minikube |
| Deployed on real AWS EKS | ❌ **Not yet** |
| Monitoring alerts | ❌ Not yet |
| HTTPS | ❌ Not yet (needs a domain) |

**Why EKS is not live — good answer:**

> "The AWS account we were given is a shared training account without EKS
> permissions. The Terraform code is complete and validated, but `terraform apply`
> cannot create the cluster in that account. Everything else runs locally through
> Docker Compose and minikube."

This is an **account permission limit, not a code problem.** Say it confidently.

---

## LIKELY QUESTIONS

**Q: Why Docker?**
> It packages the app with everything it needs, so it runs the same on my laptop,
> in CI, and on the server. It removes "it works on my machine".

**Q: Why Kubernetes and not just Docker?**
> Docker runs containers. Kubernetes manages them — restarts crashes, scales up
> on load, and deploys with zero downtime.

**Q: Why did you move from SQLite to PostgreSQL?**
> SQLite is one file on one machine. In Kubernetes we run multiple backend pods,
> and they all need one shared database. PostgreSQL also handles many
> simultaneous writes, which SQLite does not.

**Q: How do you keep secrets safe?**
> Nothing is in the code. Secrets live in AWS Secrets Manager, and External
> Secrets Operator injects them into pods at runtime. GitHub uses OIDC, so there
> are no permanent AWS keys anywhere.

**Q: What happens if a deployment breaks?**
> Every image is tagged with its commit ID, so we can roll back to any previous
> version. Health probes also stop Kubernetes sending traffic to unhealthy pods.

**Q: Difference between staging and production?**
> Same code, separate namespace, separate secrets, separate database name.
> Staging deploys automatically; production needs manual approval.

**Q: What would you improve next?**
> Three things: CloudWatch alarms so we are told when something breaks, HTTPS with
> a real domain, and tests for the chatbot service.

---

## QUICK NUMBERS TO REMEMBER

- **3** tiers (frontend / backend / database) + 1 AI service
- **77** backend tests, **18** frontend tests
- **4** containers running locally (frontend, backend, chatbot, postgres) —
  we build 3 of them, postgres is the official image
- **5** security scanners (gitleaks, Trivy, CodeQL, hadolint, Dependabot)
- **2** environments (staging, production)
- Backend autoscales **2 → 6** pods

---

## DEMO COMMANDS (if you need to show something live)

```bash
# Start the whole stack
docker compose up -d

# Show all containers running
docker compose ps

# Run the backend tests
cd -yatrubackend- && pytest

# Run linting
flake8 backend event

# Show the Kubernetes setup is valid
kustomize build k8s/overlays/production
```

Open in the browser:
- Frontend → http://localhost:8080
- API → http://localhost:8000/api/

---

**Good luck! 🎯**
