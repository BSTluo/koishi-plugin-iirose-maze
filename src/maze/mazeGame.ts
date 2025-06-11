import { Context, Session } from "koishi";
import { User } from "./user";
import { MonsterList } from "./monsterList";
import { UserList } from "./userList";
import { mazeParty } from ".";

export class MazeGame
{
  userList: User[]; // 用户列表
  monsterListObj: MonsterList; // 怪物列表
  userListObj: UserList;
  ctx: Context; // Koishi 上下文
  session: Session; // 会话对象
  playerIdList: string[];
  party: mazeParty;

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
    const userDataList = await this.getUserDataList(this.playerIdList, this.session, this.party);

    this.userList = userDataList; // 初始化用户列表
    this.monsterListObj = await (new MonsterList(this.ctx, this.userList)).initialize(); // 初始化怪物列表
    this.userListObj = new UserList(this.ctx, this.userList); // 初始化用户列表对象
    return this; // 返回当前实例
  }

  private async getUserDataList(playerIdList: string[], session: Session, party?: mazeParty)
  {
    let userDataList: User[] = [];

    for (const playerId of playerIdList)
    {
      const user = new User(playerId, this.ctx, session, party);
      userDataList.push(await user.initialize());
      const data = {
        id: user.id,
        partyId: party.id
      };
      await this.ctx.database.upsert('mazeUserParty', [data]); // 更新或插入用户数据到数据库
    }

    return userDataList;
  }

  getMonsterInfo()
  {
    let openingMessage = '';

    for (let i = 0; i < this.monsterListObj.monsterList.length; i++)
    {
      const monster = this.monsterListObj.monsterList[i]; // 获取怪物信息
      openingMessage += `${i + 1}. ${monster.name} HP：${monster.hp}\n`;
      i++;
    }

    return openingMessage; // 返回怪物信息
  }

  // 开始游戏
  start()
  {
    this.session.send('游戏开始，请准备好！'); // 发送游戏开始消息
    this.session.send('当前怪物信息：\n' + this.getMonsterInfo()); // 发送当前怪物信息

  }

  // 结束游戏
  stop()
  {

  }
}