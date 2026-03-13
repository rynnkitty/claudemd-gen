/**
 * 기술 스택 감지를 위한 매핑 정보
 * TechStackAnalyzer가 이 상수를 참조해 패키지 매니저, 언어, 프레임워크 등을 감지한다.
 */

// ────────────────────────────────────────────────
// 패키지 매니저 감지
// ────────────────────────────────────────────────

/**
 * 파일명 → 패키지 매니저 이름
 * 잠금 파일을 우선 확인해 정확도를 높인다.
 */
export const PACKAGE_MANAGER_FILES: Record<string, string> = {
  // Node.js
  'pnpm-lock.yaml': 'pnpm',
  'yarn.lock': 'yarn',
  'package-lock.json': 'npm',
  'package.json': 'npm',       // 잠금 파일 없을 때 fallback
  // Python
  'poetry.lock': 'poetry',
  'pyproject.toml': 'poetry',  // poetry 또는 pip
  'requirements.txt': 'pip',
  'Pipfile': 'pipenv',
  // Rust
  'Cargo.toml': 'cargo',
  // Go
  'go.mod': 'go modules',
  // JVM
  'build.gradle': 'gradle',
  'build.gradle.kts': 'gradle',
  'pom.xml': 'maven',
  // Ruby
  'Gemfile': 'bundler',
  // PHP
  'composer.json': 'composer',
  // .NET
  '*.csproj': 'nuget',
  '*.fsproj': 'nuget',
};

// ────────────────────────────────────────────────
// 런타임 감지
// ────────────────────────────────────────────────

/**
 * 파일명/패턴 → 런타임 이름
 * 해당 파일이 존재하면 이 런타임을 사용한다고 판단한다.
 */
export const RUNTIME_INDICATOR_FILES: Record<string, string> = {
  'package.json': 'Node.js',
  '.nvmrc': 'Node.js',
  '.node-version': 'Node.js',
  'deno.json': 'Deno',
  'deno.jsonc': 'Deno',
  'bun.lockb': 'Bun',
  'pyproject.toml': 'Python',
  'requirements.txt': 'Python',
  'setup.py': 'Python',
  'Cargo.toml': 'Rust',
  'go.mod': 'Go',
  'pom.xml': 'Java (JVM)',
  'build.gradle': 'Java (JVM)',
  'build.gradle.kts': 'Kotlin (JVM)',
  'Gemfile': 'Ruby',
  'composer.json': 'PHP',
  '*.csproj': '.NET',
};

// ────────────────────────────────────────────────
// 언어 감지 (파일 확장자 기반)
// ────────────────────────────────────────────────

/**
 * 파일 확장자 → 언어 이름
 * 확장자 수가 많은 순으로 주요 언어를 결정한다.
 */
export const EXTENSION_TO_LANGUAGE: Record<string, string> = {
  '.ts': 'TypeScript',
  '.tsx': 'TypeScript',
  '.mts': 'TypeScript',
  '.cts': 'TypeScript',
  '.js': 'JavaScript',
  '.jsx': 'JavaScript',
  '.mjs': 'JavaScript',
  '.cjs': 'JavaScript',
  '.py': 'Python',
  '.rs': 'Rust',
  '.go': 'Go',
  '.java': 'Java',
  '.kt': 'Kotlin',
  '.kts': 'Kotlin',
  '.cs': 'C#',
  '.fs': 'F#',
  '.rb': 'Ruby',
  '.php': 'PHP',
  '.swift': 'Swift',
  '.cpp': 'C++',
  '.cc': 'C++',
  '.cxx': 'C++',
  '.c': 'C',
  '.h': 'C/C++',
  '.dart': 'Dart',
  '.scala': 'Scala',
  '.ex': 'Elixir',
  '.exs': 'Elixir',
  '.clj': 'Clojure',
  '.cljs': 'ClojureScript',
  '.vue': 'Vue',
  '.svelte': 'Svelte',
  '.astro': 'Astro',
  '.css': 'CSS',
  '.scss': 'SCSS',
  '.sass': 'SASS',
  '.less': 'LESS',
  '.html': 'HTML',
  '.sql': 'SQL',
  '.sh': 'Shell',
  '.bash': 'Shell',
  '.zsh': 'Shell',
  '.ps1': 'PowerShell',
  '.tf': 'Terraform',
  '.yaml': 'YAML',
  '.yml': 'YAML',
  '.json': 'JSON',
  '.toml': 'TOML',
};

// ────────────────────────────────────────────────
// 프레임워크 감지 (package.json dependencies 기반)
// ────────────────────────────────────────────────

/**
 * npm 패키지명 → 프레임워크/라이브러리 표시 이름
 */
