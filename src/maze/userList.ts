import { Context } from "koishi";
import { User } from "./user";

export class UserList
{
  userList: User[]; // 用户列表
  ctx: Context; // Koishi 上下文

  constructor(userList: User[], ctx: Context)
  {
    this.userList = userList;
    this.ctx = ctx;
  }

  getMinHpUser()
  {
    if (this.userList.length === 0) return null;

    let minHpUser = this.userList[0];
    for (const user of this.userList)
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
    for (const user of this.userList)
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
    const user = this.userList[0];
    await this.ctx.database.remove('mazeParty', { id: user.party.id });
    user.party = null;
    await this.ctx.database.remove('mazeUserParty', { id: user.playerId });
  }
}