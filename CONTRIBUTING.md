# Contributing to DeepGis

Thanks for your interest in improving DeepGis. The full contributing guide,
including development setup, the repository layout, the quality gate, and the
pull request workflow, lives in the documentation:

**<https://github.com/gaojunke/DeepGis/contributing/>** (source: [`docs/contributing.md`](docs/contributing.md))

## Quick Start

Fork the repository, then clone your fork. Replace `YOUR_GITHUB_USERNAME` with
your GitHub username:

```bash
git clone https://github.com/YOUR_GITHUB_USERNAME/DeepGis.git
cd DeepGis
npm install
npm run dev          # web build at http://localhost:5173
```

Before opening a pull request:

```bash
pre-commit run --all-files
npm run ci
```

Branch off `main` (never commit to it directly), keep changes focused, follow
[Conventional Commits](https://www.conventionalcommits.org/) for messages, and
open your pull request against `main`. Found a bug or have an idea? Open an
[issue](https://github.com/gaojunke/DeepGis/issues).
