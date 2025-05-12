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

    // Step 1: Membership check
    const channels = [
      { id: '@NEETUG_26', name: 'Channel @NEETUG_26', link: 'https://t.me/NEETUG_26' },
      { id: '@neetpw01', name: 'Group @neetpw01', link: 'https://t.me/neetpw01' },
    ];

    for (const channel of channels) {
      try {
        const member = await ctx.telegram.getChatMember(channel.id, user.id);
        if (!member || ['left', 'kicked'].includes(member.status)) {
          // User is not a member — silently return and do nothing
          return;
        }
      } catch (err) {
        console.error(`Error checking membership for ${channel.id}:`, err);
        // Possibly private/invalid channel — silently block access
        return;
      }
    }

    // Step 2: If user is a member, process greetings
    const greetings = ['hi', 'hello', 'hey', 'hii', 'heyy', 'hola', 'start', '/start'];

    // Avoid command-like messages like p12, br, etc.
    if (/^[pbcq][0-9]+$/i.test(text) || /^[pbcq]r$/i.test(text)) return;

    if (greetings.includes(text)) {
      await ctx.reply(`Hey ${user.first_name}! How can I assist you today?`);
    }

  } catch (err) {
    console.error('Greeting handler error:', err);
  }
};

export { greeting };
