import { Context, Schema } from 'koishi';

namespace Maze
{
  export interface Config
  {
    // Add your configuration options here
  }
}

class Maze
{
  static name = 'iirose-maze-maze';

  static Config: Schema<Maze.Config> = Schema.object({});

  constructor(ctx: Context, config: Maze.Config)
  {
    console.log('Maze plugin initialized');
  }
}

export default Maze;
