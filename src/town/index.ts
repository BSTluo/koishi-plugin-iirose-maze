import { Context, Schema } from 'koishi';

namespace Town
{
  export interface Config
  {
    // Add your configuration options here
  }
}

class Town
{
  static name = 'iirose-maze-town';

  static Config: Schema<Town.Config> = Schema.object({});

  ctx: Context;
  config: Town.Config;

  constructor(ctx: Context, config: Town.Config)
  {
    this.ctx = ctx;
    this.config = config;
  }
}

export default Town;
