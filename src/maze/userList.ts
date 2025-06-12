import { Context, Session } from "koishi";
import { User } from "./user";
import { mazeParty } from ".";
import { MazeGame } from "./mazeGame";

export class UserList
{
  userObjList: User[]; // 用户列表
  ctx: Context; // Koishi 上下文
  userIdList: string[]; // 玩家ID列表
  party: mazeParty;
  session: Session;
  mazeGame: MazeGame;

  constructor(ctx: Context, session: Session, mazeGame: MazeGame)
  {
    this.mazeGame = mazeGame; // 迷宫游戏实例
    this.userIdList = mazeGame.playerIdList;
    this.ctx = ctx;
    this.party = this.mazeGame.party; // 组队信息
    this.session = session; // 用户会话
  }

  async initialize()
  {
    let userDataList: User[] = [];

    for (const playerId of this.userIdList)
    {
      const user = new User(playerId, this.ctx, this.session, this.mazeGame);
      userDataList.push(await user.initialize());
      const data = {
        id: user.id,
        partyId: this.party.id
      };
      await this.ctx.database.upsert('mazeUserParty', [data]); // 更新或插入用户数据到数据库
    }
    this.userObjList = userDataList; // 设置用户对象列表

    return this;
  }

  getMinHpUser()
  {
    if (this.userObjList.length === 0) return null;

    let minHpUser = this.userObjList[0];
    for (const user of this.userObjList)
    {
      if (user.hp < minHpUser.hp)
      {
        minHpUser = user;
      }
    }
    return minHpUser;
  }

  isDie()
  {
    for (const user of this.userObjList)
    {
      if (user.hp > 0)
      {
        return false; // 只要有一个用户的生命值大于0，就认为没有人死亡
      }
    }
    return true; // 所有用户的生命值都小于等于0，认为所有人都死亡
  }

  async killParty()
  {
    const user = this.userObjList[0];
    await this.ctx.database.remove('mazeParty', { id: user.party.id });
    user.party = null;
    await this.ctx.database.remove('mazeUserParty', { id: user.playerId });
  }
}