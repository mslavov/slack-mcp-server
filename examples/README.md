# Examples

This directory contains example clients for the Slack MCP Server using stdio transport.

## Available Examples

### Stdio Client (`list_channels.ts`)
Demonstrates how to connect to the MCP server and list Slack channels using stdio transport.

## Setup

1. Set up your environment variables in `.env`:
```env
# For the server and examples
SLACK_BOT_TOKEN=xoxb-your-bot-token
```

## Usage

### Running the Example

```bash
# Run the stdio client example
npm run examples
```

## What the Example Does

The example:
1. Connects to the Slack MCP Server via stdio transport
2. Lists all available tools
3. Calls the `slack_list_channels` tool to retrieve workspace channels
4. Displays channel information including:
   - Channel name
   - Number of members
   - Channel purpose/description  
   - Channel ID
   - Pagination information if more channels are available

## Available Tools

The simplified server provides these core messaging and channel tools:
- `slack_list_channels` - List public channels in the workspace
- `slack_post_message` - Post a new message to a channel
- `slack_reply_to_thread` - Reply to a message thread
- `slack_add_reaction` - Add a reaction emoji to a message
- `slack_get_channel_history` - Get message history from a channel
- `slack_get_thread_replies` - Get all replies in a message thread

## Troubleshooting

### Common Issues

1. **Missing environment variables**: Ensure `SLACK_BOT_TOKEN` is set in your environment or `.env` file.

2. **Permission errors**: Ensure your Slack bot token has the necessary permissions:
   - `channels:read` - To list channels
   - `chat:write` - To post messages  
   - `chat:write.public` - To post in public channels
   - `reactions:write` - To add reactions

3. **Channel access**: The bot can only access public channels it has been added to.