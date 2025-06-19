import { Context, h } from "koishi";
import { User } from "./user";
import { host } from "..";
import { UserList } from "./userList";
import { MazeGame } from "./mazeGame";

export class Monster
{
  name: string; // 怪物名称
  ctx: Context; // Koishi 上下文
  hp: number; // 用户生命值
  mp: number; // 用户魔法值
  baseMp: number;
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
  userList: UserList;
  mazeGame: MazeGame;
  monsterIndex: number;
  exp: number; // 怪物经验值
  money: number; // 怪物掉落金币
  basicShieldValue: number;

  constructor(user: User, ctx: Context, userList: UserList, mazeGame: MazeGame, monsterIndex: number)
  {
    this.ctx = ctx;
    // 怪物以每5级作为一个分水岭
    // console.log(user)
    const level = Math.floor(user.level / 5);
    this.level = level * 5;
    this.userList = userList; // 用户列表
    this.mazeGame = mazeGame; // 迷宫游戏实例
    this.monsterIndex = monsterIndex;
  }

  async initialize()
  {
    let monsterData: Monster;
    try
    {
      monsterData = await this.ctx.http.post(`${host}/monster/get/info`, { level: this.level });
    } catch (err)
    {
      const errorMessage = err.response ? err.response.data : err.message;
      console.log(err);
      throw '无法获取怪物信息' + errorMessage;
    }

    this.name = monsterData.name; // 怪物名称
    this.hp = monsterData.hp; // 怪物生命值
    this.mp = monsterData.mp; // 怪物魔法值
    this.baseMp = monsterData.mp; // 怪物基础魔法值
    this.physicalAttack = monsterData.physicalAttack; // 物理攻击力
    this.physicalCrit = (monsterData.physicalCrit) / 100; // 物理暴击率
    this.magicAttack = monsterData.magicAttack; // 魔法攻击力
    this.magicCrit = (monsterData.magicCrit) / 100; // 魔法暴击率
    this.physicalDefense = monsterData.physicalDefense; // 物理防御力
    this.magicDefense = monsterData.magicDefense; // 魔法防御力
    this.speed = monsterData.speed; // 速度
    this.healingPower = monsterData.healingPower; // 治疗量
    this.shieldValue = monsterData.shieldValue; // 护盾值 
    this.shieldBreak = (monsterData.shieldBreak) / 100;  // 护盾破坏力
    this.hp = this.hp + Math.floor(Math.random() * this.level); // 怪物生命值随机增加
    this.basicShieldValue = monsterData.shieldValue; // 保存基础护盾值
    this.exp = monsterData.exp; // 怪物经验值
    this.money = monsterData.money; // 怪物掉落金币
    return this;
  }

  async useSkill()
  {
    // 随机使用一种技能
    // 1. 物理攻击
    // 2. 魔法攻击
    // 3. 格挡
    // 4. 弹反
    this.blockStatus = false; // 重置格挡状态
    this.parryStatus = false; // 重置弹反状态
    this.basicShieldValue = this.shieldValue; // 重置基础护盾值

    this.mp += 2;
    if (this.mp > this.baseMp) { this.mp = this.baseMp; } // 确保魔法值不超过最大值

    const skillIndex = Math.floor(Math.random() * 100);

    switch (true)
    {
      case (skillIndex >= 0 && skillIndex < 45): {
        await this.physicalAttackSkill();
        return;
      }

      case (skillIndex >= 45 && skillIndex < 90): {
        await this.magicAttackSkill();
        return;
      }

      case (skillIndex >= 90 && skillIndex < 97): {
        await this.blockSkill();
        return;
      }

      case (skillIndex >= 97 && skillIndex <= 100): {
        await this.parrySkill();
        return;
      }

      default: {
        console.log('未知技能');
      }
    }
  }

  // 物理攻击
  async physicalAttackSkill()
  {
    const userListClass = this.userList;
    const minHpUser = Math.floor(Math.random() * 2) == 0 ? userListClass.getMinHpUser() : this.userList.userObjList[Math.floor(Math.random() * this.userList.userObjList.length)];

    if (!minHpUser) return;

    // 计算怪物物理攻击伤害(基础攻击力+暴击伤害)
    let monsterDamage = this.physicalAttack + (this.physicalCrit > Math.random() ? this.physicalAttack * 1.5 : 0);
    // 计算怪物破盾能力(基础攻击力*护盾破坏值)
    let monsterShieldBreak = Math.trunc(this.physicalAttack * (1 + this.shieldBreak));

    if (minHpUser.blockStatus)
    {
      monsterDamage *= 0.5; // 如果怪物处于格挡状态，伤害减半
      monsterShieldBreak *= 0.5; // 护盾破坏力也减半
    }

    if (minHpUser.parryStatus)
    {
      monsterDamage = 0; // 如果怪物处于弹反状态，伤害为0
      monsterShieldBreak = 0; // 护盾破坏力也为0
      const parryDamage = (monsterDamage + monsterShieldBreak) * 0.1; // 弹反伤害
      this.hp -= parryDamage;
      await minHpUser.session.send([h.at(minHpUser.id), '使用了弹反技能，', this.name, `受到反弹伤害${parryDamage}点，剩余生命值：${this.hp}点。`]);
      return; // 直接返回，不进行后续计算
    }

    // 计算用户物理防御
    const userDefense = minHpUser.physicalDefense;
    // 计算用户护盾值
    const userShieldValue = minHpUser.shieldValue;

    // 计算用户实际护盾值
    const userActualShieldValue = userShieldValue - monsterShieldBreak;

    if (userActualShieldValue <= 0 && this.basicShieldValue > 0)
    {
      minHpUser.shieldValue = 0;
      await minHpUser.session.send([h.at(minHpUser.id), `被 ${this.name} 使用物理破盾${monsterShieldBreak}点，护盾清空。`]);
    } else if (this.basicShieldValue > 0)
    {
      await minHpUser.session.send([h.at(minHpUser.id), `被 ${this.name} 使用物理攻击${monsterShieldBreak}点，剩余护盾值：${minHpUser.shieldValue}。`]);
    }

    // 计算用户实际伤害
    let damage = userDefense - monsterDamage;

    if (userActualShieldValue <= 0) { damage += userActualShieldValue; }

    minHpUser.hp = minHpUser.hp + damage;

    await this.isDie(minHpUser, '物理攻击', damage);

  }

