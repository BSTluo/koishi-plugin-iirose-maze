import { Context, h } from "koishi";
import { User } from "./user";
import { UserList } from "./userList";
import { Monster } from "./monster";
import { MazeGame } from "./mazeGame";

export class MonsterList
{
  ctx: Context; // Koishi 上下文
  monsterList: Monster[] = []; // 怪物列表
  userListClass: UserList; // 用户列表类
  mazeGame: MazeGame;

  constructor(ctx: Context, mazeGame: MazeGame)
  {
    this.ctx = ctx;
    this.userListClass = mazeGame.userList; // 用户列表类
    this.mazeGame = mazeGame; // 迷宫游戏实例
  }

  async initialize()
  {
    for (const user of this.userListClass.userObjList)
    {
      const monster = new Monster(user, this.ctx, this.userListClass, this.mazeGame);
      this.monsterList.push(await monster.initialize());
    }

    return this;
  }

  isDie()
  {
    for (const monster of this.monsterList)
    {
      if (monster.hp > 0)
      {
        return false; // 只要有一个用户的生命值大于0，就认为没有人死亡
      }
    }
    return true; // 所有用户的生命值都小于等于0，认为所有人都死亡
  }
}