import { Context, h, Schema, Session } from 'koishi';
import { User } from './user';
import { Monster } from './monster';
import { MazeGame } from './mazeGame';

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
    mazeParty: mazeParty;
    mazeUserParty: mazeUserParty;
  }
}

export type mazeParty = {
  id: number; // 组队ID
  owner: string; // 创建者
  members: string[]; // 成员列表
  status: 'waiting' | 'inGame' | 'completed'; // 组队状态
};

export type mazeUserParty = {
  id: string; // 用户ID
  partyId: number; // 组队ID
};

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
    this.ctx.command('maze.cp', '创建迷宫组队').alias('创建迷宫组队').action(async v =>
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

    this.ctx.command('maze.jp <partyid:number>', '加入迷宫组队').alias('加入迷宫组队').action(async (v, partyid) =>
    {
      const uid = v.session.userId;
      if (!partyid)
      {
        return [h.at(v.session.username), '未输入迷宫组队ID'];
      }

      const userInfoData = await this.ctx.database.get('mazeUserParty', { id: uid });
      if (userInfoData.length > 0)
      {
        return [h.at(v.session.username), '你已经在一个组队中了，请先退出当前组队'];
      }

      const dataList = await this.ctx.database.get('mazeParty', { id: partyid });
      if (dataList.length <= 0)
      {
        return [h.at(v.session.username), '迷宫组队ID不存在，请检查后重新输入'];
      }

      const party = dataList[0];

      if (party.members.includes(uid))
      {
        return [h.at(v.session.username), '你已经在这个组队中了'];
      }
      party.members.push(uid);

      if (party.members.length > 4)
      {
        return [h.at(v.session.username), '组队人数已满，无法加入'];
      }

      await this.ctx.database.create('mazeUserParty', {
        id: uid,
        partyId: partyid,
      });

      await this.ctx.database.set('mazeParty', { id: partyid }, { members: party.members });

      let userList = [];

      for (let i = 0; i < party.members.length; i++)
      {
        userList.push(`${i + 1}.`);
        userList.push(h.at(party.members[i]));
        userList.push('\n');
      }

      return [h.at(v.session.username), `加入组队成功，组队ID为 ${partyid}，当前成员：\n\n`].concat(userList);
    });

    this.ctx.command('maze.leave', '退出迷宫组队').alias('退出迷宫组队').action(async v =>
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

    this.ctx.command('maze.start', '开始迷宫').alias('开始迷宫').action(async v =>
    {
      const uid = v.session.userId;
      const dataList = await this.ctx.database.get('mazeUserParty', { id: uid });
      let single = false;

      if (dataList.length <= 0)
      {
        await v.session.send([h.at(v.session.username), '你不在任何组队中，是否进入单人模式?(请在10秒内输入yes或者no)']);

        const inputData = await v.session.prompt(10000);

        if (inputData == 'yes')
        {
          single = true;
        } else if (inputData == 'no')
        {
          return [h.at(v.session.username), '你放弃进入迷宫'];
        } else
        {
          return [h.at(v.session.username), '输入无效，请重新执行命令'];
        }
      }

      let playerIdList = [];
      let party: mazeParty;
      if (single)
      {
        // 处理单人模式逻辑
        playerIdList = [uid];
        party = {
          id: Date.now(), // 简单的ID生成方式，可以替换为更复杂的逻辑
          owner: uid,
          members: playerIdList,
          status: 'waiting',
        };
      } else
      {
        const partyId = dataList[0].partyId;
        const partyList = await this.ctx.database.get('mazeParty', { id: partyId });

        if (partyList.length <= 0)
        {
          return [h.at(v.session.username), '组队不存在，请检查后重新输入'];
        }

        party = partyList[0];
        if (party.status !== 'waiting')
        {
          return [h.at(v.session.username), `组队状态为【${party.status}】，无法开始迷宫`];
        }
        await this.ctx.database.set('mazeParty', { id: partyId }, { status: 'inGame' });

        playerIdList = party.members;
      }
      await this.startMaze(v.session, playerIdList, party);
    });

    this.ctx.command('maze.run', '结束迷宫').alias('结束迷宫').action(async v =>
    {
      // 战斗中退出组队需要惩罚(未完成)
      const uid = v.session.userId;
      const dataList = await this.ctx.database.get('mazeUserParty', { id: uid });
      let single = false;

      if (dataList.length <= 0)
      {
        await v.session.send([h.at(v.session.username), '你不在任何组队中']);
        return;
      }
      const useData = dataList[0];
      const partyId = useData.partyId;
      await this.ctx.database.remove('mazeUserParty', { id: uid });

      let party;
      if (!this.mazeGameList[partyId])
      {
        const a = await this.ctx.database.get('mazeParty', { id: partyId });
        if (a.length <= 0)
        {
          return [h.at(v.session.username), '组队不存在，请检查后重新输入'];
        }
        party = a[0];
      } else
      {
        party = this.mazeGameList[partyId].party;
      }

      // 未完成，此处需要将整局游戏结束，包括投票结束之类的
      party.members = party.members.filter(member => member !== uid);

      await v.session.send([h.at(v.session.username), `你已退出组队${party.hasOwnProperty('members') ? ('，当前组队成员：' + party.members.join(', ')) : ''}`]);

      if (party.members.length === 0)
      {
        await this.ctx.database.remove('mazeParty', { id: partyId });
        if (this.mazeGameList[partyId])
        {
          this.mazeGameList[partyId].userList = null;
          this.mazeGameList[partyId].monsterList = null;
          await this.mazeGameList[partyId].stop('lose');
          delete this.mazeGameList[partyId];
        }

        await v.session.send([h.at(v.session.username), '因队伍无人，已解散']);
      } else
      {
        await this.ctx.database.set('mazeParty', { id: partyId }, { members: party.members });
      }
    });

    this.ctx.command('maze.assign <name:string> <point:number>', '分配属性点').alias('分配属性点').example('maze.assign 物理攻击 1').action(async (v, name, point) =>
    {
      const uid = v.session.userId;
      const inputMagTemp = name.match(/(物理攻击|魔法攻击|治愈|道具使用)\s+(\d+)?/);
      const inputBlockTemp = name.match(/(格挡|弹反)/);
      let action: string;

      if (!inputMagTemp && !inputBlockTemp)
      {
        await v.session.send([h.at(uid), '输入无效']);
        return;
      }

      if (!point)
      {
        await v.session.send([h.at(uid), '请输入分配的属性点数']);
        return;
      }

      const user = new User(uid, this.ctx, v.session);

      if (user.attributePoints < point)
      {
        await v.session.send([h.at(uid), '属性点不足，无法分配', `当前属性点：${user.attributePoints}`]);
        return;
      }

      user.attributePoints -= point;
      user[name] += point;
      const newData = {
        id: uid,
        attributePoints: user.attributePoints,
      };
      newData[name] = user[name];

      await user.updateUserData(newData);
      await v.session.send([h.at(uid), `属性点分配成功，当前属性点：${user.attributePoints}`]);     
    });
  }

  mazeGameList: Record<string, MazeGame> = {};

  // 创建怪物与每个怪物的战斗序列
  async startMaze(session: Session, playerIdList: string[], party: mazeParty)
  {
    // 这里可以添加创建怪物的逻辑
    // 每个怪物可以有不同的属性和技能
    // 返回一个包含所有怪物的列表
    const mazeGame = await (new MazeGame(this.ctx, session, playerIdList, party)).initialize();
    this.mazeGameList[party.id] = mazeGame; // 将游戏实例存储在列表中
    await mazeGame.start();
    delete this.mazeGameList[party.id];
  }

}

export default Maze;
