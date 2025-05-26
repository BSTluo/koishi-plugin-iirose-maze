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

  ctx: Context;
  config: Maze.Config;

  constructor(ctx: Context, config: Maze.Config)
  {
    this.ctx = ctx;
    this.config = config;

    this.start();
  }

  start() {
    this.ctx.command('maze', '花园迷宫');

    this.ctx.command('maze.cp').alias('创建迷宫组队').action(async ({ session }) => {

    })

    this.ctx.command('maze.jp').alias('加入迷宫组队').action(async ({ session }) => {

    })

    this.ctx.command('maze.leave').alias('退出迷宫组队').action(async ({ session }) => {

    })

    this.ctx.command('maze.start').alias('开始迷宫').action(async ({ session }) => {
      
    })
  }
}

export default Maze;
