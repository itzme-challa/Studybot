import { Context } from 'telegraf';
import createDebug from 'debug';
import { initializeApp } from 'firebase/app';
import { getDatabase, ref, child, get } from 'firebase/database';

const debug = createDebug('bot:pdf_handler');

// Initialize Firebase
const firebaseConfig = {
  apiKey: "AIzaSyDNME0C__0yE84_fmabt9_qhnv7l4Y2osg",
  authDomain: "telegrambot-d9bde.firebaseapp.com",
  databaseURL: "https://telegrambot-d9bde-default-rtdb.asia-southeast1.firebasedatabase.app",
  projectId: "telegrambot-d9bde",
  storageBucket: "telegrambot-d9bde.firebasestorage.app",
  messagingSenderId: "1016643360568",
  appId: "1:1016643360568:web:a495de89c5f7f983e6d3cd",
  measurementId: "G-ZQLEPBPWZV"
};

const app = initializeApp(firebaseConfig);
const database = getDatabase(app);
const dbRef = ref(database);

const fileStorageChatId = -1002481747949;

interface ResourcePath {
  batch: string;
  subject: string;
  chapter?: string;
  resourceType: string;
  resourceKey: string;
}

interface MaterialItem {
  path: string;
  messageId: number;
  exists?: boolean;
}

let accessToken: string | null = null;

async function verifyMessageExists(ctx: Context, messageId: number): Promise<boolean> {
  try {
    await ctx.telegram.callApi('getMessage', {
      chat_id: fileStorageChatId,
      message_id: messageId,
    });
    return true;
  } catch (error) {
    debug(`Message ${messageId} not found in storage channel: ${error}`);
    return false;
  }
}

