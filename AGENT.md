# MCPLens Agent Guidelines

## Build Commands
- `npm run start` - Start the development server
- `npm run build` - Build all workspaces
- `npm run compile` - Build and package the app with electron-builder
- `npm run typecheck` - Type check all workspaces
- `npm run test` - Run all E2E tests
- `npx playwright test ./tests/e2e.spec.ts -g "test name"` - Run a single test

## Code Style Guidelines
- **Indentation**: 2 spaces (from .editorconfig)
- **Line Endings**: LF (Unix-style)
- **Types**: Strict typing is enforced (strict: true in tsconfig)
- **Imports**: Use ES modules (type: "module" in package.json)
- **Module Resolution**: Use NodeNext
- **File Organization**: Code is organized in workspaces under packages/
- **Error Handling**: Console errors in tests, explicit error checking in application code
- **TypeScript Target**: ESNext

## Project Structure
- Electron app based on Vite with main, preload, and renderer processes
- Testing uses Playwright
- Node.js v23+ required