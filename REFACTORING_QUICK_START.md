# YatruSathi Refactoring - Quick Reference & Action Items

## 🚨 CRITICAL ISSUES (Address Immediately)

### Security Threats

1. **Exposed Secrets in `.env`** - Database credentials, Supabase keys, email passwords visible in git
   - ⚠️ ACTION: Rotate ALL credentials immediately
   - Remove `.env` from git history (git filter-branch)
   - Create `.env.example` with placeholders

2. **Hardcoded Django SECRET_KEY** - Can forge sessions, bypass CSRF
   - ⚠️ ACTION: Generate new SECRET_KEY, move to .env

3. **Debug Endpoints Active** - `/api/auth/debug/get-otp/` and `/api/auth/debug/skip-otp/` bypass authentication
   - ⚠️ ACTION: Remove debug_otp.py immediately

4. **DEBUG=True by Default** - Exposes stack traces, database queries
   - ⚠️ ACTION: Set DEBUG=False by default, use environment variable

5. **No Python Dependencies File** - No requirements.txt
   - ⚠️ ACTION: Create requirements.txt/requirements/ folder structure

---

## 🔴 HIGH PRIORITY (Week 1-2)

### Backend Architecture Issues

- **event/views.py** - 524 lines (should be max 300) - Split by domain
- **event/models.py** - 262 lines with 45+ fields - Separate into logical models
- **Mixed API Patterns** - Old views.py + new api/ folder structure - Standardize on ViewSets + Routers
- **No Service Layer** - Only auth_service.py, need booking/notification/chat/profile services
- **No Pagination** - List endpoints return all records

### Frontend Issues

- **profile-page.tsx** - 1,395 lines (MONOLITHIC) - Should be max 300 lines
- **event-details.tsx** - 946 lines - Needs to be split into sub-components
- **NO State Management** - All state in local component state, no context/store
- **NO Custom Hooks** - Logic embedded in components (useAuth, useEvents, etc. missing)
- **NO Services Layer** - API calls scattered throughout components
- **Large Components** - Dashboard (388), footer (362), notifications (367), add-event-form (492)

### Missing Infrastructure

- No Docker setup
- No CI/CD pipeline
- No test infrastructure
- No API documentation

---

## 📊 File Size Issues (Component Bloat)

### Frontend Components (exceeding 300 line limit)

| File               | Lines | Status                                |
| ------------------ | ----- | ------------------------------------- |
| profile-page.tsx   | 1,395 | 🔴 CRITICAL - Split needed            |
| event-details.tsx  | 946   | 🟠 HIGH - Split into 6-7 components   |
| kyc-approval.tsx   | 580   | 🟠 HIGH - Extract forms               |
| my-events.tsx      | 568   | 🟠 HIGH - Extract components          |
| add-event-form.tsx | 492   | 🟠 HIGH - Extract form fields         |
| chatbox.tsx        | 437   | 🟠 HIGH - Extract message list        |
| dashboard.tsx      | 388   | 🟠 MEDIUM - Extract sections          |
| notifications.tsx  | 367   | 🟠 MEDIUM - Extract notification item |
| footer.tsx         | 362   | 🟠 MEDIUM - Extract footer sections   |

### Backend Components (exceeding 300 line limit)

| File                 | Lines | Status                        |
| -------------------- | ----- | ----------------------------- |
| event/views.py       | 524   | 🔴 CRITICAL - Split by domain |
| event/models.py      | 262   | 🟠 HIGH - Model bloat         |
| event/serializers.py | 156   | 🟡 MEDIUM - Organize better   |

---

## 📋 Refactoring Roadmap (10-12 weeks)

### Phase 1: Security & Foundation (Week 1-2) - URGENT

- [ ] Rotate all credentials
- [ ] Remove secrets from git
- [ ] Create .env.example
- [ ] Remove debug endpoints
- [ ] Set DEBUG=False default
- [ ] Create requirements.txt
- **Effort:** High | **Impact:** Critical

### Phase 2: Backend Architecture (Week 3-4)

- [ ] Reorganize into apps structure
- [ ] Split models.py (event, profile, booking, chat, notification)
- [ ] Split views.py by domain
- [ ] Standardize on ViewSets + Routers
- [ ] Expand service layer (5+ services)
- [ ] Implement proper permissions
- [ ] Add pagination and filtering
- [ ] Add API versioning (/api/v1/)
- [ ] Add drf-spectacular for API docs
- **Effort:** Very High | **Impact:** High