async function createTelegraphAccount() {
  try {
    const res = await fetch('https://api.telegra.ph/createAccount', {
      method: 'POST',
      body: new URLSearchParams({ 
        short_name: 'studybot', 
        author_name: 'Study Bot' 
      }),
    });
    const data = await res.json();
    if (data.ok) {
      accessToken = data.result.access_token;
      debug('Created new Telegraph account');
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error creating Telegraph account:', error);
    throw error;
  }
}

async function createTelegraphPage(query: string, matches: MaterialItem[]): Promise<string> {
  if (!accessToken) {
    await createTelegraphAccount();
  }

  // Filter out non-existent messages
  const validMatches = matches.filter(m => m.exists);

  if (validMatches.length === 0) {
    throw new Error('No valid resources found');
  }

  // Prepare Telegraph page content
  const content = [
    {
      tag: 'h3',
      children: [`Search results for: ${query}`]
    },
    {
      tag: 'p',
      children: ['Found these matching resources:']
    },
    {
      tag: 'ul',
      children: validMatches.map(match => ({
        tag: 'li',
        children: [
          {
            tag: 'a',
            attrs: {
              href: `https://t.me/NeetJeestudy_bot?start=${match.path.replace(/\//g, '__')}`
            },
            children: [match.path.split('/').pop() || match.path]
          }
        ]
      }))
    },
    {
      tag: 'p',
      children: ['Click on any link to get the resource directly in Telegram']
    }
  ];

  try {
    const res = await fetch('https://api.telegra.ph/createPage', {
      method: 'POST',
      body: new URLSearchParams({
        access_token: accessToken!,
        title: `Study Material: ${query.slice(0, 50)}`,
        author_name: 'Study Bot',
        content: JSON.stringify(content),
        return_content: 'true',
      }),
    });
    const data = await res.json();
    if (data.ok) {
      return `https://telegra.ph/${data.result.path}`;
    } else {
      throw new Error(data.error);
    }
  } catch (error) {
    console.error('Error creating Telegraph page:', error);
    throw error;
  }
}

async function findSimilarResources(ctx: Context, path: ResourcePath): Promise<MaterialItem[]> {
  try {
    let searchPath: string;
    
    if (path.chapter) {
      searchPath = `batches/${path.batch}/${path.subject}/${path.chapter}/keys`;
    } else {
      searchPath = `batches/${path.batch}/${path.subject}/all_contents/keys`;
    }

    debug(`Searching for similar resources at: ${searchPath}`);
    const snapshot = await get(child(dbRef, searchPath));
    
    if (!snapshot.exists()) {
      return [];
    }

    const resources = snapshot.val();
    const items = Object.entries(resources).map(([key, messageId]) => ({
      path: `${searchPath}/${key}`.replace(/\//g, '__'),
      messageId: messageId as number,
      exists: true // Will be verified later
    }));

    // Verify which messages actually exist
    for (const item of items) {
      item.exists = await verifyMessageExists(ctx, item.messageId);
    }

    return items.filter(item => item.exists);
  } catch (error) {
    console.error('Error searching resources:', error);
    return [];
  }
}

const parseCommand = (text: string): ResourcePath | null => {
  const parts = text.trim().toLowerCase().split('__');
  
  if (parts.length < 3) return null;

  return {
    batch: parts[0],
    subject: parts[1],
    chapter: parts.length > 3 ? parts[2] : undefined,
    resourceType: parts.length > 3 ? parts[3] : parts[2],
    resourceKey: parts.length > 3 ? parts.slice(3).join('__') : parts.slice(2).join('__')
  };
};

const getMessageId = async (path: ResourcePath): Promise<number | null> => {
  try {
    let dbPath: string;
    
    if (path.chapter) {
      dbPath = `batches/${path.batch}/${path.subject}/${path.chapter}/keys/${path.resourceKey}`;
    } else {
      dbPath = `batches/${path.batch}/${path.subject}/all_contents/keys/${path.resourceKey}`;
    }

    debug(`Fetching from Firebase path: ${dbPath}`);
    const snapshot = await get(child(dbRef, dbPath));
    
    if (!snapshot.exists()) {
      debug('No message ID found at path');
      return null;
    }

    return snapshot.val();
  } catch (error) {
    console.error('Error fetching from Firebase:', error);
    return null;
  }
};

const handlePdfCommand = async (ctx: Context, path: ResourcePath, originalQuery: string) => {
  try {
    const messageId = await getMessageId(path);
    
    if (messageId) {
      try {
        const exists = await verifyMessageExists(ctx, messageId);
        if (exists) {
          await ctx.reply('Here is your file. Save or forward it to keep it — this message will not be stored permanently.');
          await ctx.telegram.copyMessage(
            ctx.chat!.id,
            fileStorageChatId,
            messageId
          );
          return;
        }
      } catch (copyError) {
        console.error('Error copying message:', copyError);
        // Fall through to similar resources search
      }
    }

    // If exact match not found or failed, look for similar resources
    const similarResources = await findSimilarResources(ctx, path);
    
    if (similarResources.length > 0) {
      try {
        const telegraphUrl = await createTelegraphPage(originalQuery, similarResources);
        await ctx.reply(`The exact resource wasn't found, but we found these similar ones:\n\n${telegraphUrl}`);
      } catch (telegraphError) {
        console.error('Error creating Telegraph page:', telegraphError);
        await ctx.reply('Found similar resources but failed to create summary. Please try a more specific search or contact @NeetAspirantsBot.');
      }
    } else {
      await ctx.reply('No matching resources found. Please check your query and try again or contact @NeetAspirantsBot.');
    }
  } catch (err) {
    console.error('Error handling PDF command:', err);
    await ctx.reply('An error occurred while fetching your file. Please contact @NeetAspirantsBot for assistance and try again later.');
  }
};

const pdf = () => async (ctx: Context) => {
  try {
    const message = ctx.message;

    if (!message || !('text' in message)) return;

    // Handle /start with deep link
    if (message.text.startsWith('/start')) {
      const commandParts = message.text.trim().split(' ');
      if (commandParts.length > 1) {
        const resourcePath = parseCommand(commandParts[1]);
        if (resourcePath) {
          await handlePdfCommand(ctx, resourcePath, commandParts[1]);
        } else {
          await ctx.reply('Invalid command format. Please use: batch__subject__chapter__resource or contact @NeetAspirantsBot.');
        }
        return;
      }
    }

    // Handle plain text commands
    const resourcePath = parseCommand(message.text);
    if (resourcePath) {
      await handlePdfCommand(ctx, resourcePath, message.text);
    } else {
      // Try to find resources in the general 'all_contents' for the batch and subject
      const parts = message.text.trim().toLowerCase().split('__');
      if (parts.length >= 2) {
        const fallbackPath: ResourcePath = {
          batch: parts[0],
          subject: parts[1],
          resourceType: parts.length > 2 ? parts[2] : '',
          resourceKey: parts.length > 2 ? parts.slice(2).join('__') : ''
        };
        const similarResources = await findSimilarResources(ctx, fallbackPath);
        if (similarResources.length > 0) {
          try {
            const telegraphUrl = await createTelegraphPage(message.text, similarResources);
            await ctx.reply(`The resource "${message.text}" wasn't found, but we found these similar ones:\n\n${telegraphUrl}`);
          } catch (telegraphError) {
            console.error('Error creating Telegraph page:', telegraphError);
            await ctx.reply('Found similar resources but failed to create summary. Please try a more specific search or contact @NeetAspirantsBot.');
          }
        } else {
          await ctx.reply('No matching resources found. Please use the format: batch__subject__chapter__resource or contact @NeetAspirantsBot.');
        }
      } else {
        await ctx.reply('Invalid command format. Please use: batch__subject__chapter__resource or contact @NeetAspirantsBot.');
      }
    }
  } catch (err) {
    console.error('PDF command handler error:', err);
    await ctx.reply('An error occurred while processing your request. Please contact @NeetAspirantsBot for assistance.');
  }
};

export { pdf };
