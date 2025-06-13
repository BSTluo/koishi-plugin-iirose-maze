import { Context, h, Session } from "koishi";
import { host } from "..";
import { mazeParty } from ".";
import { MonsterList } from "./monsterList";
import { UserList } from "./userList";
import { Monster } from "./monster";
import { MazeGame } from "./mazeGame";

export class User
{
  playerId: string; // 用户ID
  partyId: string | null; // 组队ID
  status: 'free' | 'waiting' | 'inParty' | 'inGame-alive' | 'inGame-die';
  ctx: Context; // Koishi 上下文
  id: string;
  hp: number; // 用户生命值
  baseHp: number; // 用户基础生命值
  mp: number; // 用户魔法值
  level: number; // 用户等级
  physicalAttack: number; // 物理攻击力
  physicalCrit: number; // 物理暴击率
  magicAttack: number; // 魔法攻击力
  magicCrit: number; // 魔法暴击率
  physicalDefense: number; // 物理防御力
  magicDefense: number; // 魔法防御力
  speed: number; // 速度
  healingPower: number; // 治疗量
  shieldValue: number; // 护盾值
  shieldBreak: number; // 护盾破坏力
  exp: number;// 用户经验值
  money: number; // 用户金币
  session: Session; // 用户会话
  party: mazeParty;// 用户所在的队伍
  userList: UserList;
  monsterList: MonsterList;
  mazeGame: MazeGame;

  constructor(playerId: string, ctx: Context, session: Session, mazeGame?: MazeGame)
  {
    this.playerId = playerId; // 用户ID
    this.partyId = null; // 组队ID
    this.status = 'waiting'; // 用户状态: 'waiting', 'inParty', 'inGame'
    this.ctx = ctx;
    this.session = session; // 用户会话
    this.mazeGame = mazeGame; // 迷宫游戏实例
    this.party = this.mazeGame.party;
  }

  async initialize()
  {
    let userData: User;
    try
    {
      userData = await this.ctx.http.post(`${host}/user/get/info`, { id: this.playerId });
    } catch (err)
    {
      const errorMessage = err.response ? err.response.data : err.message;
      if (errorMessage == 'User not found')
      {
        this.session.send('用户信息未找到，请先创建用户。\n\n使用指令maze help查看帮助信息。');
        throw '用户信息未找到，请先创建用户。';
      } else
      {
        throw '无法获取用户信息' + err;
      }
    }

    this.id = userData.id; // 用户ID
    this.hp = userData.hp; // 用户生命值
    this.baseHp = userData.hp;
    this.mp = userData.mp; // 用户魔法值
    this.level = userData.level; // 用户等级
    this.physicalAttack = userData.physicalAttack; // 物理攻击力
    this.physicalCrit = userData.physicalCrit; // 物理暴击率
    this.magicAttack = userData.magicAttack; // 魔法攻击力
    this.magicCrit = userData.magicCrit; // 魔法暴击率
    this.physicalDefense = userData.physicalDefense; // 物理防御力
    this.magicDefense = userData.magicDefense; // 魔法防御力
    this.speed = userData.speed; // 速度
    this.healingPower = userData.healingPower; // 治疗量
    this.shieldValue = userData.shieldValue; // 护盾值
    this.shieldBreak = userData.shieldBreak; // 护盾破坏力
    this.exp = userData.exp; // 用户经验值
    this.money = userData.money; // 用户金币

    return this;
  }

