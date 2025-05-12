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
    const groupLink = '@neetpq01';

    // Check if user has joined the required channel
    try {
      const member = await ctx.telegram.getChatMember(channelId, user.id);
      if (['left', 'kicked'].includes(member.status)) {
        await ctx.telegram.sendMessage(
          user.id,
          `Hey ${user.first_name},\n\nPlease **join all my update channels to use me**!\n\n👉 [Join Channel @NEETUG_26](https://t.me/NEETUG_26)\n👉 [Join Group ${groupLink}](https://t.me/${groupLink.replace('@', '')})`,
          {
            parse_mode: 'Markdown',
            disable_web_page_preview: true,
          } as any
        );
        return;
      }
    } catch (err) {
      console.error('Error checking channel membership:', err);
      await ctx.reply('Unable to verify your channel membership. Please try again later.');
      return;
    }

    // Skip command-like messages
    if (/^[pbcq][0-9]+$/i.test(text) || /^[pbcq]r$/i.test(text)) return;

    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];

    if (greetings.includes(text)) {
      await ctx.reply(`Hey ${user.first_name}! How can I assist you today?`);
    }

  } catch (err) {
    console.error('Greeting handler error:', err);
  }
};

export { greeting };
