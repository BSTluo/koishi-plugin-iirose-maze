import { Context, Schema } from 'koishi';

namespace River
{
  export interface Config
  {
    // Add your configuration options here
  }
}

class River
{
  static name = 'iirose-maze-river';

  static Config: Schema<River.Config> = Schema.object({});

  ctx: Context;
  config: River.Config;

  constructor(ctx: Context, config: River.Config)
  {
    this.ctx = ctx;
    this.config = config;
  }
}

export default River;
