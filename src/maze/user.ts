import { Context, Session } from "koishi";
import { host } from "..";
import { mazeParty } from ".";

export class User
{
  playerId: string; // 用户ID
  partyId: string | null; // 组队ID
  status: 'free' | 'waiting' | 'inParty' | 'inGame-alive' | 'inGame-die';
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
  session: Session; // 用户会话
  party: mazeParty;// 用户所在的队伍


  constructor(playerId: string, ctx: Context, session: Session, party: mazeParty)
  {
    this.playerId = playerId; // 用户ID
    this.partyId = null; // 组队ID
    this.status = 'waiting'; // 用户状态: 'waiting', 'inParty', 'inGame'
    this.ctx = ctx;
    this.session = session; // 用户会话
    this.party = party;
    this.initialize();
  }

  private async initialize()
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
  }

  // 物理攻击
  async physicalAttackSkill()
  {

  }

  // 魔法攻击
  async magicAttackSkill()
  {

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
  async healingSkill()
  {

  }
}