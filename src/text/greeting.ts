import { Context } from 'telegraf';
import createDebug from 'debug';
import { Markup } from 'telegraf';

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
    const groupLink = '@neetpw01';

    // Check if user is a member of the required channel
    try {
      const member = await ctx.telegram.getChatMember(channelId, user.id);

      if (['left', 'kicked'].includes(member.status)) {
        await ctx.reply(
  `Hey ${user.first_name},\n\nPlease *join all my update channels to use me*:\n\n👉 [Join Channel ${channelId}](https://t.me/${channelId.replace('@', '')})\n👉 [Join Group ${groupLink}](https://t.me/${groupLink.replace('@', '')})`,
  {
    parse_mode: 'Markdown',
    disable_web_page_preview: true,
  }
);
        return;
      }
    } catch (err) {
      console.error('Error checking channel membership:', err);
      await ctx.reply('Unable to verify your channel membership. Please try again later.');
      return;
    }

    // Skip if message is a known command-like pattern
    if (/^[pbcq][0-9]+$/i.test(text) || /^[pbcq]r$/i.test(text)) return;

    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];
    if (greetings.includes(text)) {
      await ctx.reply(`Hey ${user.first_name}! How can I assist you today?`);
    }

  } catch (err) {
    console.error('Greeting handler error:', err);
    await ctx.reply('Oops! Something went wrong. Please try again later.');
  }
};

export { greeting };
