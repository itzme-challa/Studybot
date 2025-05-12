import { Context } from 'telegraf';
import createDebug from 'debug';

import { name } from '../../package.json';

const debug = createDebug('bot:help_command');

const help = () => async (ctx: Context) => {
  const message = `*♡ 𝐓𝐄𝐀𝐌 EDUHUB\\-KMR 𝐂𝐇𝐄𝐂𝐊𝐋𝐈𝐒𝐓 ॐ*\n────────┉┈◈◉◈┈┉───────\n*ꕥ𝐍𝐄𝐄𝐓\\/𝐉𝐄𝐄 𝐌𝐄𝐆𝐀 𝐂𝐇𝐄𝐂𝐊𝐋𝐈𝐒𝐓ꕥ*\n
────────┉┈◈◉◈┈┉───────
➥ [MTG Rapid Physics](https://t.me/Material_eduhubkmrbot?start=mtg-rapid-physics)  
➥ [MTG Rapid Chemistry](https://t.me/Material_eduhubkmrbot?start=mtg-rapid-chemistry)  
➥ [MTG Rapid Biology](https://t.me/Material_eduhubkmrbot?start=mtg-rapid-biology)  

────────┉┈◈◉◈┈┉───────
➥ [PW 37 Years Physics PYQs](https://t.me/Material_eduhubkmrbot?start=pw-37years-pyqs-physics)  
➥ [PW 37 Years Chemistry PYQs](https://t.me/Material_eduhubkmrbot?start=pw-37years-pyqs-chemistry)  
➥ [PW 37 Years Biology PYQs](https://t.me/Material_eduhubkmrbot?start=pw-37years-pyqs-biology)  

────────┉┈◈◉◈┈┉───────
➥ [PW 12 Years Physics PYQs](https://t.me/Material_eduhubkmrbot?start=pw-12years-pyqs-physics)  
➥ [PW 12 Years Chemistry PYQs](https://t.me/Material_eduhubkmrbot?start=pw-12years-pyqs-chemistry)  
➥ [PW 12 Years Biology PYQs](https://t.me/Material_eduhubkmrbot?start=pw-12years-pyqs-biology)  

────────┉┈◈◉◈┈┉───────
➥ [MTG 37 Years Physics PYQs](https://t.me/Material_eduhubkmrbot?start=mtg-37years-pyqs-physics)  
➥ [MTG 37 Years Chemistry PYQs](https://t.me/Material_eduhubkmrbot?start=mtg-37years-pyqs-chemistry)  
➥ [MTG 37 Years Biology PYQs](https://t.me/Material_eduhubkmrbot?start=mtg-37years-pyqs-biology)  

────────┉┈◈◉◈┈┉───────
➥ [MTG Fingertips Physics](https://t.me/Material_eduhubkmrbot?start=mtg-fingertips-new-physics)  
➥ [MTG Fingertips Chemistry](https://t.me/Material_eduhubkmrbot?start=mtg-fingertips-new-chemistry)  
➥ [MTG Fingertips Biology](https://t.me/Material_eduhubkmrbot?start=mtg-fingertips-new-biology)  

────────┉┈◈◉◈┈┉───────
➥ [Rakshita Singh 37 Years Physics](https://t.me/Material_eduhubkmrbot?start=rakshita-singh-37years-physics)  
➥ [Rakshita Singh 37 Years Chemistry](https://t.me/Material_eduhubkmrbot?start=rakshita-singh-37years-chemistry)  
➥ [Rakshita Singh 11th Bio](https://t.me/Material_eduhubkmrbot?start=rakshita-singh-37years-bio11th)  

────────┉┈◈◉◈┈┉───────
➥ [Biology Today](https://t.me/Material_eduhubkmrbot?start=mtg-biology-today)  
➥ [Physics Today](https://t.me/Material_eduhubkmrbot?start=mtg-physics-today)  
➥ [Chemistry Today](https://t.me/Material_eduhubkmrbot?start=mtg-chemistry-today)  
➥ [Mathematics Today](https://t.me/Material_eduhubkmrbot?start=mtg-mathematics-today)  

────────┉┈◈◉◈┈┉───────
➥ [Physics Med Easy 2\\.0](https://t.me/Material_eduhubkmrbot?start=physics-med-easy-2.0)  
➥ [Chemistry Med Easy](https://t.me/Material_eduhubkmrbot?start=chemistry-med-easy)  
➥ [Zoology Med Easy](https://t.me/Material_eduhubkmrbot?start=zoology-med-easy)  
➥ [Botany Med Easy](https://t.me/Material_eduhubkmrbot?start=botany-med-easy)  

────────┉┈◈◉◈┈┉───────
➥ [PW Vidyapeeth Mind Map](https://t.me/Material_eduhubkmrbot?start=pw-vidyapeeth-mind-map)  
➥ [23 Years JEE Physics PYQs](https://t.me/Material_eduhubkmrbot?start=23years-jee-pyqs-physics)  
➥ [PW 6 Years JEE Physics PYQs](https://t.me/Material_eduhubkmrbot?start=pw-6years-jee-pyqs-physics)  
➥ [PW 6 Years JEE Chemistry PYQs](https://t.me/Material_eduhubkmrbot?start=pw-6years-jee-pyqs-chemistry)  
➥ [PW 6 Years JEE Maths PYQs](https://t.me/Material_eduhubkmrbot?start=pw-6years-jee-pyqs-maths)  

────────┉┈◈◉◈┈┉───────
➥ [NCERT Nichod Chemistry](https://t.me/Material_eduhubkmrbot?start=ncert-nichod-chemistry)  
➥ [NCERT Nichod Physics](https://t.me/Material_eduhubkmrbot?start=ncert-nichod-physics)  
➥ [NCERT Nichod Biology](https://t.me/Material_eduhubkmrbot?start=ncert-nichod-biology)  

────────┉┈◈◉◈┈┉───────
➥ [Master the NCERT Bio 11th](https://t.me/Material_eduhubkmrbot?start=master-the-ncert-bio-11th)  
➥ [Master the NCERT Bio 12th](https://t.me/Material_eduhubkmrbot?start=master-the-ncert-bio-12th)  

────────┉┈◈◉◈┈┉───────
➥ [Disha 144 JEE Mains Physics](https://t.me/Material_eduhubkmrbot?start=disha-144-jee-mains-physics)  
➥ [Disha 144 JEE Mains Chemistry](https://t.me/Material_eduhubkmrbot?start=disha-144-jee-mains-chemistry)  

────────┉┈◈◉◈┈┉───────

*For support:*\n
Email: itzme\\.eduhub\\.contact@gmail\\.com  
Telegram: [@itzfew](https://t.me/itzfew)`;

  debug(`Triggered "help" command with message \n${message}`);

  await ctx.replyWithMarkdownV2(message);
};

export { help };
