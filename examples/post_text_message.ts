#!/usr/bin/env node

import { Client } from '@modelcontextprotocol/sdk/client/index.js';
import { StdioClientTransport } from '@modelcontextprotocol/sdk/client/stdio.js';
import { config } from 'dotenv';
import { CallToolResultSchema } from '@modelcontextprotocol/sdk/types.js';
import { fileURLToPath } from 'node:url';
import { dirname, resolve } from 'node:path';
import type { CallToolResult } from '@modelcontextprotocol/sdk/types.js';

// Get the directory of the current file
const __filename = fileURLToPath(import.meta.url);
const __dirname = dirname(__filename);

// Load environment variables from .env file
config();

// Get command line arguments
const args = process.argv.slice(2);
const channelId = args[0];
const threadTs = args[1]; // Optional

if (!channelId) {
  console.error('Usage: npm run examples:text <channel_id> [thread_ts]');
  console.error('Example: npm run examples:text C1234567890');
  console.error('Example: npm run examples:text C1234567890 1234567890.123456');
  process.exit(1);
}

// Get and validate necessary environment variables
const slackToken = process.env.SLACK_BOT_TOKEN;

if (!slackToken) {
  throw new Error('SLACK_BOT_TOKEN environment variable is required');
}

// After validation, can be safely treated as a string
const env = {
  SLACK_BOT_TOKEN: slackToken,
} as const satisfies Record<string, string>;

async function main() {
  console.log('🚀 Slack Text Message Posting Example');
  console.log('=====================================\n');

  // Initialize MCP client
  const client = new Client(
    {
      name: 'slack-text-example',
      version: '1.0.0',
    },
    {
      capabilities: {},
    }
  );

  // Create transport for connecting to the server
  const transport = new StdioClientTransport({
    command: process.execPath,
    args: [
      '--import',
      resolve(__dirname, '../ts-node-loader.js'),
      resolve(__dirname, '../src/index.ts'),
    ],
    env,
  });

  try {
    // Connect to the server
    await client.connect(transport);
    console.log('✅ Connected to Slack MCP server\n');

    // Example 1: Basic text message
    console.log('📝 Example 1: Basic text message');
    console.log('----------------------------------');
    const basicMessage = (await client.callTool(
      {
        name: 'slack_post_message',
        arguments: {
          channel_id: channelId,
          text: 'Hello from the Slack MCP server! This is a basic text message.',
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(basicMessage.content) &&
      basicMessage.content[0]?.type === 'text'
    ) {
      console.log('Response:', basicMessage.content[0].text);
    }
    console.log();

    // Example 2: Text message with markdown formatting
    console.log('📝 Example 2: Text with markdown formatting');
    console.log('--------------------------------------------');
    const markdownMessage = (await client.callTool(
      {
        name: 'slack_post_message',
        arguments: {
          channel_id: channelId,
          text: `*Bold text* and _italic text_
\`\`\`
Code block with syntax highlighting
const greeting = "Hello, world!";
console.log(greeting);
\`\`\`
• Bullet point 1
• Bullet point 2
<https://example.com|Link with custom text>`,
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(markdownMessage.content) &&
      markdownMessage.content[0]?.type === 'text'
    ) {
      console.log('Response:', markdownMessage.content[0].text);
    }
    console.log();

    // Example 3: Reply to a thread (only if thread_ts provided)
    if (threadTs) {
      console.log('📝 Example 3: Reply to a thread');
      console.log('--------------------------------');
      const threadReply = (await client.callTool(
        {
          name: 'slack_post_message',
          arguments: {
            channel_id: channelId,
            text: 'This is a reply to a thread! 🧵',
            thread_ts: threadTs,
          },
        },
        CallToolResultSchema
      )) as CallToolResult;

      if (
        Array.isArray(threadReply.content) &&
        threadReply.content[0]?.type === 'text'
      ) {
        console.log('Response:', threadReply.content[0].text);
      }
      console.log();
    } else {
      console.log('📝 Example 3: Reply to a thread');
      console.log('--------------------------------');
      console.log('⏭️  Skipped - no thread_ts provided');
      console.log(
        '   To test thread replies, run: npm run examples:text <channel_id> <thread_ts>'
      );
      console.log();
    }

    console.log('✅ All text message examples completed successfully!');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await transport.close();
  }
}

main().catch(console.error);
