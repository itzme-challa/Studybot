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

    const channels = [
      { id: '@NEETUG_26', name: 'Channel @NEETUG_26', link: 'https://t.me/NEETUG_26' },
      { id: '@neetpw01', name: 'Group @neetpw01', link: 'https://t.me/neetpw01' },
    ];

    let notJoined = [];

    for (const channel of channels) {
      try {
        const member = await ctx.telegram.getChatMember(channel.id, user.id);
        if (['left', 'kicked'].includes(member.status)) {
          notJoined.push(channel);
        }
      } catch (err) {
        console.error(`Error checking membership for ${channel.id}:`, err);
        await ctx.reply('Unable to verify your channel membership. Please try again later.');
        return;
      }
    }

    if (notJoined.length > 0) {
      const links = notJoined.map(c => `👉 [${c.name}](${c.link})`).join('\n');
      await ctx.telegram.sendMessage(
        user.id,
        `**Hello ${user.first_name},**\n\nTo use this bot, please join the required updates:\n\n${links}`,
        {
          parse_mode: 'Markdown',
          disable_web_page_preview: true,
        } as any
      );
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
