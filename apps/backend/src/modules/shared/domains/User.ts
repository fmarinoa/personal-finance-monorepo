export class User {
  id!: string;
  name!: string;
  middleName!: string;
  lastName!: string;
  motherLastName!: string;
  email!: string;

  constructor(data: Partial<User>) {
    Object.assign(this, data);
  }
}
