# simple-slack-mcp-server

A simplified [MCP (Model Context Protocol)](https://www.anthropic.com/news/model-context-protocol) server for accessing Slack API. This server allows AI assistants to interact with essential Slack messaging and channel operations through a standardized interface.

## Transport Support

This server uses **stdio transport only** for direct integration with MCP clients like Claude Desktop.

## Features

Available tools focused on core messaging and channel operations:

- `slack_list_channels` - List public channels in the workspace with pagination
- `slack_post_message` - Post a new message to a Slack channel  
- `slack_reply_to_thread` - Reply to a specific message thread in Slack
- `slack_add_reaction` - Add a reaction emoji to a message
- `slack_get_channel_history` - Get recent messages from a channel
- `slack_get_thread_replies` - Get all replies in a message thread

## Quick Start

### Installation

```bash
npm install simple-slack-mcp-server
```

### Configuration

You need to set the following environment variable:

- `SLACK_BOT_TOKEN`: Slack Bot User OAuth Token

You can create a `.env` file to set this environment variable:

```
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

### Usage

#### Start the MCP server

```bash
npx simple-slack-mcp-server
```

You can also run the installed module with node:
```bash
node node_modules/.bin/slack-mcp-server
```

#### Client Configuration

**For Claude Desktop and other MCP clients**:

```json
{
  "slack": {
    "command": "npx",
    "args": [
      "simple-slack-mcp-server"
    ],
    "env": {
      "SLACK_BOT_TOKEN": "<your-bot-token>"
    }
  }
}
```

See [examples/README.md](examples/README.md) for detailed client examples.

## Required Slack Bot Permissions

Your Slack bot needs the following OAuth scopes:

- `channels:read` - To list channels
- `chat:write` - To post messages
- `chat:write.public` - To post in public channels  
- `reactions:write` - To add reactions

## Implementation Pattern

This server adopts the following implementation pattern:

1. Define request/response using Zod schemas
   - Request schema: Define input parameters
   - Response schema: Define responses limited to necessary fields

2. Implementation flow:
   - Validate request with Zod schema
   - Call Slack WebAPI
   - Parse response with Zod schema to limit to necessary fields
   - Return as JSON

For example, the `slack_list_channels` implementation parses the request with `ListChannelsRequestSchema`, calls `slackClient.conversations.list`, and returns the response parsed with `ListChannelsResponseSchema`.

## Development

### Available Scripts

- `npm run dev` - Start the server in development mode with hot reloading
- `npm run build` - Build the project for production  
- `npm run start` - Start the production server
- `npm run lint` - Run linting checks (ESLint and Prettier)
- `npm run fix` - Automatically fix linting issues
- `npm run examples` - Run the example client

### Contributing

1. Fork the repository
2. Create your feature branch
3. Run tests and linting: `npm run lint`
4. Commit your changes
5. Push to the branch
6. Create a Pull Request