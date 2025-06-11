import { Context, h } from "koishi";
import { User } from "./user";
import { UserList } from "./userList";
import { Monster } from "./monster";

export class MonsterList
{
  ctx: Context; // Koishi 上下文
  monsterList: Monster[] = []; // 怪物列表
  userListClass: UserList; // 用户列表类

  constructor(ctx: Context, userList: UserList)
  {
    this.ctx = ctx;
    const userListClass = userList;
    this.userListClass = userListClass; // 用户列表类
  }

  async initialize()
  {
    for (const user of this.userListClass.userObjList)
    {
      const monster = new Monster(user, this.ctx, this.userListClass);
      this.monsterList.push(await monster.initialize());
    }

    return this;
  }
}