import { Context, h, Schema } from 'koishi';
import { User } from '../maze/user';
import { host } from '..';

namespace Core
{
  export interface Config
  {
    // Add your configuration options here
  }
}

class Core
{
  static name = 'iirose-maze-mine';

  static Config: Schema<Core.Config> = Schema.object({});

  ctx: Context;
  config: Core.Config;

  constructor(ctx: Context, config: Core.Config)
  {
    this.ctx = ctx;
    this.config = config;

    this.ctx.command('maze', '花园迷宫');

    this.ctx.command('maze.reg', '注册迷宫号').alias('注册迷宫号').action(async v =>
    {
      let userData: User;
      const uid = v.session.userId;
      try
      {
        userData = await this.ctx.http.post(`${host}/user/get/register`, { id: uid });
      } catch (err)
      {
        const errorMessage = err.response ? err.response.data : err.message;
        if (errorMessage == 'User has registered.')
        {
          v.session.send([h.at(v.session.username), '你已注册，请勿重复注册。']);
          return;
        } else
        {
          throw '无法注册用户信息' + err;
        }
      }

      v.session.send([h.at(v.session.username), '你已成功注册！']);

    });

    this.ctx.command('maze.me', '迷宫号信息').alias('迷宫号信息').action(async v =>
    {
      const uid = v.session.userId;

      const user = await (new User(uid, this.ctx, v.session, null)).initialize();


      return [
        h.at(v.session.username),
        `\n\n你的迷宫号信息如下：\n\n`,
        `生命值: ${user.hp}\n`,
        `魔法值: ${user.mp}\n`,
        `等级: ${user.level}\n`,
        `物理攻击力: ${user.physicalAttack}\n`,
        `物理暴击率: ${user.physicalCrit}\n`,
        `魔法攻击力: ${user.magicAttack}\n`,
        `魔法暴击率: ${user.magicCrit}\n`,
        `物理防御力: ${user.physicalDefense}\n`,
        `魔法防御力: ${user.magicDefense}\n`,
        `速度: ${user.speed}\n`,
        `治疗量: ${user.healingPower}\n`,
        `护盾值: ${user.shieldValue}\n`,
        `护盾破坏力: ${user.shieldBreak}\n`,
        `经验值: ${user.exp}\n`,
        `金币: ${user.money}\n`
      ];
    });
  }

}

export default Core;
