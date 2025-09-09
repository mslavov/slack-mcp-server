#!/usr/bin/env node

import {
  ListToolsRequestSchema,
  CallToolRequestSchema,
} from '@modelcontextprotocol/sdk/types.js';
import { Server } from '@modelcontextprotocol/sdk/server/index.js';
import { StdioServerTransport } from '@modelcontextprotocol/sdk/server/stdio.js';
import { zodToJsonSchema } from 'zod-to-json-schema';
import { WebClient } from '@slack/web-api';
import dotenv from 'dotenv';
import {
  ListChannelsRequestSchema,
  PostMessageRequestSchema,
  PostRichMessageRequestSchema,
  AddReactionRequestSchema,
  GetChannelHistoryRequestSchema,
  GetThreadRepliesRequestSchema,
  ListChannelsResponseSchema,
  ConversationsHistoryResponseSchema,
  ConversationsRepliesResponseSchema,
} from './schemas.js';

dotenv.config();

if (!process.env.SLACK_BOT_TOKEN) {
  console.error(
    'SLACK_BOT_TOKEN is not set. Please set it in your environment or .env file.'
  );
  process.exit(1);
}

const slackClient = new WebClient(process.env.SLACK_BOT_TOKEN);

function createServer(): Server {
  const server = new Server(
    {
      name: 'slack-mcp-server',
      version: '0.0.1',
    },
    {
      capabilities: {
        tools: {},
      },
    }
  );

  server.setRequestHandler(ListToolsRequestSchema, async () => {
    return {
      tools: [
        {
          name: 'slack_list_channels',
          description: 'List public channels in the workspace with pagination',
          inputSchema: zodToJsonSchema(ListChannelsRequestSchema),
        },
        {
          name: 'slack_post_message',
          description:
            'Post a plain text message to a Slack channel or reply to a thread',
          inputSchema: zodToJsonSchema(PostMessageRequestSchema),
        },
        {
          name: 'slack_post_rich_message',
          description:
            'Post a rich structured message to Slack with Block Kit support. Can post to channels or reply to threads. Supports plain text, markdown formatting, and rich Block Kit layouts with sections, images, dividers, headers, and more.',
          inputSchema: zodToJsonSchema(PostRichMessageRequestSchema),
        },
        {
          name: 'slack_add_reaction',
          description: 'Add a reaction emoji to a message',
          inputSchema: zodToJsonSchema(AddReactionRequestSchema),
        },
        {
          name: 'slack_get_channel_history',
          description:
            'Get messages from a channel in chronological order. Use this when: 1) You need the latest conversation flow without specific filters, 2) You want ALL messages including bot/automation messages, 3) You need to browse messages sequentially with pagination. Do NOT use if you have specific search criteria (user, keywords, dates) - use slack_search_messages instead.',
          inputSchema: zodToJsonSchema(GetChannelHistoryRequestSchema),
        },
        {
          name: 'slack_get_thread_replies',
          description: 'Get all replies in a message thread',
          inputSchema: zodToJsonSchema(GetThreadRepliesRequestSchema),
        },
      ],
    };
  });

  server.setRequestHandler(CallToolRequestSchema, async (request) => {
    try {
      if (!request.params) {
        throw new Error('Params are required');
      }
      switch (request.params.name) {
        case 'slack_list_channels': {
          const args = ListChannelsRequestSchema.parse(
            request.params.arguments
          );
          const response = await slackClient.conversations.list({
            limit: args.limit,
            cursor: args.cursor,
            types: 'public_channel', // Only public channels
          });
          if (!response.ok) {
            throw new Error(`Failed to list channels: ${response.error}`);
          }
          const parsed = ListChannelsResponseSchema.parse(response);

          return {
            content: [{ type: 'text', text: JSON.stringify(parsed) }],
          };
        }

        case 'slack_post_message': {
          const args = PostMessageRequestSchema.parse(request.params.arguments);
          const postMessageParams: Record<string, unknown> = {
            channel: args.channel_id,
            text: args.text,
          };

          if (args.thread_ts) postMessageParams.thread_ts = args.thread_ts;

          const response = await slackClient.chat.postMessage(
            postMessageParams as unknown as Parameters<
              typeof slackClient.chat.postMessage
            >[0]
          );
          if (!response.ok) {
            throw new Error(`Failed to post message: ${response.error}`);
          }

          const actionType = args.thread_ts
            ? 'Reply sent to thread'
            : 'Message posted';
          return {
            content: [{ type: 'text', text: `${actionType} successfully` }],
          };
        }

        case 'slack_post_rich_message': {
          const args = PostRichMessageRequestSchema.parse(
            request.params.arguments
          );

          // Build the API call parameters
          const postMessageParams: Record<string, unknown> = {
            channel: args.channel_id,
          };

          // Add optional parameters if provided
          if (args.text) postMessageParams.text = args.text;
          if (args.blocks) postMessageParams.blocks = args.blocks;
          if (args.thread_ts) postMessageParams.thread_ts = args.thread_ts;
          if (args.parse) postMessageParams.parse = args.parse;
          if (args.unfurl_links !== undefined)
            postMessageParams.unfurl_links = args.unfurl_links;
          if (args.unfurl_media !== undefined)
            postMessageParams.unfurl_media = args.unfurl_media;

          const response = await slackClient.chat.postMessage(
            postMessageParams as unknown as Parameters<
              typeof slackClient.chat.postMessage
            >[0]
          );
          if (!response.ok) {
            throw new Error(`Failed to post rich message: ${response.error}`);
          }

          const actionType = args.thread_ts
            ? 'Reply sent to thread'
            : 'Rich message posted';
          return {
            content: [{ type: 'text', text: `${actionType} successfully` }],
          };
        }
        case 'slack_add_reaction': {
          const args = AddReactionRequestSchema.parse(request.params.arguments);
          const response = await slackClient.reactions.add({
            channel: args.channel_id,
            timestamp: args.timestamp,
            name: args.reaction,
          });
          if (!response.ok) {
            throw new Error(`Failed to add reaction: ${response.error}`);
          }
          return {
            content: [{ type: 'text', text: 'Reaction added successfully' }],
          };
        }

        case 'slack_get_channel_history': {
          const args = GetChannelHistoryRequestSchema.parse(
            request.params.arguments
          );
          const response = await slackClient.conversations.history({
            channel: args.channel_id,
            limit: args.limit,
            cursor: args.cursor,
          });
          if (!response.ok) {
            throw new Error(`Failed to get channel history: ${response.error}`);
          }
          const parsedResponse =
            ConversationsHistoryResponseSchema.parse(response);
          return {
            content: [{ type: 'text', text: JSON.stringify(parsedResponse) }],
          };
        }

        case 'slack_get_thread_replies': {
          const args = GetThreadRepliesRequestSchema.parse(
            request.params.arguments
          );
          const response = await slackClient.conversations.replies({
            channel: args.channel_id,
            ts: args.thread_ts,
            limit: args.limit,
            cursor: args.cursor,
          });
          if (!response.ok) {
            throw new Error(`Failed to get thread replies: ${response.error}`);
          }
          const parsedResponse =
            ConversationsRepliesResponseSchema.parse(response);
          return {
            content: [{ type: 'text', text: JSON.stringify(parsedResponse) }],
          };
        }

        default:
          throw new Error(`Unknown tool: ${request.params.name}`);
      }
    } catch (error) {
      console.error('Error handling request:', error);
      const errorMessage =
        error instanceof Error ? error.message : 'Unknown error occurred';
      throw new Error(errorMessage);
    }
  });

  return server;
}

async function runStdioServer() {
  const server = createServer();
  const transport = new StdioServerTransport();
  await server.connect(transport);
  console.error('Slack MCP Server running on stdio');
}

async function main() {
  // Run with stdio transport
  await runStdioServer();
}

main().catch((error) => {
  console.error('Fatal error in main():', error);
  process.exit(1);
});
