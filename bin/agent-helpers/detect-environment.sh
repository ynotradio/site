#!/bin/bash
# Environment detection utility for agent scripts
# Source this file: source bin/agent-helpers/detect-environment.sh

# Detect if we're in CI/CD
detect_ci() {
  if [ -n "$CI" ] || [ -n "$BUILDKITE" ] || [ -n "$GITHUB_ACTIONS" ] || [ -n "$GITLAB_CI" ] || [ -n "$CIRCLECI" ]; then
    return 0  # true
  fi
  return 1  # false
}

# Return which CI provider is active (empty string if local)
detect_ci_provider() {
  if [ -n "$BUILDKITE" ]; then echo "buildkite"
  elif [ -n "$GITHUB_ACTIONS" ]; then echo "github-actions"
  elif [ -n "$GITLAB_CI" ]; then echo "gitlab"
  elif [ -n "$CIRCLECI" ]; then echo "circleci"
  elif [ -n "$CI" ]; then echo "unknown-ci"
  else echo ""
  fi
}

# Detect if we have network access to key services
detect_network() {
  if curl -s --max-time 5 https://registry.npmjs.org > /dev/null 2>&1; then
    return 0  # has network
  fi
  return 1  # no network
}

# Detect if ports are available
detect_port_available() {
  local port=$1
  if lsof -ti:$port > /dev/null 2>&1; then
    return 1  # port in use
  fi
  return 0  # port available
}

# Check if Docker is available and running
detect_docker() {
  if ! command -v docker > /dev/null 2>&1; then
    return 1  # docker not installed
  fi
  if ! docker info > /dev/null 2>&1; then
    return 1  # docker not running
  fi
  return 0  # docker available
}

# Get recommended timeout based on environment
get_timeout() {
  local operation=$1
  
  if detect_ci; then
    # CI environments: stricter timeouts
    case $operation in
      "container_start") echo 120 ;;
      "npm_install") echo 180 ;;
      "service_ready") echo 240 ;;
      *) echo 60 ;;
    esac
  else
    # Local development: more lenient
    case $operation in
      "container_start") echo 180 ;;
      "npm_install") echo 300 ;;
      "service_ready") echo 360 ;;
      *) echo 120 ;;
    esac
  fi
}

# Print environment summary
print_environment() {
  echo "🔍 Environment Detection:"
  
  local provider
  provider=$(detect_ci_provider)
  if [ -n "$provider" ]; then
    echo "   📍 Environment: CI/CD ($provider)"
  else
    echo "   📍 Environment: Local Development"
  fi
  
  if detect_network; then
    echo "   🌐 Network: Available"
  else
    echo "   ⚠️  Network: Restricted"
  fi
  
  if detect_docker; then
    echo "   🐳 Docker: Available"
  else
    echo "   ❌ Docker: Not available"
  fi
  
  echo ""
}

# Export functions for use in other scripts
export -f detect_ci
export -f detect_ci_provider
export -f detect_network
export -f detect_port_available
export -f detect_docker
export -f get_timeout
export -f print_environment
