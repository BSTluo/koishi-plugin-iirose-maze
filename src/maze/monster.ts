import { Context } from "koishi";
import { User } from "./user";

export class Monster
{
  name: string; // 怪物名称
  ctx: Context; // Koishi 上下文
  id: string;
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
  exp: number;// 用户经验值
  money: number; // 用户金币

  constructor(user: User, ctx: Context)
  {
    this.ctx = ctx;
  }
}