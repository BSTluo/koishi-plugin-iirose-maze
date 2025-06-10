import { Context, Session } from "koishi";
import { User } from "./user";
import { MonsterList } from "./monsterList";
import { UserList } from "./userList";

export class MazeGame
{
  userList: User[]; // 用户列表
  monsterListObj: MonsterList; // 怪物列表
  userListObj: UserList;
  ctx: Context; // Koishi 上下文
  session: Session; // 会话对象

  constructor(ctx: Context, session: Session, userList: User[])
  {
    this.ctx = ctx; // 设置上下文
    this.session = session; // 设置会话对象
    this.userList = userList; // 初始化用户列表
    this.monsterListObj = new MonsterList(ctx, userList); // 初始化怪物列表
    this.userListObj = new UserList(ctx, userList); // 初始化用户列表对象
  }

  getMonsterInfo()
  {
    let openingMessage = '';

    for (let i = 0; i < this.monsterListObj.monsterList.length; i++)
    {
      const monster = this.monsterListObj.monsterList[i]; // 获取怪物信息
      openingMessage += `${i++}. ${monster.name} HP：${monster.hp}\n`;
    }

    return openingMessage; // 返回怪物信息
  }

  start()
  {
    this.session.send('游戏开始，请准备好！'); // 发送游戏开始消息
    this.session.send('当前怪物信息：\n' + this.getMonsterInfo()); // 发送当前怪物信息
    
    
  }
}