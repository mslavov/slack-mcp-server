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
  console.error('Usage: npm run examples:rich <channel_id> [thread_ts]');
  console.error('Example: npm run examples:rich C1234567890');
  console.error('Example: npm run examples:rich C1234567890 1234567890.123456');
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
  console.log('🎨 Slack Rich Message (Block Kit) Examples');
  console.log('==========================================\n');

  // Initialize MCP client
  const client = new Client(
    {
      name: 'slack-rich-example',
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

    // Example 1: Simple section with markdown text
    console.log('🎨 Example 1: Simple section block');
    console.log('----------------------------------');
    const simpleSection = (await client.callTool(
      {
        name: 'slack_post_rich_message',
        arguments: {
          channel_id: channelId,
          text: 'Fallback text for notifications',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Welcome to Block Kit!* 🎉\n\nThis is a rich message with _formatted text_ and `inline code`.',
              },
            },
          ],
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(simpleSection.content) &&
      simpleSection.content[0]?.type === 'text'
    ) {
      console.log('Response:', simpleSection.content[0].text);
    }
    console.log();

    // Example 2: Header with dividers and sections
    console.log('🎨 Example 2: Header with dividers and sections');
    console.log('-----------------------------------------------');
    const headerWithSections = (await client.callTool(
      {
        name: 'slack_post_rich_message',
        arguments: {
          channel_id: channelId,
          text: 'Project Status Update',
          blocks: [
            {
              type: 'header',
              text: {
                type: 'plain_text',
                text: '📊 Project Status Update',
                emoji: true,
              },
            },
            {
              type: 'divider',
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Status:* ✅ On Track\n*Progress:* 75% Complete\n*Due Date:* March 15, 2024',
              },
            },
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '*Recent Updates:*',
              },
              fields: [
                {
                  type: 'mrkdwn',
                  text: '*Frontend*\nUI components completed',
                },
                {
                  type: 'mrkdwn',
                  text: '*Backend*\nAPI endpoints tested',
                },
                {
                  type: 'mrkdwn',
                  text: '*Database*\nMigrations deployed',
                },
                {
                  type: 'mrkdwn',
                  text: '*Testing*\nUnit tests passing',
                },
              ],
            },
          ],
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(headerWithSections.content) &&
      headerWithSections.content[0]?.type === 'text'
    ) {
      console.log('Response:', headerWithSections.content[0].text);
    }
    console.log();

    // Example 3: Image block
    console.log('🎨 Example 3: Image block');
    console.log('--------------------------');
    const imageBlock = (await client.callTool(
      {
        name: 'slack_post_rich_message',
        arguments: {
          channel_id: channelId,
          text: 'Check out this image',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: "Here's an important diagram for our project:",
              },
            },
            {
              type: 'image',
              image_url:
                'https://images.unsplash.com/photo-1551434678-e076c223a692?w=600&h=400&fit=crop&crop=center',
              alt_text: 'Project architecture diagram',
              title: {
                type: 'plain_text',
                text: 'System Architecture',
                emoji: true,
              },
            },
          ],
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(imageBlock.content) &&
      imageBlock.content[0]?.type === 'text'
    ) {
      console.log('Response:', imageBlock.content[0].text);
    }
    console.log();

    // Example 4: Context block with mixed elements
    console.log('🎨 Example 4: Context block');
    console.log('----------------------------');
    const contextBlock = (await client.callTool(
      {
        name: 'slack_post_rich_message',
        arguments: {
          channel_id: channelId,
          text: 'Deployment notification',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: '🚀 *Deployment Successful*\n\nVersion 2.1.0 has been deployed to production.',
              },
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'image',
                  image_url:
                    'https://images.unsplash.com/photo-1507003211169-0a1dd7228f2d?w=20&h=20&fit=crop&crop=center',
                  alt_text: 'success icon',
                },
                {
                  type: 'mrkdwn',
                  text: 'Deployed by *John Doe* at 2:34 PM PST',
                },
              ],
            },
          ],
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(contextBlock.content) &&
      contextBlock.content[0]?.type === 'text'
    ) {
      console.log('Response:', contextBlock.content[0].text);
    }
    console.log();

    // Example 5: Rich message in a thread (only if thread_ts provided)
    if (threadTs) {
      console.log('🎨 Example 5: Rich message as thread reply');
      console.log('-------------------------------------------');
      const richThreadReply = (await client.callTool(
        {
          name: 'slack_post_rich_message',
          arguments: {
            channel_id: channelId,
            text: 'Thread reply with rich content',
            thread_ts: threadTs,
            blocks: [
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: '🧵 *Thread Reply*\n\nThis is a rich Block Kit message posted as a reply to a thread!',
                },
              },
              {
                type: 'divider',
              },
              {
                type: 'section',
                text: {
                  type: 'mrkdwn',
                  text: 'You can use all Block Kit features in thread replies too! 🎉',
                },
              },
            ],
          },
        },
        CallToolResultSchema
      )) as CallToolResult;

      if (
        Array.isArray(richThreadReply.content) &&
        richThreadReply.content[0]?.type === 'text'
      ) {
        console.log('Response:', richThreadReply.content[0].text);
      }
      console.log();
    } else {
      console.log('🎨 Example 5: Rich message as thread reply');
      console.log('-------------------------------------------');
      console.log('⏭️  Skipped - no thread_ts provided');
      console.log(
        '   To test thread replies, run: npm run examples:rich <channel_id> <thread_ts>'
      );
      console.log();
    }

    // Example 6: Multiple sections without actions
    console.log('🎨 Example 6: Multiple sections layout');
    console.log('--------------------------------------');
    const multipleSections = (await client.callTool(
      {
        name: 'slack_post_rich_message',
        arguments: {
          channel_id: channelId,
          text: 'Multi-section message layout',
          blocks: [
            {
              type: 'section',
              text: {
                type: 'mrkdwn',
                text: "📋 *Task Summary*\n\nHere's a summary of completed tasks:",
              },
            },
            {
              type: 'section',
              fields: [
                {
                  type: 'mrkdwn',
                  text: '*Priority:*\nHigh',
                },
                {
                  type: 'mrkdwn',
                  text: '*Status:*\nCompleted',
                },
                {
                  type: 'mrkdwn',
                  text: '*Assignee:*\nDev Team',
                },
                {
                  type: 'mrkdwn',
                  text: '*Due Date:*\nToday',
                },
              ],
            },
            {
              type: 'divider',
            },
            {
              type: 'context',
              elements: [
                {
                  type: 'mrkdwn',
                  text: '💡 *Note:* Interactive buttons and actions require additional Slack app configuration with request URLs.',
                },
              ],
            },
          ],
        },
      },
      CallToolResultSchema
    )) as CallToolResult;

    if (
      Array.isArray(multipleSections.content) &&
      multipleSections.content[0]?.type === 'text'
    ) {
      console.log('Response:', multipleSections.content[0].text);
    }
    console.log();

    console.log('✅ All rich message examples completed successfully!');
    console.log('\n📚 Block Kit Resources:');
    console.log('• Block Kit Builder: https://app.slack.com/block-kit-builder');
    console.log('• Block Kit Documentation: https://docs.slack.dev/block-kit/');
  } catch (error) {
    console.error('❌ Error:', error);
    process.exit(1);
  } finally {
    // Close the connection
    await transport.close();
  }
}

main().catch(console.error);
