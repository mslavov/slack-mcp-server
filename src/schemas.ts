import { z } from 'zod';

//
// Basic schemas
//

export const ChannelSchema = z
  .object({
    conversation_host_id: z.string().optional(),
    created: z.number().optional(),
    id: z.string().optional(),
    is_archived: z.boolean().optional(),
    name: z.string().optional(),
    name_normalized: z.string().optional(),
    num_members: z.number().optional(),
    purpose: z
      .object({
        creator: z.string().optional(),
        last_set: z.number().optional(),
        value: z.string().optional(),
      })
      .optional(),
    shared_team_ids: z.array(z.string()).optional(),
    topic: z
      .object({
        creator: z.string().optional(),
        last_set: z.number().optional(),
        value: z.string().optional(),
      })
      .optional(),
    updated: z.number().optional(),
  })
  .strip();

const ReactionSchema = z
  .object({
    count: z.number().optional(),
    name: z.string().optional(),
    url: z.string().optional(),
    users: z.array(z.string()).optional(),
  })
  .strip();

const ConversationsHistoryMessageSchema = z
  .object({
    reactions: z.array(ReactionSchema).optional(),
    reply_count: z.number().optional(),
    reply_users: z.array(z.string()).optional(),
    reply_users_count: z.number().optional(),
    subtype: z.string().optional(),
    text: z.string().optional(),
    thread_ts: z.string().optional(),
    ts: z.string().optional(),
    type: z.string().optional(),
    user: z.string().optional(),
  })
  .strip();

//
// Request schemas
//

export const AddReactionRequestSchema = z.object({
  channel_id: z
    .string()
    .describe('The ID of the channel containing the message'),
  reaction: z.string().describe('The name of the emoji reaction (without ::)'),
  timestamp: z
    .string()
    .regex(/^\d{10}\.\d{6}$/, {
      message: "Timestamp must be in the format '1234567890.123456'",
    })
    .describe(
      "The timestamp of the message to react to in the format '1234567890.123456'"
    ),
});

export const GetChannelHistoryRequestSchema = z.object({
  channel_id: z
    .string()
    .describe(
      'The ID of the channel. Use this tool for: browsing latest messages without filters, getting ALL messages including bot/automation messages, sequential pagination. If you need to search by user, keywords, or dates, use slack_search_messages instead.'
    ),
  cursor: z
    .string()
    .optional()
    .describe('Pagination cursor for next page of results'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000) // Align with Slack API's default limit
    .optional()
    .default(100) // The reference repository uses 10, but aligning with list_channels etc., set to 100
    .describe('Number of messages to retrieve (default 100)'),
});

export const GetThreadRepliesRequestSchema = z.object({
  channel_id: z
    .string()
    .describe('The ID of the channel containing the thread'),
  thread_ts: z
    .string()
    .regex(/^\d{10}\.\d{6}$/, {
      message: "Timestamp must be in the format '1234567890.123456'",
    })
    .describe(
      "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it."
    ),
  cursor: z
    .string()
    .optional()
    .describe('Pagination cursor for next page of results'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000)
    .optional()
    .default(100)
    .describe('Number of replies to retrieve (default 100)'),
});

export const ListChannelsRequestSchema = z.object({
  cursor: z
    .string()
    .optional()
    .describe('Pagination cursor for next page of results'),
  limit: z
    .number()
    .int()
    .min(1)
    .max(1000) // Align with Slack API's default limit (conversations.list is actually cursor-based)
    .optional()
    .default(100)
    .describe('Maximum number of channels to return (default 100)'),
});

export const PostMessageRequestSchema = z.object({
  channel_id: z.string().describe('The ID of the channel to post to'),
  text: z.string().describe('The message text to post'),
});

export const ReplyToThreadRequestSchema = z.object({
  channel_id: z
    .string()
    .describe('The ID of the channel containing the thread'),
  text: z.string().describe('The reply text'),
  thread_ts: z
    .string()
    .regex(/^\d{10}\.\d{6}$/, {
      message: "Timestamp must be in the format '1234567890.123456'",
    })
    .describe(
      "The timestamp of the parent message in the format '1234567890.123456'. Timestamps in the format without the period can be converted by adding the period such that 6 numbers come after it."
    ),
});

//
// Response schemas
//

const BaseResponseSchema = z
  .object({
    error: z.string().optional(),
    ok: z.boolean().optional(),
    response_metadata: z
      .object({
        next_cursor: z.string().optional(),
      })
      .optional(),
  })
  .strip();

export const ConversationsHistoryResponseSchema = BaseResponseSchema.extend({
  messages: z.array(ConversationsHistoryMessageSchema).optional(),
});

export const ConversationsRepliesResponseSchema = BaseResponseSchema.extend({
  messages: z.array(ConversationsHistoryMessageSchema).optional(),
});

export const ListChannelsResponseSchema = BaseResponseSchema.extend({
  channels: z.array(ChannelSchema).optional(),
});
