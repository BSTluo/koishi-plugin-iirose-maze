import { Context, h } from "koishi";
import { User } from "./user";
import { host } from "..";
import { UserList } from "./userList";
import { Monster } from "./monster";

export class MonsterList
{
  ctx: Context; // Koishi 上下文
  monsterList: Monster[] = []; // 怪物列表
  userList: User[]; // 用户列表
  userListClass: UserList; // 用户列表类

  constructor(ctx: Context, userList: User[])
  {
    this.ctx = ctx;
    this.userList = userList; // 用户列表
    const userListClass = new UserList(this.ctx, this.userList);
    this.userListClass = userListClass; // 用户列表类
    this.initialize();
  }

  initialize()
  {
    for (const user of this.userList)
    {
      const monster = new Monster(user, this.ctx, this.userList);
      this.monsterList.push(monster);
    }
  }
}