import { exit } from "node:process";

import { db } from "./client";
import { Users } from "./schema";

await db
  .insert(Users)
  .values({
    avatarUrl: "",
    email: "chris.watts.t@gmail.com",
    firstName: "Chris",
    id: "user_2i5HNDos78bZY6QHCmI5wjIjlkx",
    lastName: "Watts",
  })
  .returning({ id: Users.id })
  .onConflictDoNothing();

exit(0);
