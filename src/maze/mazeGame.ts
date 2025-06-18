import { Context, h, Session } from "koishi";
import { User } from "./user";
import { MonsterList } from "./monsterList";
import { UserList } from "./userList";
import { mazeParty } from ".";

export class MazeGame
{
  ctx: Context; // Koishi 上下文
  session: Session; // 会话对象
  playerIdList: string[];
  party: mazeParty;
  userList: UserList; // 用户列表对象
  monsterList: MonsterList; // 怪物列表对象

  constructor(ctx: Context, session: Session, playerIdList: string[], party: mazeParty)
  {
    this.ctx = ctx; // 设置上下文
    this.session = session; // 设置会话对象
    this.playerIdList = playerIdList; // 玩家ID列表
    this.party = party; // 组队信息
  }

  async initialize()
  {
    this.party.status = 'inGame'; // 更新组队状态为进行中
    await this.ctx.database.upsert('mazeParty', [this.party]); // 更新数据库中的组队状态
    this.userList = await (new UserList(this.ctx, this.session, this)).initialize(); // 初始化用户列表对象

    this.monsterList = await (new MonsterList(this.ctx, this)).initialize(); // 初始化怪物列表
    return this; // 返回当前实例
  }

  // private async getUserDataList(playerIdList: string[], session: Session, party?: mazeParty)
  // {
  //   let userDataList: User[] = [];

  //   for (const playerId of playerIdList)
  //   {
  //     const user = new User(playerId, this.ctx, session, this);
  //     userDataList.push(await user.initialize());
  //     const data = {
  //       id: user.id,
  //       partyId: party.id
  //     };
  //     await this.ctx.database.upsert('mazeUserParty', [data]); // 更新或插入用户数据到数据库
  //   }

  //   return userDataList;
  // }

  getMonsterInfo()
  {
    let openingMessage = '';

    for (let i = 0; i < this.monsterList.monsterList.length; i++)
    {
      const monster = this.monsterList.monsterList[i]; // 获取怪物信息
      openingMessage += `${i + 1}. ${monster.name} HP：${monster.hp}\n`;
      i++;
    }

    return openingMessage; // 返回怪物信息
  }

  // 开始游戏
  async start()
  {
    await this.session.send('游戏开始，请准备好！'); // 发送游戏开始消息
    await this.session.send('当前怪物信息：\n' + this.getMonsterInfo()); // 发送当前怪物信息
    await this.session.send([
      '请注意，游戏开始后，需要在规定时间内输入指令进行攻击。有如下的指令：\n',
      '物理攻击\n',
      '魔法攻击\n',
      '格挡\n',
      '弹反\n',
      '治愈\n\n',
      // '道具使用\n\n',(下次做)
      // '需要注意：治愈与使用道具的目标是己方'(下次做)
      '需要注意：治愈与的目标是己方'
    ]); // 提醒玩家输入指令

    while (this.party.status === 'inGame')
    {
      for (const user of this.userList.userObjList)
      {
        await this.session.send([
          h.at(this.session.username),
          '请在10秒内输入指令以及攻击目标（如：物理攻击 1），超时将自动物理攻击第一位。'
        ]);

        let input = await this.session.prompt(10000);

        let action = '物理攻击'; // 默认动作为物理攻击
        let target = 0; // 默认目标为第一位

        if (!input)
        {
          await this.session.send([h.at(this.session.username), '输入超时，自动进行物理攻击第一位。']);
          input = '物理攻击 1'; // 如果没有输入，默认物理攻击第一位
        }

        const inputMagTemp = input.match(/(物理攻击|魔法攻击|格挡|弹反|治愈|道具使用)\s+(\d+)?/);

        if (!inputMagTemp)
        {
          await this.session.send([h.at(this.session.username), '输入无效，自动进行物理攻击第一位。']);
        } else
        {
          action = inputMagTemp[1]; // 获取动作
          target = parseInt(inputMagTemp[2]) - 1 || 0; // 获取目标，默认第一位
        }

        // console.log(`用户 ${user.id} 执行动作：${action}，目标：${target}`);

        await user.action(action, target, this.userList, this.monsterList); // 执行用户动作
      }

      for (const monster of this.monsterList.monsterList)
      {
        await monster.useSkill();
      }
    }
  }

  // 结束游戏
  async stop(status: 'win' | 'lose' | 'error')
  {
    if (status === 'win')
    {
      await this.session.send([h.at(this.session.username), '恭喜你们，所有人都成功通关迷宫！']);

      for (let i = 0; i < this.userList.joinUserObjList.length; i++)
      {
        const user = this.userList.joinUserObjList[i];
        const exp = this.monsterList.getExp();
        const money = this.monsterList.getMoney();
        user.addExp(exp); // 增加经验值
        user.addMoney(money); // 增加金钱

        await user.updateUserData({
          id: user.id,
          level: user.level,
          exp: user.exp,
          money: user.money,
          attributePoints: user.attributePoints,
        });
      }
    } else if (status === 'lose')
    {
      await this.session.send([h.at(this.session.username), '很遗憾，所有人都死亡，游戏结束。']);
    } else
    {
      await this.session.send([h.at(this.session.username), '游戏发生错误，无法继续进行。']);
    }

    this.party.status = 'completed'; // 更新组队状态为已完成
  }
}