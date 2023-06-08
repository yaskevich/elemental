import passport from 'passport';
import passportJWT from 'passport-jwt';
import jwt from 'jsonwebtoken';
import db from './db.js';

const secretOrKey = process.env.SECRET;
if (!secretOrKey) {
  console.log('Application secret cannot be empty! Exiting...');
  process.exit();
}

const jwtFromRequest = passportJWT.ExtractJwt.fromAuthHeaderAsBearerToken();

passport.use(new passportJWT.Strategy({ jwtFromRequest, secretOrKey }, async (token, next) => next(null, (await db.getUserDataByID(token.sub)) || false)));

export const auth = passport.authenticate('jwt', { session: false });

export async function login(email, password, issuer, info) {
  const user = await db.getUserData(email, password);
  if (user?.id && !user?.error) {
    const token = jwt.sign({
      iss: issuer,
      sub: user.id,
      iat: new Date().getTime(),
      exp: new Date().setDate(new Date().getDate() + 1),
    }, secretOrKey);
    Object.assign(user, { token, ...info });
    console.log(`LOGIN OK: [${email}]`);
  } else {
    console.log(`LOGIN FAIL: [${email}]•[${password}]►${user?.error}◄`);
  }
  return user;
}