  // 物理攻击
  async physicalAttackSkill(monster: Monster)
  {
    // 计算自己的物理攻击伤害(基础攻击力+暴击伤害)
    const monsterDamage = this.physicalAttack + (this.physicalCrit > Math.random() ? this.physicalAttack * 0.5 : 0);
    // 计算自己的破盾能力(基础攻击力*护盾破坏值)
    const monsterShieldBreak = this.physicalAttack * this.shieldBreak;

    // 计算怪物物理防御
    const userDefense = monster.physicalDefense;
    // 计算怪物护盾值
    const userShieldValue = monster.shieldValue;

    // 计算怪物实际护盾值
    const userActualShieldValue = userShieldValue - monsterShieldBreak;

    if (userActualShieldValue <= 0)
    {
      monster.shieldValue = 0;
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用物理破盾，护盾清空。`]);
    } else
    {
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用物理攻击，剩余护盾值：${monster.shieldValue}。`]);
    }

    // 计算怪物实际伤害
    monster.hp = monster.hp + userDefense - monsterDamage;

    if (monster.hp <= 0)
    {
      monster.hp = 0;
      // 怪物死亡逻辑
      // 更新怪物状态
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用物理攻击，死亡。`]);
    } else
    {
      // 更新怪物数据
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用物理攻击，剩余生命值：${monster.hp}`]);
    }

    if (this.monsterList.isDie())
    {
      this.session.send([h.at(this.session.username), '所有人都死亡，游戏结束。']);
      await this.mazeGame.stop('win');
    }
  }

  // 魔法攻击
  async magicAttackSkill(monster: Monster)
  {
    // 计算自己的魔法攻击伤害(基础攻击力+暴击伤害)
    const monsterDamage = this.magicAttack + (this.magicCrit > Math.random() ? this.magicAttack * 0.5 : 0);
    // 计算自己的破盾能力(基础攻击力*护盾破坏值)
    const monsterShieldBreak = this.magicAttack * this.shieldBreak;

    // 计算怪物魔法防御
    const userDefense = monster.magicDefense;
    // 计算怪物护盾值
    const userShieldValue = monster.shieldValue;

    // 计算怪物实际护盾值
    const userActualShieldValue = userShieldValue - monsterShieldBreak;

    if (userActualShieldValue <= 0)
    {
      monster.shieldValue = 0;
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用魔法破盾，护盾清空。`]);
    } else
    {
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用魔法攻击，剩余护盾值：${monster.shieldValue}。`]);
    }

    // 计算怪物实际伤害
    monster.hp = monster.hp + userDefense - monsterDamage;

    if (monster.hp <= 0)
    {
      monster.hp = 0;
      // 怪物死亡逻辑
      // 更新怪物状态
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用魔法攻击，死亡。`]);
    } else
    {
      // 更新怪物数据
      this.session.send([monster.name, '被 ', h.at(this.session.username), ` 使用魔法攻击，剩余生命值：${monster.hp}`]);
    }

    if (this.monsterList.isDie())
    {
      this.session.send([h.at(this.session.username), '所有人都死亡，游戏结束。']);
      await this.mazeGame.stop('win');
    }
  }

  // 格挡
  public blockSkill()
  {

  }

  // 弹反
  async parrySkill()
  {

  }

  // 治疗技能
  async healingSkill(user: User)
  {
    // 计算治疗量
    const healingAmount = this.healingPower;

    // 增加用户生命值
    user.hp += healingAmount;

    // 确保用户生命值不超过最大值
    if (user.hp > user.baseHp)
    {
      user.hp = user.baseHp; // 恢复到最大生命值
    }

    // 更新用户状态
    user.session.send([h.at(user.id), `被 ${this.id} 使用治愈技能，恢复了 ${healingAmount} 点生命值，当前生命值：${user.hp}`]);
  }

  // 使用物品(下次做)
  async useItem(user: User)
  {

  }

  async action(actionName: string, target: number, userList: UserList, monsterList: MonsterList)
  {
    this.userList = userList; // 设置用户列表
    this.monsterList = monsterList; // 设置怪物列表

    let who = target;

    switch (actionName)
    {
      case '物理攻击':
        if (who < 0 || who >= this.monsterList.monsterList.length) { who = 0; } // 确保目标在有效范围内
        this.physicalAttackSkill(monsterList.monsterList[target]);
        break;
      case '魔法攻击':
        if (who < 0 || who >= this.monsterList.monsterList.length) { who = 0; } // 确保目标在有效范围内
        this.magicAttackSkill(monsterList.monsterList[target]);
        break;
      case '格挡':
        this.blockSkill();
        break;
      case '弹反':
        this.parrySkill();
        break;
      case '治愈':
        if (who < 0 || who >= this.userList.userObjList.length) { who = 0; }
        this.healingSkill(this.userList.userObjList[target]);
        break;
      // case '道具使用':
      //   if (who < 0 || who >= this.userList.userObjList.length) { who = 0; }
      //   this.useItem(this.userList.userObjList[target]);
      //   break;
      default:
        this.session.send([h.at(this.session.username), '输入无效，自动进行物理攻击第一位。']);
        this.physicalAttackSkill(monsterList.monsterList[0]);
    }
  }
}