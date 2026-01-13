# Code Quality Guide

This guide covers code quality standards for both the legacy PHP codebase and the modern TypeScript/React/Next.js application.

## TypeScript/React/Next.js Standards

### Overview

The Y-Not Radio site is built with:

- **React 19** with TypeScript
- **Next.js 15** (App Router)
- **Payload CMS** for content management
- **Vitest** for testing
- **Storybook** for component documentation

### Coding Standards

Follow the [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript) and [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react). Key patterns:

#### Component Structure

```typescript
// ✅ Good: Arrow function component with TypeScript interface
interface ArtistCardProps {
  artist: {
    name: string;
    genre?: string;
  };
  onSelect?: () => void;
}

export const ArtistCard: React.FC<ArtistCardProps> = ({ artist, onSelect }) => {
  return (
    <div className="artist-card" onClick={onSelect}>
      <h3>{artist.name}</h3>
      {artist.genre && <p>{artist.genre}</p>}
    </div>
  );
};

// ❌ Bad: Function declaration, PropTypes, no TypeScript
export function ArtistCard({ artist, onSelect }) {
  return <div onClick={onSelect}>{artist.name}</div>;
}
```

#### Next.js 15 Patterns

**Server Components (default)**:

```typescript
// app/artists/page.tsx - Server Component
export default async function ArtistsPage() {
  const artists = await fetchArtists(); // Server-side data fetching
  return <ArtistList artists={artists} />;
}
```

**Client Components (when needed)**:

```typescript
// components/SearchInput.tsx - Client Component
'use client';

export const SearchInput: React.FC = () => {
  const [query, setQuery] = useState('');
  return <input value={query} onChange={(e) => setQuery(e.target.value)} />;
};
```

#### File Naming Conventions

- **Components**: `PascalCase.tsx` (e.g., `ArtistCard.tsx`)
- **Hooks**: `useHookName.ts` (e.g., `useArtistSearch.ts`)
- **Utilities**: `kebab-case.ts` (e.g., `format-date.ts`)
- **Test files**: Match component name exactly (e.g., `ArtistCard.test.tsx`)
- **Story files**: Match component name exactly (e.g., `ArtistCard.stories.tsx`)

### Testing Strategy

#### Unit Tests

Test individual components and functions in isolation:

```typescript
// ArtistCard.test.tsx
import { describe, it, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { ArtistCard } from './ArtistCard';

describe('ArtistCard', () => {
  it('renders artist name', () => {
    const artist = { name: 'Miles Davis', genre: 'Jazz' };
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
  });

  it('displays genre when provided', () => {
    const artist = { name: 'Miles Davis', genre: 'Jazz' };
    render(<ArtistCard artist={artist} />);
    expect(screen.getByText('Jazz')).toBeInTheDocument();
  });

  it('handles click events', async () => {
    const handleSelect = vi.fn();
    render(<ArtistCard artist={artist} onSelect={handleSelect} />);

    await userEvent.click(screen.getByRole('button'));
    expect(handleSelect).toHaveBeenCalledOnce();
  });
});
```

#### Integration Tests

Test components working together:

```typescript
// ArtistList.test.tsx
describe('ArtistList', () => {
  it('renders multiple artist cards', () => {
    const artists = [
      { name: 'Miles Davis', genre: 'Jazz' },
      { name: 'John Coltrane', genre: 'Jazz' },
    ];

    render(<ArtistList artists={artists} />);

    expect(screen.getByText('Miles Davis')).toBeInTheDocument();
    expect(screen.getByText('John Coltrane')).toBeInTheDocument();
  });
});
```

#### Test Coverage Requirements

From `vitest.config.ts`:

- **Statements**: 80%
- **Branches**: 80%
- **Functions**: 80%
- **Lines**: 80%

Run coverage report:

```bash
yarn test:coverage
```

### Accessibility Requirements

Follow WCAG AA standards:

#### Semantic HTML

```typescript
// ✅ Good: Semantic elements
<button onClick={handleClick} aria-label="Close dialog">
  <CloseIcon />
</button>

<nav aria-label="Main navigation">
  <ul>
    <li><a href="/artists">Artists</a></li>
  </ul>
</nav>

// ❌ Bad: Non-semantic elements
<div onClick={handleClick}>Close</div>
<div className="nav">
  <div className="link">Artists</div>
</div>
```

#### Keyboard Navigation