export const NPM_PACKAGE_TO_FRAMEWORK: Record<string, string> = {
  // Frontend frameworks
  react: 'React',
  'react-dom': 'React',
  vue: 'Vue',
  '@angular/core': 'Angular',
  svelte: 'Svelte',
  'solid-js': 'SolidJS',
  preact: 'Preact',
  // Meta-frameworks
  next: 'Next.js',
  nuxt: 'Nuxt',
  '@sveltejs/kit': 'SvelteKit',
  remix: 'Remix',
  '@remix-run/react': 'Remix',
  gatsby: 'Gatsby',
  astro: 'Astro',
  // Backend frameworks
  express: 'Express',
  fastify: 'Fastify',
  koa: 'Koa',
  hapi: '@hapi/hapi',
  '@nestjs/core': 'NestJS',
  '@hono/node-server': 'Hono',
  hono: 'Hono',
  // Build tools
  vite: 'Vite',
  webpack: 'webpack',
  rollup: 'Rollup',
  parcel: 'Parcel',
  esbuild: 'esbuild',
  turbopack: 'Turbopack',
  // Test frameworks
  vitest: 'Vitest',
  jest: 'Jest',
  mocha: 'Mocha',
  jasmine: 'Jasmine',
  '@playwright/test': 'Playwright',
  cypress: 'Cypress',
  // State management
  zustand: 'Zustand',
  jotai: 'Jotai',
  recoil: 'Recoil',
  '@reduxjs/toolkit': 'Redux Toolkit',
  mobx: 'MobX',
  // Styling
  tailwindcss: 'Tailwind CSS',
  '@mui/material': 'MUI',
  '@chakra-ui/react': 'Chakra UI',
  '@radix-ui/react-icons': 'Radix UI',
  'styled-components': 'styled-components',
  '@emotion/react': 'Emotion',
  // ORM / DB
  prisma: 'Prisma',
  '@prisma/client': 'Prisma',
  typeorm: 'TypeORM',
  drizzle: 'Drizzle',
  mongoose: 'Mongoose',
  // Validation
  zod: 'Zod',
  yup: 'Yup',
  joi: 'Joi',
  // HTTP
  axios: 'axios',
  ky: 'ky',
  '@tanstack/react-query': 'TanStack Query',
  'react-query': 'TanStack Query',
  swr: 'SWR',
};

/**
 * Python 패키지명 → 프레임워크 표시 이름
 */
export const PYTHON_PACKAGE_TO_FRAMEWORK: Record<string, string> = {
  django: 'Django',
  flask: 'Flask',
  fastapi: 'FastAPI',
  starlette: 'Starlette',
  tornado: 'Tornado',
  aiohttp: 'aiohttp',
  sqlalchemy: 'SQLAlchemy',
  pydantic: 'Pydantic',
  pytest: 'pytest',
  celery: 'Celery',
};

/**
 * Go 모듈명 → 프레임워크 표시 이름
 */
export const GO_MODULE_TO_FRAMEWORK: Record<string, string> = {
  'github.com/gin-gonic/gin': 'Gin',
  'github.com/labstack/echo': 'Echo',
  'github.com/gofiber/fiber': 'Fiber',
  'github.com/go-chi/chi': 'Chi',
};

// ────────────────────────────────────────────────
// 아키텍처 패턴 감지 (디렉토리 이름 기반)
// ────────────────────────────────────────────────

/**
 * 디렉토리 이름 집합이 이 패턴의 레이어를 얼마나 포함하는지로 점수를 매긴다.
 */
export const ARCHITECTURE_LAYER_PATTERNS: Record<string, string[]> = {
  mvc: ['controllers', 'models', 'views'],
  'clean-architecture': ['entities', 'usecases', 'adapters', 'infrastructure'],
  layered: ['presentation', 'application', 'domain', 'infrastructure'],
  'feature-sliced': ['app', 'pages', 'widgets', 'features', 'entities', 'shared'],
  monorepo: ['packages', 'apps', 'libs', 'services'],
};

// ────────────────────────────────────────────────
// 설정 파일 목록
// ────────────────────────────────────────────────

/** 분석 대상 알려진 설정 파일 목록 */
export const KNOWN_CONFIG_FILES: string[] = [
  'tsconfig.json',
  'tsconfig.base.json',
  'jsconfig.json',
  '.eslintrc.cjs',
  '.eslintrc.js',
  '.eslintrc.json',
  '.eslintrc.yml',
  'eslint.config.js',
  'eslint.config.ts',
  '.prettierrc',
  '.prettierrc.json',
  '.prettierrc.js',
  'prettier.config.js',
  'vite.config.ts',
  'vite.config.js',
  'vitest.config.ts',
  'webpack.config.js',
  'webpack.config.ts',
  'rollup.config.js',
  'babel.config.js',
  '.babelrc',
  'jest.config.js',
  'jest.config.ts',
  'tailwind.config.ts',
  'tailwind.config.js',
  'postcss.config.js',
  'next.config.js',
  'next.config.ts',
  'nuxt.config.ts',
  'svelte.config.js',
  'astro.config.mjs',
  'pyproject.toml',
  'setup.cfg',
  '.flake8',
  'mypy.ini',
  '.mypy.ini',
  'Cargo.toml',
  'go.mod',
  'docker-compose.yml',
  'docker-compose.yaml',
  '.dockerignore',
  '.github/workflows',
];
