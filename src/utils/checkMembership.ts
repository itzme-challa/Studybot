import { Context } from 'telegraf';

const groupId = '@neetpw01';
const channelId = '@NEETUG_26';

export const isMemberOfBoth = async (ctx: Context): Promise<boolean> => {
  try {
    const userId = ctx.from?.id;
    if (!userId) return false;

    const [groupMember, channelMember] = await Promise.all([
      ctx.telegram.getChatMember(groupId, userId),
      ctx.telegram.getChatMember(channelId, userId),
    ]);

    return !['left', 'kicked'].includes(groupMember.status) &&
           !['left', 'kicked'].includes(channelMember.status);
  } catch (err) {
    console.error('Membership check failed:', err);
    return false;
  }
};