```typescript
// ✅ Good: Keyboard accessible
<div
  role="button"
  tabIndex={0}
  onKeyDown={(e) => {
    if (e.key === 'Enter' || e.key === ' ') {
      handleAction();
    }
  }}
  onClick={handleAction}
>
  Click me
</div>

// ❌ Bad: No keyboard support
<div onClick={handleAction}>Click me</div>
```

#### ARIA Labels

```typescript
// ✅ Good: Clear labels
<button aria-label="Search for artists">
  <SearchIcon />
</button>

<input
  type="text"
  aria-label="Artist name"
  placeholder="Enter artist name"
/>

// ❌ Bad: No labels for screen readers
<button><SearchIcon /></button>
<input type="text" placeholder="Search" />
```

#### Color Contrast

- Text must have at least 4.5:1 contrast ratio
- Large text (18pt+) needs 3:1 contrast
- Use tools like [WebAIM Contrast Checker](https://webaim.org/resources/contrastchecker/)

### Performance Best Practices

#### Code Splitting

```typescript
// ✅ Good: Dynamic import for heavy components
import dynamic from 'next/dynamic';

const HeavyChart = dynamic(() => import('@/components/HeavyChart'), {
  loading: () => <p>Loading chart...</p>,
  ssr: false, // Disable SSR if using browser-only APIs
});
```

#### Image Optimization

```typescript
// ✅ Good: Next.js Image component
import Image from 'next/image';

<Image
  src="/artist-photo.jpg"
  alt="Artist name"
  width={800}
  height={600}
  quality={80}
  priority={false} // Lazy load by default
/>

// ❌ Bad: Standard img tag
<img src="/artist-photo.jpg" alt="Artist" />
```

#### Memoization

```typescript
// ✅ Good: Memoize expensive computations
const sortedArtists = useMemo(
  () => artists.sort((a, b) => a.name.localeCompare(b.name)),
  [artists],
);

// ✅ Good: Memoize callbacks
const handleClick = useCallback(() => {
  console.log('Clicked');
}, []);
```

### Security Best Practices

#### Input Sanitization

```typescript
// ✅ Good: Sanitize HTML input
import DOMPurify from 'dompurify';

const cleanHTML = DOMPurify.sanitize(userInput, {
  ALLOWED_TAGS: ['p', 'br', 'strong', 'em', 'a'],
  ALLOWED_ATTR: ['href'],
});

<div dangerouslySetInnerHTML={{ __html: cleanHTML }} />

// ❌ Bad: Unsanitized user input
<div dangerouslySetInnerHTML={{ __html: userInput }} />
```

#### Environment Variables

```typescript
// ✅ Good: Use environment variables
const apiKey = process.env.API_KEY;
if (!apiKey) {
  throw new Error('API_KEY is required');
}

// ❌ Bad: Hardcoded secrets
const apiKey = 'sk-1234567890abcdef';
```

### Storybook Documentation

All user-facing components require Storybook stories:

```typescript
// ArtistCard.stories.tsx
import type { Meta, StoryObj } from '@storybook/react';
import { ArtistCard } from './ArtistCard';

const meta: Meta<typeof ArtistCard> = {
  title: 'Components/ArtistCard',
  component: ArtistCard,
  tags: ['autodocs'],
};

export default meta;
type Story = StoryObj<typeof ArtistCard>;

export const Default: Story = {
  args: {
    artist: {
      name: 'Miles Davis',
      genre: 'Jazz',
    },
  },
};

export const WithoutGenre: Story = {
  args: {
    artist: {
      name: 'Miles Davis',
    },
  },
};

export const LongName: Story = {
  args: {
    artist: {
      name: 'Thelonious Sphere Monk',
      genre: 'Jazz',
    },
  },
};
```

Run Storybook:

```bash
yarn storybook  # Start dev server on port 6006
yarn build-storybook  # Build static version
```

### Linting and Formatting

#### ESLint

Configuration in `.eslintrc.json` enforces:

- Airbnb JavaScript/TypeScript style
- React best practices
- React Hooks rules
- JSX accessibility (jsx-a11y)

Run linting:

```bash
yarn lint       # Check for issues
yarn lint:fix   # Auto-fix issues
```

#### Prettier

Automatic code formatting on save and pre-commit:

- Single quotes
- Semicolons required
- 2-space indentation
- 100 character line width

#### Pre-commit Hooks

Husky + lint-staged run automatically on `git commit`:

1. ESLint fixes issues on staged files
2. Prettier formats code
3. Test/story file validation (planned)

To bypass in emergencies:

```bash
git commit --no-verify -m "Emergency fix"
```

### Additional Resources

- [Code Quality Standards Skill](./.claude/skills/code-quality-standards/SKILL.md)
- [Test-Story Coupling Skill](./.claude/skills/test-story-coupling/SKILL.md)
- [Dependency Best Practices Skill](./.claude/skills/dependency-best-practices/SKILL.md)
- [Airbnb JavaScript Style Guide](https://github.com/airbnb/javascript)
- [Airbnb React Style Guide](https://github.com/airbnb/javascript/tree/master/react)
- [Next.js Documentation](https://nextjs.org/docs)
- [React 19 Documentation](https://react.dev)

---

## PHP Code Quality (Legacy)

### PHP Code Linting

We use PHP_CodeSniffer with custom rules to maintain code quality and consistency across the codebase.

### Running the Linter

From the project root, run:

```bash
./bin/lint.sh
```

This will check all PHP files in the `/src` directory for issues.

### Options

- `--fix` - Automatically fix issues when possible
- `--dir=PATH` - Specify a subdirectory to scan (default: ./src)
- `--no-summary` - Skip the summary report

Example:

```bash
./bin/lint.sh --fix --dir=./src/cp
```

### Custom Sniffs

#### BrokenRequireSniff

We've implemented a custom sniff to detect broken require/include statements. This is especially important after the reorganization of files into the `/cp` directory.

The sniff will check if the included file exists by trying various possible paths:

- Absolute path (as written)
- Relative to the current file
- Relative to the /src directory
- With "../" prefix removed (for CP directory files)
- Relative to the project root

When a broken require is detected, the error message will show all paths that were checked:

```
Include/require file "non_existent_file.php" not found. Checked paths:
non_existent_file.php, /workspaces/site/src/non_existent_file.php,
/workspaces/site/non_existent_file.php
```

The linter also provides warnings for CP directory files that might need path adjustments after reorganization:

```
Path "/partials/header.php" might need adjustment after CP directory reorganization. Consider using: "../partials/header.php"
```

## Best Practices

### File Organization

- Control panel files should be kept in the `/cp` directory
- Common functions should be in the `/functions` directory
- Templates and partials should be in the `/partials` directory

### Path References

When including files in PHP:

1. **In the root directory:**

   ```php
   require_once 'partials/_header.php';
   require_once 'functions/main_fns.php';
   ```

2. **In the `/cp` directory:**

   ```php
   require_once '../partials/_header.php';
   require_once '../functions/main_fns.php';
   ```

3. **Using the base path variable:**
   ```php
   $base_path = (strpos($page_file, 'cp/') !== false || dirname($_SERVER['PHP_SELF']) == '/cp') ? "../" : "";
   require_once $base_path . 'partials/_header.php';
   ```

### File References in HTML/CSS/JS

Always use dynamic path construction:

```php
<link href="<?php echo $base_path; ?>style/base.css" rel="stylesheet">
<script src="<?php echo $base_path; ?>js/common_functions.js"></script>
<img src="<?php echo $base_path; ?>images/logo.png" alt="Logo">
```

### PHP String Constants

Always use quotes for array keys:

```php
// Good
$username = $_POST['username'];
$remember = isset($_POST['remember_me']) ? $_POST['remember_me'] : 0;

// Bad - will generate warnings
$username = $_POST[username];
$remember = $_POST[remember_me];
```

## Continuous Integration

The linter can be integrated into CI/CD pipelines:

```yaml
# Example GitHub Action
name: PHP Linting
on: [push, pull_request]
jobs:
  phpcs:
    runs-on: ubuntu-latest
    steps:
      - uses: actions/checkout@v2
      - name: Setup PHP
        uses: shivammathur/setup-php@v2
        with:
          php-version: '7.4'
      - name: Install dependencies
        run: composer install
      - name: Run PHP_CodeSniffer
        run: ./bin/lint.sh
```

### Git Pre-Commit Hook

To enforce code quality locally before commits, you can set up a pre-commit hook:

```bash
# Create .git/hooks/pre-commit
cat > .git/hooks/pre-commit << 'EOF'
#!/bin/bash

# Run PHP linter on staged PHP files
echo "Running PHP linter on staged files..."
./bin/lint.sh
if [ $? -ne 0 ]; then
  echo "Linting errors found. Please fix them before committing."
  exit 1
fi

exit 0
EOF

# Make the hook executable
chmod +x .git/hooks/pre-commit
```

## Common Issues

### Broken Require/Include Statements

The most common issue after our directory reorganization is incorrect paths in require/include statements. Use the linter to detect these automatically:

```bash
./bin/lint.sh --dir=./src/cp
```

Fix by updating paths to use `../` for files moved to the `/cp` directory.
