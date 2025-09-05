# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

This is a simplified Model Context Protocol (MCP) server that provides AI assistants with standardized access to essential Slack APIs. It's written in TypeScript and uses only stdio transport for direct integration.

## Development Commands

### Building and Running
- `npm run build` - Compile TypeScript to JavaScript in `/dist`
- `npm run dev` - Start server in development mode with hot reloading
- `npm start` - Run the production build

### Code Quality
- `npm run lint` - Run both ESLint and Prettier checks
- `npm run fix` - Auto-fix all linting issues
- `npm run lint:eslint` - Run ESLint only
- `npm run lint:prettier` - Run Prettier only

### Examples
- `npm run examples` - Run stdio transport example

## Architecture

### Core Structure
The server follows a simplified schema-driven design pattern:

1. **Request/Response Schemas** (`src/schemas.ts`):
   - All Slack API interactions are validated with Zod schemas
   - Request schemas define input parameters
   - Response schemas filter API responses to only necessary fields

2. **Main Server** (`src/index.ts`):
   - Stdio-only transport for CLI integration
   - Tool registration and request handling
   - Single environment variable validation (bot token only)

### Transport Mode
- **Stdio only**: For CLI integration (Claude Desktop, etc.)

### Available Tools
All tools follow the pattern: validate request → call Slack API → parse response → return JSON

**Core messaging and channel tools (6 total):**
- `slack_list_channels` - List public channels with pagination
- `slack_post_message` - Post messages to channels
- `slack_reply_to_thread` - Reply to message threads
- `slack_add_reaction` - Add emoji reactions to messages
- `slack_get_channel_history` - Get message history from channels
- `slack_get_thread_replies` - Get all replies in threads

### Environment Requirements
Must set in environment or `.env` file:
- `SLACK_BOT_TOKEN`: Bot User OAuth Token (only token required)

### Required Bot Permissions
Your Slack bot needs these OAuth scopes:
- `channels:read` - To list channels
- `chat:write` - To post messages
- `chat:write.public` - To post in public channels
- `reactions:write` - To add reactions

## Key Implementation Notes

1. **No Test Suite**: Currently no tests implemented (`"test": "echo \"No tests yet\""`)

2. **Type Safety**: All Slack API responses are parsed through Zod schemas to ensure type safety and limit response size

3. **Error Handling**: The server validates bot token on startup and provides clear error messages

4. **Simplified Dependencies**: Removed HTTP server dependencies (express, @types/express)

5. **ES Modules**: Project uses `"type": "module"` - use ES import syntax

## Common Tasks

### Adding a New Slack Tool
1. Define request/response schemas in `src/schemas.ts`
2. Add tool registration in `src/index.ts` server setup
3. Implement handler following existing pattern: validate → API call → parse → return
4. Update README.md with new tool documentation

### Channel History vs Message Search
- **Use `slack_get_channel_history`** for:
  - Latest conversation flow without specific filters
  - ALL messages including bot/automation messages
  - Sequential browsing with pagination
  - Understanding recent channel activity

### Known API Limitations
1. **Bot Access**: Bot can only access public channels it has been added to
2. **Rate Limiting**: Standard Slack API rate limits apply
3. **Message History**: Limited to bot's join date for most channels
4. **Permissions**: All operations respect workspace and channel permissions

### Modifying Schemas
When updating schemas, ensure backward compatibility and update both request validation and response filtering to maintain efficiency.