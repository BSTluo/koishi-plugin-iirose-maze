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

  constructor(ctx: Context, config: Town.Config)
  {
    console.log('Town plugin initialized');
  }
}

export default Town;
