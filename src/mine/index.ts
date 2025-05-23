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

  constructor(ctx: Context, config: Mine.Config)
  {
    console.log('Mine plugin initialized');
  }
}

export default Mine;
