import { Context } from "koishi";
import { User } from "./user";
import { host } from "..";
import { UserList } from "./userList";

export class Monster
{
  name: string; // 怪物名称
  ctx: Context; // Koishi 上下文
  hp: number; // 用户生命值
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
  userList: User[];

  constructor(user: User, ctx: Context, userList: User[])
  {
    this.ctx = ctx;
    this.initialize();
    // 怪物以每5级作为一个分水岭
    const level = Math.floor(user.level / 5);
    this.level = level * 5;
    this.userList = userList; // 用户列表
  }

  private async initialize()
  {
    let monsterData: Monster;
    try
    {
      monsterData = await this.ctx.http.post(`${host}/monster/get/info`, { level: this.level });
    } catch (err)
    {
      throw '无法获取用户信息' + err;
    }

    this.name = monsterData.name; // 怪物名称
    this.hp = monsterData.hp; // 怪物生命值
    this.mp = monsterData.mp; // 怪物魔法值
    this.physicalAttack = monsterData.physicalAttack; // 物理攻击力
    this.physicalCrit = monsterData.physicalCrit; // 物理暴击率
    this.magicAttack = monsterData.magicAttack; // 魔法攻击力
    this.magicCrit = monsterData.magicCrit; // 魔法暴击率
    this.physicalDefense = monsterData.physicalDefense; // 物理防御力
    this.magicDefense = monsterData.magicDefense; // 魔法防御力
    this.speed = monsterData.speed; // 速度
    this.healingPower = monsterData.healingPower; // 治疗量
    this.shieldValue = monsterData.shieldValue; // 护盾值 
    this.shieldBreak = monsterData.shieldBreak; // 护盾破坏力
    this.hp = this.hp + Math.floor(Math.random() * this.level); // 怪物生命值随机增加
  }

  public useSkill()
  {
    // 随机使用一种技能
    // 1. 物理攻击
    // 2. 魔法攻击
    // 3. 格挡
    // 4. 弹反

    const skillIndex = Math.floor(Math.random() * 4);

    switch (skillIndex)
    {
      case 0: {

      }

      case 1: {

      }

      case 2: {

      }

      case 3: {

      }

      default: {
        console.log('未知技能');
      }
    }
  }

  // 物理攻击
  public physicalAttackSkill()
  {
    const userListClass = new UserList(this.userList);
    const minHpUser = userListClass.getMinHpUser();

    if (!minHpUser) return;

    // 计算怪物物理攻击伤害(基础攻击力+暴击伤害)
    const monsterDamage = this.physicalAttack + (this.physicalCrit > Math.random() ? this.physicalAttack * 0.5 : 0);
    // 计算怪物破盾能力(基础攻击力*护盾破坏值)
    const monsterShieldBreak = this.physicalAttack * this.shieldBreak;

    // 计算用户物理防御
    const userDefense = minHpUser.physicalDefense;
    // 计算用户护盾值
    const userShieldValue = minHpUser.shieldValue;

    // 计算用户实际护盾值
    const userActualShieldValue = userShieldValue - monsterShieldBreak;

    if (userActualShieldValue <= 0)
    {
      minHpUser.shieldValue = 0;
    }

    // 计算用户实际伤害
    minHpUser.hp = minHpUser.hp + userDefense - monsterDamage;

    if (minHpUser.hp <= 0)
    {
      minHpUser.hp = 0;
      // 用户死亡逻辑
      this.ctx.logger.info(`${minHpUser.playerId} 被 ${this.name} 击败`);
    } else
    {
      // 更新用户数据
      this.ctx.logger.info(`${minHpUser.playerId} 被 ${this.name} 攻击，剩余生命值：${minHpUser.hp}`);
    }

  }

  // 魔法攻击
  public magicAttackSkill()
  {
    const userListClass = new UserList(this.userList);
    const minHpUser = userListClass.getMinHpUser();
  }

  // 格挡
  public blockSkill()
  {
  }

  // 弹反
  public parrySkill()
  {
  }
}