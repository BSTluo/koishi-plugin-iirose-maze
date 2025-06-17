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
  createMonster: Monster[]; // 创建的怪物实例

  constructor(ctx: Context, mazeGame: MazeGame)
  {
    this.ctx = ctx;
    this.userListClass = mazeGame.userList; // 用户列表类
    this.mazeGame = mazeGame; // 迷宫游戏实例
  }

  async initialize()
  {
    for (let i = 0; i < this.userListClass.userObjList.length; i++)
    {
      const user = this.userListClass.userObjList[i];
      const monster = new Monster(user, this.ctx, this.userListClass, this.mazeGame, i);
      this.monsterList.push(await monster.initialize());
    }

    this.createMonster = this.monsterList;
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

  getExp()
  {
    let totalExp = 0;
    const length = this.createMonster.length;
    for (const monster of this.createMonster)
    {
      totalExp += monster.exp;
    }

    return totalExp / length; // 返回总经验值
  }

  getMoney()
  {
    let totalMoney = 0;
    const length = this.createMonster.length;
    for (const monster of this.createMonster)
    {
      totalMoney += monster.money;
    }

    return totalMoney / length; // 返回总经验值
  }
}