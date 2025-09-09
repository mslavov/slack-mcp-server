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
  thread_ts: z
    .string()
    .regex(/^\d{10}\.\d{6}$/, {
      message: "Timestamp must be in the format '1234567890.123456'",
    })
    .optional()
    .describe(
      "Optional timestamp of parent message to reply in thread. Format: '1234567890.123456'"
    ),
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

// Block Kit schemas for structured messages
const TextObjectSchema = z.object({
  type: z.enum(['plain_text', 'mrkdwn']),
  text: z.string(),
  emoji: z.boolean().optional(),
  verbatim: z.boolean().optional(),
});

const SectionBlockSchema = z.object({
  type: z.literal('section'),
  text: TextObjectSchema.optional(),
  block_id: z.string().optional(),
  fields: z.array(TextObjectSchema).optional(),
  accessory: z.any().optional(), // Simplified for now
});

const DividerBlockSchema = z.object({
  type: z.literal('divider'),
  block_id: z.string().optional(),
});

const ImageBlockSchema = z.object({
  type: z.literal('image'),
  image_url: z.string().url(),
  alt_text: z.string(),
  title: TextObjectSchema.optional(),
  block_id: z.string().optional(),
});

const HeaderBlockSchema = z.object({
  type: z.literal('header'),
  text: z.object({
    type: z.literal('plain_text'),
    text: z.string(),
    emoji: z.boolean().optional(),
  }),
  block_id: z.string().optional(),
});

const ContextBlockSchema = z.object({
  type: z.literal('context'),
  elements: z.array(
    z.union([
      TextObjectSchema,
      z.object({
        type: z.literal('image'),
        image_url: z.string().url(),
        alt_text: z.string(),
      }),
    ])
  ),
  block_id: z.string().optional(),
});

const ActionsBlockSchema = z.object({
  type: z.literal('actions'),
  elements: z.array(z.any()), // Simplified for now - buttons, selects, etc.
  block_id: z.string().optional(),
});

const BlockSchema = z.union([
  SectionBlockSchema,
  DividerBlockSchema,
  ImageBlockSchema,
  HeaderBlockSchema,
  ContextBlockSchema,
  ActionsBlockSchema,
]);

export const PostRichMessageRequestSchema = z
  .object({
    channel_id: z.string().describe('The ID of the channel to post to'),
    text: z
      .string()
      .optional()
      .describe(
        'Fallback text for notifications and screen readers. Required if blocks is not provided.'
      ),
    blocks: z
      .array(BlockSchema)
      .max(50)
      .optional()
      .describe(
        'Block Kit blocks for structured message layout. Required if text is not provided.'
      ),
    thread_ts: z
      .string()
      .regex(/^\d{10}\.\d{6}$/, {
        message: "Timestamp must be in the format '1234567890.123456'",
      })
      .optional()
      .describe(
        "Optional timestamp of parent message to reply in thread. Format: '1234567890.123456'"
      ),
    parse: z
      .enum(['full', 'none'])
      .optional()
      .describe(
        'How to parse text content. "full" enables link and mrkdwn parsing.'
      ),
    unfurl_links: z
      .boolean()
      .optional()
      .describe('Enable automatic link previews'),
    unfurl_media: z
      .boolean()
      .optional()
      .describe('Enable automatic media previews'),
  })
  .refine((data) => data.text || data.blocks, {
    message: 'Either text or blocks must be provided',
    path: ['text', 'blocks'],
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
