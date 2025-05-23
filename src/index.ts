import { Context, Schema } from 'koishi';
import maze from './maze';
import mine from './mine';
import river from './river';
import town from './town';

export const name = 'iirose-maze';

export interface Config { }

export const Config: Schema<Config> = Schema.object({});

const pluginList = {
  maze: maze,
  mine: mine,
  river: river,
  town: town
}

const botConfig = {
  "maze": ["60a7b94c223eb"],
  "mine": ["60a7b94c223eb"],
  "river": ["60a7b94c223eb"],
  "town": ["60a7b94c223eb"]
};

export function apply(ctx: Context)
{

  ctx.bots.forEach((bot) =>
  {
    const botId = bot.user.id
    for(let key in botConfig)
    {
      if(botConfig[key].includes(botId))
      {
        ctx.plugin(pluginList[key]);
      }
    }
  });
}
