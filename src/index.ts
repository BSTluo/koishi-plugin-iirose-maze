import { Context, Schema } from 'koishi';
import maze from './maze';
import mine from './mine';
import river from './river';
import town from './town';
import core from './core';

export const name = 'iirose-maze';

export interface Config { }

export const Config: Schema<Config> = Schema.object({});

const pluginList = {
  maze: maze,
  mine: mine,
  river: river,
  town: town
};

const botConfig = {
  "maze": ["60a7b94c223eb"],
  "mine": ["60a7b94c223eb"],
  "river": ["60a7b94c223eb"],
  "town": ["60a7b94c223eb"]
};

export const host = 'http://127.0.0.1:17515';

export function apply(ctx: Context)
{
  ctx.bots.forEach((bot) =>
  {
    const botId = bot.user.id;
    for (let key in botConfig)
    {
      if (botConfig[key].includes(botId))
      {
        ctx.logger.info(`Loading plugin: ${key} for bot: ${botId}`);
        ctx.plugin(pluginList[key]);
      }
    }
  });

  ctx.plugin(core);
}
