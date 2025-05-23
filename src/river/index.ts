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

  constructor(ctx: Context, config: River.Config)
  {
    console.log('River plugin initialized');
  }
}

export default River;
