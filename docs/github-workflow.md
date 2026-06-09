# GitHub Workflow

## Why We Use Git and GitHub

Git tracks changes locally. GitHub stores the remote repository, supports collaboration, code review, issue tracking, and CI/CD.

## Recommended Branch Strategy

- `main`: stable and production-ready
- `develop`: optional integration branch for teams
- `feature/<name>`: new features
- `fix/<name>`: bug fixes
- `chore/<name>`: tooling or maintenance work

If you are working solo, you can keep it simpler:

- `main`
- `feature/<name>`

## Standard Development Flow

1. create or pull the latest `main`
2. create a feature branch
3. make focused changes
4. commit with clear messages
5. push branch to GitHub
6. open a pull request
7. review and merge after checks pass

## Example Commands

```bash
git init
git checkout -b feature/project-blueprint
git add .
git commit -m "Add smart expense tracker project blueprint"
git remote add origin <repository-url>
git push -u origin feature/project-blueprint
```

## Commit Message Style

Use short, action-oriented commit messages:

- `Add transaction create API`
- `Build monthly dashboard cards`
- `Integrate OCR receipt parsing`
- `Fix budget percentage calculation`

## Pull Request Checklist

- code builds successfully
- tests pass
- change is scoped and understandable
- screenshots added for UI changes
- database changes documented
- secrets are not committed

## GitHub Features To Use

### Issues

Track features, bugs, and enhancements.

Example issue buckets:

- MVP features
- smart features
- bug fixes
- deployment tasks

### Projects

Use a GitHub Project board with columns such as:

- Backlog
- Ready
- In Progress
- Review
- Done

### Pull Requests

Use pull requests even when working alone. They create a clean review point and history of why changes were made.

### Actions

Set up CI for:

- frontend lint and build
- backend lint and tests
- migration checks

## Branch Protection Recommendations

Protect `main` with:

- required pull requests
- required status checks
- blocked force pushes
- blocked direct deletion

## Suggested First GitHub Milestones

- `M1`: Core setup and auth
- `M2`: Transactions and categories
- `M3`: Budgets and dashboard
- `M4`: Receipt OCR
- `M5`: AI insights
