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
  ReplyToThreadRequestSchema,
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
          description: 'Post a new message to a Slack channel',
          inputSchema: zodToJsonSchema(PostMessageRequestSchema),
        },
        {
          name: 'slack_reply_to_thread',
          description: 'Reply to a specific message thread in Slack',
          inputSchema: zodToJsonSchema(ReplyToThreadRequestSchema),
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
          const response = await slackClient.chat.postMessage({
            channel: args.channel_id,
            text: args.text,
          });
          if (!response.ok) {
            throw new Error(`Failed to post message: ${response.error}`);
          }
          return {
            content: [{ type: 'text', text: 'Message posted successfully' }],
          };
        }

        case 'slack_reply_to_thread': {
          const args = ReplyToThreadRequestSchema.parse(
            request.params.arguments
          );
          const response = await slackClient.chat.postMessage({
            channel: args.channel_id,
            thread_ts: args.thread_ts,
            text: args.text,
          });
          if (!response.ok) {
            throw new Error(`Failed to reply to thread: ${response.error}`);
          }
          return {
            content: [
              { type: 'text', text: 'Reply sent to thread successfully' },
            ],
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
