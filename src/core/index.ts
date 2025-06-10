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

    this.ctx.command('maze.reg').alias('注册迷宫号').action(async v =>
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
        } else
        {
          throw '无法注册用户信息' + err;
        }
      }

      v.session.send([h.at(v.session.username), '你已成功注册！']);

    });
  }

}

export default Core;
