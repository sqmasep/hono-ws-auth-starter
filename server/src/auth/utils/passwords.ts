// @node-rs/argon2 provides default salt
import * as argon2 from "@node-rs/argon2";

export async function hashPassword(password: string) {
  // TODO we can add peppering here
  // see https://thecopenhagenbook.com/password-authentication#:~:text=Another%20option%20is%20peppering%20where%20you%20use%20a%20secret%20key%20when%20hashing%20the%20password.%20Whereas%20salts%20are%20stored%20alongside%20the%20hashes%2C%20the%20secret%20key%20is%20stored%20in%20a%20separate%20location.%20Rolling%20your%20own%20hashing%20mechanism%20can%20be%20a%20bad%20idea%20so%20this%20should%20only%20be%20done%20if%20the%20algorithm%20you%20use%20supports%20it.
  return argon2.hash(password);
}

export async function verifyPassword(password: string, hash: string) {
  // TODO we can add peppering here
  // see https://thecopenhagenbook.com/password-authentication#:~:text=Another%20option%20is%20peppering%20where%20you%20use%20a%20secret%20key%20when%20hashing%20the%20password.%20Whereas%20salts%20are%20stored%20alongside%20the%20hashes%2C%20the%20secret%20key%20is%20stored%20in%20a%20separate%20location.%20Rolling%20your%20own%20hashing%20mechanism%20can%20be%20a%20bad%20idea%20so%20this%20should%20only%20be%20done%20if%20the%20algorithm%20you%20use%20supports%20it.
  return argon2.verify(hash, password);
}
