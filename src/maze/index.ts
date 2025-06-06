import { Context, h, Schema } from 'koishi';
import { User } from './user';
import { Monster } from './monster';

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
      status: 'waiting' | 'inGame' | 'completed'; // 组队状态
    };

    mazeUserParty: {
      id: string; // 用户ID
      partyId: number; // 组队ID
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

    ctx.model.extend('mazeUserParty', {
      id: 'string',
      partyId: 'unsigned',
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

      await this.ctx.database.create('mazeUserParty', {
        id: uid,
        partyId: partyId,
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

      const uid = v.session.userId;

      const party = dataList[0];

      if (party.members.includes(uid))
      {
        return [h.at(v.session.username), '你已经在这个组队中了'];
      }
      party.members.push();

      if (party.members.length > 4)
      {
        return [h.at(v.session.username), '组队人数已满，无法加入'];
      }

      await this.ctx.database.create('mazeUserParty', {
        id: uid,
        partyId: partyid,
      });

      await this.ctx.database.set('mazeParty', { id: partyid }, { members: party.members });

      return [h.at(v.session.username), `加入组队成功，组队ID为 ${partyid}，当前成员：${party.members.join(', ')}`];
    });

    this.ctx.command('maze.leave').alias('退出迷宫组队').action(async v =>
    {
      const uid = v.session.userId;
      const dataList = await this.ctx.database.get('mazeUserParty', { id: uid });
      if (dataList.length <= 0)
      {
        return [h.at(v.session.username), '你不在任何组队中'];
      }

      await this.ctx.database.remove('mazeUserParty', { id: uid });

      const partyId = dataList[0].partyId;
      const partyList = await this.ctx.database.get('mazeParty', { id: partyId });

      if (partyList.length <= 0)
      {
        return [h.at(v.session.username), '组队不存在，请检查后重新输入'];
      }

      const party = partyList[0];

      party.members = party.members.filter(member => member !== uid);
      if (party.members.length === 0)
      {
        await this.ctx.database.remove('mazeParty', { id: partyId });
      } else
      {
        await this.ctx.database.set('mazeParty', { id: partyId }, { members: party.members });
      }

      return [h.at(v.session.username), `退出组队成功，当前组队成员：${party.members.join(', ')}`];
    });

    this.ctx.command('maze.start').alias('开始迷宫').action(async v =>
    {
      const uid = v.session.userId;
      const dataList = await this.ctx.database.get('mazeUserParty', { id: uid });
      let single = false;

      if (dataList.length <= 0)
      {
        v.session.send([h.at(v.session.username), '你不在任何组队中，是否进入单人模式?(请在5秒内输入yes或者no)']);

        const inputData = await v.session.prompt(5000);
        if (inputData == 'yes')
        {
          single = true;
        } else if (inputData == 'no')
        {
          return [h.at(v.session.username), '你放弃进入迷宫'];
        } else
        {
          return [h.at(v.session.username), '输入无效，请重新输入'];
        }
      }

      let playerIdList = [];
      if (single)
      {
        // 处理单人模式逻辑
        playerIdList = [uid];
      } else
      {
        const partyId = dataList[0].partyId;
        const partyList = await this.ctx.database.get('mazeParty', { id: partyId });

        if (partyList.length <= 0)
        {
          return [h.at(v.session.username), '组队不存在，请检查后重新输入'];
        }

        const party = partyList[0];
        if (party.status !== 'waiting')
        {
          return [h.at(v.session.username), '组队状态不正确，无法开始迷宫'];
        }
        await this.ctx.database.set('mazeParty', { id: partyId }, { status: 'inGame' });

        playerIdList = party.members;
      }

      const userDataList = this.getUserDataList(playerIdList);

      this.createMonster(userDataList);
    });
  }

  // 获取用户数据列表
  getUserDataList(playerIdList: string[])
  {
    let userDataList: User[] = [];

    for (const playerId of playerIdList)
    {
      const user = new User(playerId, this.ctx);
      userDataList.push(user);
    }

    return userDataList;
  }

  // 创建怪物与每个怪物的战斗序列
  createMonster(userDataList: User[])
  {
    // 这里可以添加创建怪物的逻辑
    // 每个怪物可以有不同的属性和技能
    // 返回一个包含所有怪物的列表
    let monsterList = [];
    for (const user of userDataList) {
      const monster = new Monster(user, this.ctx, userDataList);
      monsterList.push(monster);
    }
  }

}

export default Maze;
