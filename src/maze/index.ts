import { Context, h, Schema } from 'koishi';

namespace Maze
{
  export interface Config
  {
    // Add your configuration options here
  }
}

declare module 'koishi' {
  interface Tables
  {
    mazeParty: {
      id: number; // 组队ID
      owner: string; // 创建者
      members: string[]; // 成员列表
      status: 'waiting' | 'in-progress' | 'completed'; // 组队状态
    };
  }
}


class Maze
{
  static name = 'iirose-maze-maze';
  static inject = ['database'];
  static Config: Schema<Maze.Config> = Schema.object({});

  ctx: Context;
  config: Maze.Config;

  constructor(ctx: Context, config: Maze.Config)
  {
    this.ctx = ctx;
    this.config = config;

    this.start();

    ctx.model.extend('mazeParty', {
      id: 'unsigned',
      owner: 'string',
      members: 'array',
      status: 'string',
    });
  }

  start()
  {
    this.ctx.command('maze', '花园迷宫');

    this.ctx.command('maze.cp').alias('创建迷宫组队').action(async v =>
    {
      const uid = v.session.userId;
      const dataList = await this.ctx.database.get('mazeParty', { owner: uid });
      if (dataList.length > 0)
      {
        return [h.at(v.session.username), '你已经有一个组队了，请先退出当前组队'];
      }

      const partyId = Date.now(); // 简单的ID生成方式，可以替换为更复杂的逻辑
      await this.ctx.database.create('mazeParty', {
        id: partyId,
        owner: uid,
        members: [uid],
        status: 'waiting',
      });

      return [h.at(v.session.username), `组队创建成功，组队ID为 ${partyId}，请输入 "maze.jp <组队ID>" 加入组队`];
    });

    this.ctx.command('maze.jp <partyid:number>').alias('加入迷宫组队').action(async (v, partyid) =>
    {
      if (!partyid)
      {
        return [h.at(v.session.username), '未输入迷宫组队ID'];
      }

      const dataList = await this.ctx.database.get('mazeParty', { id: partyid });
      if (dataList.length <= 0)
      {
        return [h.at(v.session.username), '迷宫组队ID不存在，请检查后重新输入'];
      }

      const party = dataList[0];
      party.members.push(v.session.userId);
      await this.ctx.database.set('mazeParty', { id: partyid }, { members: party.members });
    });

    this.ctx.command('maze.leave').alias('退出迷宫组队').action(async v =>
    {

    });

    this.ctx.command('maze.start').alias('开始迷宫').action(async v =>
    {

    });
  }
}

export default Maze;