### Phase 3: Frontend Architecture (Week 5-6)

- [ ] Extract 8-10 custom hooks
- [ ] Create services layer (5+ services)
- [ ] Implement Zustand store
- [ ] Split large components (profile, event-details, forms)
- [ ] Create shared component library (20+ components)
- [ ] Add constants files
- [ ] Add proper TypeScript types
- [ ] Add environment variables setup
- **Effort:** Very High | **Impact:** High

### Phase 4: DevOps & Infrastructure (Week 7-8)

- [ ] Create Dockerfile (backend & frontend)
- [ ] Create docker-compose.yml
- [ ] Set up GitHub Actions CI/CD
- [ ] Create requirements/ folder with base/dev/staging/prod
- [ ] Add code quality tools (Black, isort, ESLint, Prettier)
- [ ] Add pre-commit hooks
- [ ] Implement logging & monitoring
- **Effort:** High | **Impact:** High

### Phase 5: Testing & Documentation (Week 9-10)

- [ ] Backend tests (pytest, 70%+ coverage)
- [ ] Frontend tests (Vitest, 60%+ coverage)
- [ ] E2E tests setup
- [ ] Architecture documentation
- [ ] API documentation
- [ ] Setup guides
- [ ] Deployment guides
- **Effort:** High | **Impact:** Medium

---

## 🔧 Quick Wins (Can do immediately)

1. **Create `.env.example`** - 15 minutes
2. **Extract `useAuth()` hook** - 1 hour
3. **Create ErrorBoundary component** - 30 minutes
4. **Add constants files** - 1 hour
5. **Remove debug endpoints** - 30 minutes
6. **Add pre-commit hooks** - 1 hour
7. **Create GitHub issue templates** - 1 hour
8. **Add .gitignore improvements** - 30 minutes

**Total Quick Wins: ~6 hours** ✅

---

## 📁 Target Structure Overview

### Backend

```
config/settings/ (dev/staging/prod)
apps/
  ├── authentication/
  ├── events/
  ├── profiles/
  ├── bookings/
  ├── chat/
  ├── notifications/
  └── admin/
shared/ (permissions, utils, mixins)
tests/
requirements/ (base, dev, staging, prod)
```

### Frontend

```
common/
  ├── components/ (Button, Card, Modal, etc.)
  ├── hooks/ (useAuth, useApi, useNotifications, etc.)
  ├── utils/
  └── constants/
modules/
  ├── auth/
  ├── events/
  ├── bookings/
  ├── chat/
  ├── notifications/
  ├── profile/
  └── admin/
layout/
services/
types/
config/
```

---

## 🎯 Success Metrics

After refactoring:

- ✅ No component > 300 lines
- ✅ 100% environment variable usage (no hardcoded values)
- ✅ 70%+ backend test coverage
- ✅ 60%+ frontend test coverage
- ✅ API fully documented (Swagger/OpenAPI)
- ✅ Full Docker support
- ✅ CI/CD pipeline on GitHub Actions
- ✅ Zero security vulnerabilities
- ✅ Proper logging and monitoring
- ✅ Team can onboard in < 30 minutes

---

## 📚 Resources Created

1. **AUDIT_REPORT.md** - Comprehensive 10-part audit (in this directory)
2. **REFACTORING_ROADMAP.md** - Detailed implementation guide (recommend creating)
3. **Architecture decisions** - Document in docs/ folder

---

## 💡 Recommendations

1. **Start with Phase 1 immediately** - Security is critical
2. **Run Phases 2 & 3 in parallel** if you have a large team
3. **Use feature branches** for each phase
4. **Set up CI/CD early** (Phase 4) to catch issues
5. **Document decisions** as you go
6. **Get team alignment** on architecture before coding

---

## 📞 Next Meeting Agenda

- [ ] Review audit findings with team
- [ ] Prioritize Phase 1 tasks
- [ ] Assign ownership for critical issues
- [ ] Schedule weekly sync-ups
- [ ] Create GitHub project board
- [ ] Identify blockers and dependencies

---

**Generated:** August 30, 2026  
**Status:** Ready for implementation  
**Estimated Effort:** 10-12 weeks (with full team)