  // 魔法攻击
  async magicAttackSkill()
  {
    const userListClass = this.userList;
    const minHpUser = Math.floor(Math.random() * 2) == 0 ? userListClass.getMinHpUser() : this.userList.userObjList[Math.floor(Math.random() * this.userList.userObjList.length)];

    if (!minHpUser) return;

    // 计算怪物魔法攻击伤害(基础魔法攻击力+暴击伤害)
    let monsterDamage = this.magicAttack + (this.magicCrit > Math.random() ? this.magicAttack * 1.5 : 0);
    // 计算怪物破盾能力(基础魔法攻击力*护盾破坏值)
    let monsterShieldBreak = Math.trunc(this.physicalAttack * (1 + this.shieldBreak));

    if (minHpUser.blockStatus)
    {
      monsterDamage *= 0.5; // 如果怪物处于格挡状态，伤害减半
      monsterShieldBreak *= 0.5; // 护盾破坏力也减半
    }

    if (minHpUser.parryStatus)
    {
      monsterDamage = 0; // 如果怪物处于弹反状态，伤害为0
      monsterShieldBreak = 0; // 护盾破坏力也为0
      const parryDamage = (monsterDamage + monsterShieldBreak) * 0.1; // 弹反伤害
      this.hp -= parryDamage;
      await minHpUser.session.send([h.at(minHpUser.id), '使用了弹反技能，', this.name, `受到反弹伤害${parryDamage}点，剩余生命值：${this.hp}点。`]);
      return; // 直接返回，不进行后续计算
    }

    // 计算用户魔法防御
    const userDefense = minHpUser.magicDefense;
    // 计算用户护盾值
    const userShieldValue = minHpUser.shieldValue;

    // 计算用户实际护盾值
    const userActualShieldValue = userShieldValue - monsterShieldBreak;

    if (userActualShieldValue <= 0 && this.basicShieldValue > 0)
    {
      minHpUser.shieldValue = 0;
      await minHpUser.session.send([h.at(minHpUser.id), `被 ${this.name} 使用魔法破盾${monsterShieldBreak}点，护盾清空。`]);
    } else if (this.basicShieldValue > 0)
    {
      await minHpUser.session.send([h.at(minHpUser.id), `被 ${this.name} 使用魔法攻击${monsterShieldBreak}点，剩余护盾值：${minHpUser.shieldValue}。`]);
    }

    // 计算用户实际伤害
    let damage = userDefense - monsterDamage;

    if (userActualShieldValue <= 0) { damage += userActualShieldValue; }

    minHpUser.hp = minHpUser.hp + damage;

    await this.isDie(minHpUser, '魔法攻击', damage);
  }

  blockStatus: boolean = false; // 是否处于格挡状态

  // 格挡
  async blockSkill()
  {
    this.mp -= 5;
    if (this.mp < 0)
    {
      await this.mazeGame.session.send([h.at(this.mazeGame.session.username), '魔法值不足，无法使用格挡技能。']);
      return; // 如果魔法值不足，直接返回
    }
    this.blockStatus = true;
    await this.mazeGame.session.send([this.name, '使用了格挡技能。']);
  }

  parryStatus: boolean = false; // 是否处于弹反状态
  // 弹反
  async parrySkill()
  {
    this.mp -= 10;
    if (this.mp < 0)
    {
      await this.mazeGame.session.send([h.at(this.mazeGame.session.username), '魔法值不足，无法使用弹反技能。']);
      return; // 如果魔法值不足，直接返回
    }
    this.parryStatus = true; // 设置弹反状态
    await this.mazeGame.session.send([this.name, '使用了弹反技能。']);
  }

  die()
  {
    this.mazeGame.monsterList.monsterList.splice(this.monsterIndex, 1); // 从怪物列表中移除自己
  }

  async isDie(user: User, action: string, damage: number)
  {
    if (user.hp <= 0)
    {
      user.hp = 0;
      // 用户死亡逻辑
      user.status = 'inGame-die';
      // 更新用户状态
      await user.session.send([h.at(user.id), `被 ${this.name} 使用${action}，受到${damage}伤害，死亡。`]);

      user.die();
    } else
    {
      // 更新用户数据
      await user.session.send([h.at(user.id), `被 ${this.name} 使用${action}，受到${damage}伤害，剩余生命值：${user.hp}`]);
    }

    if (this.userList.isDie())
    {
      await user.session.send([h.at(user.id), '所有人都死亡，游戏结束。']);
      await this.mazeGame.stop('lose');
    }
  }
}