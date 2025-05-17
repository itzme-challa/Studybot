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
  'dcpandey-objective-full': 42,
  'dcpandey-volume1': 43,
  'dcpandey-volume2': 44,
  'inorganic-chemistry-module': 45,
  'organic-chemistry-module': 46,
  'physical-chemistry-module': 47,
  'biology-module-11th': 48,
  'biology-module-12th': 49,
  'physics-module-12th': 50,
  'physics-module-11th': 51,
  'ncert-exemplar-chemistry-11': 52,
  'ncert-exemplar-chemistry-12': 53,
  'ncert-exemplar-physics-11': 54,
  'ncert-exemplar-physics-12': 55,
  'ncert-exemplar-biology-11': 56,
  'ncert-exemplar-biology-12': 57,
  'organic-chemistry-word-to-word': 58,
  'biology-word-to-word': 59,
  'inorganic-chemistry-word-to-word': 60,
  'arihant-physics-handbook': 61,
  'arihant-mathematics-handbook': 62,
  'arihant-chemistry-handbook': 63,
  'view-more-study-material': 64,
    '10-full-syllabus-mock-anand': 65,
  'akash-modules': 66,
  'allen-modules': 67,
  'allen-11-years-pyq': 68,
  'ncert-punch-biology': 69,
  'ncert-punch-chemistry': 70,
  'ncert-punch-physics': 71,
  'competishun-jee-maths-5yr-pyq': 72,
  'competishun-jee-chemistry-5yr-pyq': 73,
  'competishun-jee-physics-5yr-pyq': 74,
  'pw-pyq-physics-11': 75,
  'pw-pyq-physics-12': 76,
  'pw-pyq-organic-chemistry': 77,
  'pw-pyq-inorganic-chemistry': 78,
  'pw-pyq-physical-chemistry': 79,
  'pw-pyq-biology-11': 80,
  'pw-pyq-biology-12': 81,
  'arihant-pyq-biology': 82,
  'arihant-pyq-physics': 83,
  'arihant-pyq-chemistry': 84,
  'allen-physics-handbook': 85,
'allen-chemistry-handbook': 86,
'allen-biology-handbook': 87,
'allen-maths-handbook': 88,
  'mohit-bhargava-physics-12th-1': 89,
'mohit-bhargava-physics-12th-2': 90,
'gurukul-oswal-objective-iit-jee': 91,
'neet-crash-pw-45-days-physics': 92,
'NEET-crash-pw-45-days-biology': 93,
'neet-CRASH-pw-45-days-chemistry': 94,
'bansal-classes-chemistry-theory': 95,
'Bansal-classes-math-questions': 96,
'bansal-classes-physics-booklet': 97,
'bansal-classes-physics-material': 98,
'bansal-classes-math-theory': 99,
'bansal-classes-chemistry-booklet-1': 100,
'bansal-classes-organic-chemistry-1': 101,
'bansal-classes-chemistry-booklet-2': 102,
'bansal-classes-organic-chemistry-2': 103,
'bansal-classes-physics-theory': 104,
'iit-kalrashukla-jee-advanced-problems-1-6': 105,
'IIT-kalrashukla-jee-advanced-problems-7-12': 106,
'iit-kalrashukla-jee-advanced-problems-13-19': 107,
'oswaal-math': 108,
'Oswaal-physics': 109,
'oswaal-chemistry': 110,
'narayana-jee-advanced-test': 111,
'aakash-zoology-ncert-map': 112,
'aakash-botany-ncert-map': 113,
'Aakash-physics-ncert-map': 114,
'aakash-chemistry-ncert-map': 115,
'rd-sharma-11th': 116,
'rd-sharma-12th-2': 117,
'rd-sharma-12th-1': 118,
'arihant-40-days-crash-jee-mains-physics': 119,
'Arihant-40-days-crash-jee-mains-chemistry': 120,
'arihant-40-days-crash-jee-mains-mathematics': 121,
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
    await ctx.reply('"An error occurred while fetching your file. Please contact @NeetAspirantsBot for assistance and try again later.');
  }
};

export { pdf };
