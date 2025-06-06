import { User } from "./user";

export class UserList
{
  userList: User[]; // 用户列表

  constructor(userList: User[])
  {
    this.userList = userList;
  }

  getMinHpUser()
  {
    if (this.userList.length === 0) return null;

    let minHpUser = this.userList[0];
    for (const user of this.userList)
    {
      if (user.hp < minHpUser.hp)
      {
        minHpUser = user;
      }
    }
    return minHpUser;
  }
}