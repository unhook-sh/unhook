import { exit } from "node:process";

import { db } from "./client";
import { User } from "./schema";

await db
  .insert(User)
  .values({
    avatarUrl: "",
    email: "chris.watts.t@gmail.com",
    firstName: "Chris",
    id: "user_2i5HNDos78bZY6QHCmI5wjIjlkx",
    lastName: "Watts",
  })
  .returning({ id: User.id })
  .onConflictDoNothing();

exit(0);
