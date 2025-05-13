import { Context } from 'telegraf';
import createDebug from 'debug';

const debug = createDebug('bot:pdf_handler');

// Map command keywords to message IDs
const messageMap: Record<string, number> = {
  'mtg-rapid-physics': 3,
  'mtg-rapid-chemistry': 5,
  'mtg-rapid-biology': 4,
  'pw-37years-pyqs-physics': 6,
  'pw-37years-pyqs-chemistry': 7,
  'pw-37years-pyqs-biology': 8,
  'pw-12years-pyqs-physics': 9,
  'pw-12years-pyqs-chemistry': 10,
  'pw-12years-pyqs-biology': 11,
  'mtg-37years-pyqs-physics': 12,
  'mtg-37years-pyqs-chemistry': 13,
  'mtg-37years-pyqs-biology': 14,
  'mtg-fingertips-new-physics': 15,
  'mtg-fingertips-new-chemistry': 16,
  'mtg-fingertips-new-biology': 17,
  'rakshita-singh-37years-physics': 18,
  'rakshita-singh-37years-chemistry': 19,
  'rakshita-singh-37years-bio11th': 20,
  'mtg-biology-today': 21,
  'mtg-physics-today': 22,
  'mtg-chemistry-today': 23,
  'mtg-mathematics-today': 24,
  'physics-med-easy-2.0': 25,
  'chemistry-med-easy': 26,
  'zoology-med-easy': 27,
  'botany-med-easy': 28,
  'pw-vidyapeeth-mind-map': 29,
  '23years-jee-pyqs-physics': 30,
  'pw-6years-jee-pyqs-physics': 31,
  'pw-6years-jee-pyqs-chemistry': 32,
  'pw-6years-jee-pyqs-maths': 33,
  'ncert-nichod-chemistry': 34,
  'ncert-nichod-physics': 35,
  'ncert-nichod-biology': 36,
  'master-the-ncert-bio-11th': 37,
  'master-the-ncert-bio-12th': 38,
  'disha-144-jee-mains-physics': 39,
  'disha-144-jee-mains-chemistry': 40,
  'dcpandey_objective_full': 41,
  'dcpandey_volume1': 42,
  'dcpandey_volume2': 43,
};

const fileStorageChatId = -1002589507108;

const handlePdfCommand = async (ctx: Context, keyword: string) => {
  if (!messageMap[keyword]) return;

  debug(`Handling PDF command for: ${keyword}`);

  await ctx.reply('Here is your file. Save or forward it to keep it — this message will not be stored permanently.');

  await ctx.telegram.copyMessage(
    ctx.chat!.id,
    fileStorageChatId,
    messageMap[keyword]
  );
};

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;

    // Handle /start with deep link
    if (message && 'text' in message && message.text.startsWith('/start')) {
      const parts = message.text.trim().split(' ');
      if (parts.length > 1) {
        const keyword = parts[1].toLowerCase();
        await handlePdfCommand(ctx, keyword);
        return;
      }
    }

    // Handle plain text commands like "neetpyq1"
    if (message && 'text' in message) {
      const keyword = message.text.trim().toLowerCase();
      await handlePdfCommand(ctx, keyword);
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while fetching your file. Please try again later.');
  }
};

export { pdf };
