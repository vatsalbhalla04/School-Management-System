import argon2 from "argon2";

async function hashPassword(rawPassword) {
  return await argon2.hash(rawPassword, {
    type: argon2.argon2id,
    memoryCost: 2 ** 16, // 64 MB
    timeCost: 5, // Iterations
    parallelism: 1,  // Threads
  });
}

export default hashPassword