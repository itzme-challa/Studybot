import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:greeting_text');

const greeting = () => async (ctx: Context) => {
  try {
    debug('Triggered "greeting" text command');

    const message = ctx.message;
    if (!message || !('text' in message)) return;

    const text = message.text.trim().toLowerCase();
    const user = ctx.from;
    if (!user) return;

    const channelId = '@NEETUG_26';
    const groupId = '@neetpq01';

    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];

    // Check membership in both channel and group
    try {
      const channelMember = await ctx.telegram.getChatMember(channelId, user.id);
      const groupMember = await ctx.telegram.getChatMember(groupId, user.id);

      const isChannelMember = !['left', 'kicked'].includes(channelMember.status);
      const isGroupMember = !['left', 'kicked'].includes(groupMember.status);

      if (!isChannelMember || !isGroupMember) {
        await ctx.telegram.sendMessage(
          user.id,
          `Hey ${user.first_name},\n\nPlease **join all my update channels to use me**:\n\n` +
          `✅ [Join Channel](https://t.me/NEETUG_26)\n` +
          `✅ [Join Group](https://t.me/neetpq01)\n\n` +
          `Once you've joined both, send *Hi* again!`,
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          } as any
        );
        return;
      }
    } catch (err) {
      console.error('Error checking membership:', err);
      await ctx.reply('Unable to verify your membership. Please try again later.');
      return;
    }

    // Skip command-like messages
    if (/^[pbcq][0-9]+$/i.test(text) || /^[pbcq]r$/i.test(text)) return;

    if (greetings.includes(text)) {
      await ctx.reply(`Hey ${user.first_name}! How can I assist you today?`);
    }

  } catch (err) {
    console.error('Greeting handler error:', err);
  }
};

export { greeting };
