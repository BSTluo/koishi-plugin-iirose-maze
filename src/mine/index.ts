import { Context, Schema } from 'koishi';

namespace Mine
{
  export interface Config
  {
    // Add your configuration options here
  }
}

class Mine
{
  static name = 'iirose-maze-mine';

  static Config: Schema<Mine.Config> = Schema.object({});

  ctx: Context;
  config: Mine.Config;

  constructor(ctx: Context, config: Mine.Config)
  {
    this.ctx = ctx;
    this.config = config;
  }
}

export default Mine;
